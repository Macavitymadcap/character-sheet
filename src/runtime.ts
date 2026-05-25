export interface RuntimeConfig {
  accountDelivery: AccountDeliveryConfig;
  databasePath: string;
  hostname: string;
  port: number;
  sessionSecret: string;
}

export interface AccountDeliveryConfig {
  mode: "operator";
  publicBaseUrl?: string;
}

export const localSessionSecret = "local-development-session-secret";

export function resolveRuntimeConfig(env: Record<string, string | undefined> = Bun.env): RuntimeConfig {
  return {
    accountDelivery: resolveAccountDeliveryConfig(env),
    databasePath: env.DB_PATH ?? "character-sheet.sqlite3",
    hostname: env.HOST ?? "0.0.0.0",
    port: parsePort(env.PORT),
    sessionSecret: env.SESSION_SECRET ?? localSessionSecret,
  };
}

function resolveAccountDeliveryConfig(env: Record<string, string | undefined>): AccountDeliveryConfig {
  const mode = env.ACCOUNT_DELIVERY_MODE ?? "operator";
  if (mode !== "operator") {
    throw new Error(`ACCOUNT_DELIVERY_MODE must be operator until email delivery is implemented, received: ${mode}`);
  }

  const publicBaseUrl = parsePublicBaseUrl(env.PUBLIC_BASE_URL);
  return publicBaseUrl ? { mode, publicBaseUrl } : { mode };
}

function parsePort(value: string | undefined) {
  if (value === undefined || value === "") return 3000;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer between 1 and 65535, received: ${value}`);
  }

  return port;
}

function parsePublicBaseUrl(value: string | undefined) {
  if (value === undefined || value.trim() === "") return undefined;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`PUBLIC_BASE_URL must be a valid http(s) URL, received: ${value}`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`PUBLIC_BASE_URL must be a valid http(s) URL, received: ${value}`);
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";

  return parsed.toString().replace(/\/$/, "");
}
