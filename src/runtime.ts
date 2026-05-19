export interface RuntimeConfig {
  databasePath: string;
  hostname: string;
  port: number;
  sessionSecret: string;
}

export const localSessionSecret = "local-development-session-secret";

export function resolveRuntimeConfig(env: Record<string, string | undefined> = Bun.env): RuntimeConfig {
  return {
    databasePath: env.DB_PATH ?? "character-sheet.sqlite3",
    hostname: env.HOST ?? "0.0.0.0",
    port: parsePort(env.PORT),
    sessionSecret: env.SESSION_SECRET ?? localSessionSecret,
  };
}

function parsePort(value: string | undefined) {
  if (value === undefined || value === "") return 3000;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer between 1 and 65535, received: ${value}`);
  }

  return port;
}
