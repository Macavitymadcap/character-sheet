#!/usr/bin/env bun

interface HostedHealthResponse {
  checks?: {
    assets?: boolean;
    database?: boolean;
  };
  ok?: boolean;
}

type HostedHealthFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export function resolveHostedHealthUrl(input: string | undefined, env: Record<string, string | undefined> = Bun.env) {
  const value = input ?? env.HOSTED_HEALTH_URL;
  if (!value) throw new Error("Pass a hosted URL or set HOSTED_HEALTH_URL.");

  const url = new URL(value);
  if (url.pathname === "/" || url.pathname === "") url.pathname = "/readyz";

  return url.toString();
}

export async function checkHostedHealth(
  url: string,
  fetcher: HostedHealthFetcher = fetch,
): Promise<HostedHealthResponse> {
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
    },
  });
  const body = await response.json() as HostedHealthResponse;
  if (!response.ok || body.ok !== true || body.checks?.assets !== true || body.checks?.database !== true) {
    throw new Error(`Hosted readiness check failed for ${url}: ${JSON.stringify(body)}`);
  }

  return body;
}

if (import.meta.main) {
  const url = resolveHostedHealthUrl(Bun.argv[2]);
  const body = await checkHostedHealth(url);
  console.log(`Hosted readiness OK at ${url}`);
  console.log(`Database: ${body.checks?.database ? "ok" : "failed"}`);
  console.log(`Assets: ${body.checks?.assets ? "ok" : "failed"}`);
}
