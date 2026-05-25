import { describe, expect, test } from "bun:test";
import { checkHostedHealth, resolveHostedHealthUrl } from "./hosted-health";

describe("hosted health check", () => {
  test("resolves hosted roots to the readiness endpoint", () => {
    expect(resolveHostedHealthUrl("https://campaign-ledger.example.com")).toBe(
      "https://campaign-ledger.example.com/readyz",
    );
    expect(resolveHostedHealthUrl(undefined, { HOSTED_HEALTH_URL: "https://campaign-ledger.example.com/healthz" }))
      .toBe("https://campaign-ledger.example.com/healthz");
  });

  test("requires database and asset readiness", async () => {
    const okFetch = async () => Response.json({
      checks: {
        assets: true,
        database: true,
      },
      ok: true,
    });
    const failedFetch = async () => Response.json({
      checks: {
        assets: false,
        database: true,
      },
      ok: false,
    }, { status: 503 });

    await expect(checkHostedHealth("https://campaign-ledger.example.com/readyz", okFetch))
      .resolves.toMatchObject({ ok: true });
    await expect(checkHostedHealth("https://campaign-ledger.example.com/readyz", failedFetch))
      .rejects.toThrow("Hosted readiness check failed");
  });
});
