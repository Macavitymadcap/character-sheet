import { setTimeout as delay } from "node:timers/promises";
import { createServer, type IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import type { Hono } from "hono";
import { createApp } from "../../src/app";
import { AuthService, PasswordService, SessionService } from "../../src/auth";
import { createSqliteDatabase } from "../../src/db";

export function createInMemoryApp(appName = "Character Sheet", secret = "local-script-session-secret") {
  process.env.CHARACTER_SHEET_ASSET_ROOT ??= `${tmpdir()}/character-sheet-script-assets`;
  const databaseRuntime = createSqliteDatabase({ path: ":memory:" });
  const passwordService = new PasswordService();
  const sessionService = new SessionService({
    authRepository: databaseRuntime.repositories.authRepository,
    secret,
  });
  const app = createApp({
    appName,
    authService: new AuthService({
      authRepository: databaseRuntime.repositories.authRepository,
      passwordService,
    }),
    sessionService,
    ...databaseRuntime.repositories,
  });

  return {
    app,
    close: () => databaseRuntime.close(),
    databaseRuntime,
    sessionService,
  };
}

interface LocalServer {
  port: number;
  stop: (force?: boolean) => void;
}

export async function startLocalServer(
  app: Pick<Hono, "fetch">,
  {
    envName,
    hostname = "127.0.0.1",
  }: {
    envName?: string;
    hostname?: string;
  } = {},
): Promise<LocalServer> {
  const requestedPort = envName ? getRequestedPort(envName) : undefined;

  for (const port of requestedPort === undefined ? getCandidatePorts() : [requestedPort]) {
    try {
      const server = createServer(async (request, response) => {
        try {
          const webResponse = await app.fetch(await toWebRequest(request, hostname, port));
          response.statusCode = webResponse.status;
          webResponse.headers.forEach((value, key) => {
            response.setHeader(key, value);
          });

          const body = await webResponse.arrayBuffer();
          response.end(Buffer.from(body));
        } catch (error) {
          response.statusCode = 500;
          response.end(error instanceof Error ? error.message : "Internal server error");
        }
      });

      await listen(server, port, hostname);

      return {
        port,
        stop: () => server.close(),
      };
    } catch (error) {
      if (requestedPort !== undefined && isAddressInUse(error)) {
        throw new Error(`Requested ${envName} ${requestedPort} is already in use.`);
      }
      if (requestedPort === undefined && isAddressInUse(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not find an available local port.");
}

export async function waitForHttp(url: string, attempts = 40, delayMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}

    await delay(delayMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export async function login(baseUrl: string, email: string, password = "password123") {
  const response = await fetch(`${baseUrl}/login`, {
    body: new URLSearchParams({ email, password }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    redirect: "manual",
  });
  const setCookie = response.headers.get("set-cookie");
  if (response.status !== 303 || !setCookie) {
    throw new Error(`Failed to log in ${email}: ${response.status}`);
  }

  return setCookie.split(";")[0] ?? "";
}

export async function requestText(
  url: string,
  {
    body,
    cookie,
    method = "GET",
  }: {
    body?: FormData | URLSearchParams;
    cookie?: string;
    method?: string;
  } = {},
) {
  const isUrlEncoded = body instanceof URLSearchParams;
  const response = await fetch(url, {
    body,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(isUrlEncoded ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    method,
    redirect: "manual",
  });

  return {
    body: await response.text(),
    response,
  };
}

function getRequestedPort(envName: string) {
  const value = Bun.env[envName];
  if (value === undefined) return undefined;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 0) {
    throw new Error(`${envName} must be a non-negative integer, received: ${value}`);
  }

  return port;
}

function isAddressInUse(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "EADDRINUSE"
  );
}

function getCandidatePorts() {
  const start = 3200 + Math.floor(Math.random() * 2000);

  return Array.from({ length: 20 }, (_, index) => start + index);
}

function listen(server: ReturnType<typeof createServer>, port: number, hostname: string) {
  return new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, hostname, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

async function toWebRequest(request: IncomingMessage, hostname: string, port: number) {
  const host = request.headers.host ?? `${hostname}:${port}`;
  const url = new URL(request.url ?? "/", `http://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return new Request(url.toString(), {
    body: hasRequestBody(request) ? await readRequestBody(request) : undefined,
    headers,
    method: request.method ?? "GET",
  });
}

function hasRequestBody(request: IncomingMessage) {
  return request.method !== "GET" && request.method !== "HEAD";
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("error", reject);
    request.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
