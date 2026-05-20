import { existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { describe, expect, test } from "bun:test";

const docs = [
  "README.md",
  "ARCHITECTURE.md",
  "CONTRIBUTING.md",
  "docs/operations/hosted-rehearsal-acceptance.md",
  "docs/operations/hosted-account-runbook.md",
  "docs/deployment/railway.md",
  "docs/tickets/sheet-0019.md",
  "docs/tickets/sheet-0037.md",
];

describe("documentation references", () => {
  test("local markdown links point to existing files", async () => {
    const missing: string[] = [];

    for (const doc of docs) {
      const text = await Bun.file(doc).text();
      for (const match of text.matchAll(/\[[^\]]+\]\((\.{0,2}\/[^)#]+|docs\/[^)#]+|\/[^)#]+)\)/g)) {
        const href = match[1];
        if (!href || href.startsWith("/")) continue;
        const resolved = href.startsWith("docs/")
          ? href
          : normalize(join(dirname(doc), href));
        if (!existsSync(resolved)) missing.push(`${doc} -> ${href}`);
      }
    }

    expect(missing).toEqual([]);
  });

  test("documented verification scripts exist in package.json", async () => {
    const packageJson = await Bun.file("package.json").json() as { name: string; scripts: Record<string, string> };
    const readme = await Bun.file("README.md").text();
    const contributing = await Bun.file("CONTRIBUTING.md").text();
    const documentedScripts = [...`${readme}\n${contributing}`.matchAll(/bun run ([a-z0-9:-]+)/g)]
      .map((match) => match[1])
      .filter((script): script is string => Boolean(script));
    const missing = documentedScripts.filter((script) => !(script in packageJson.scripts));

    expect(missing).toEqual([]);
  });

  test("Railway runtime docs match repository configuration", async () => {
    const packageJson = await Bun.file("package.json").json() as { name: string; scripts: Record<string, string> };
    const railway = await Bun.file("railway.json").json() as {
      deploy: {
        healthcheckPath: string;
        healthcheckTimeout: number;
        startCommand: string;
      };
    };
    const railwayDocs = await Bun.file("docs/deployment/railway.md").text();
    const readme = await Bun.file("README.md").text();

    expect(packageJson.scripts.start).toBe("bun src/index.ts");
    expect(packageJson.scripts["hosted:data"]).toBe("bun scripts/hosted-data.ts");
    expect(packageJson.name).toBe("campaign-ledger");
    expect(railway.deploy.startCommand).toBe("bun run start");
    expect(railway.deploy.healthcheckPath).toBe("/healthz");
    expect(railway.deploy.healthcheckTimeout).toBe(60);
    expect(railwayDocs).toContain("Start command | `bun run start`");
    expect(railwayDocs).toContain("Healthcheck path | `/healthz`");
    expect(railwayDocs).toContain("bun run hosted:data -- prepare");
    expect(railwayDocs).toContain("bun run hosted:data -- backup");
    expect(railwayDocs).toContain("HOSTED_DATA_CONFIRM=replace");
    expect(railwayDocs).toContain("`DB_PATH`");
    expect(railwayDocs).toContain("`SESSION_SECRET`");
    expect(railwayDocs).toContain("`CAMPAIGN_LEDGER_ASSET_ROOT`");
    expect(readme).toContain("# Campaign Ledger");
    expect(readme).toContain("`CAMPAIGN_LEDGER_ASSET_ROOT`");
    expect(readme).toContain("[Railway Hosted Rehearsal](./docs/deployment/railway.md)");
  });

  test("hosted account runbook documents manual token handoff", async () => {
    const runbook = await Bun.file("docs/operations/hosted-account-runbook.md").text();
    const readme = await Bun.file("README.md").text();

    expect(readme).toContain("[Hosted Account Operator Runbook](./docs/operations/hosted-account-runbook.md)");
    expect(runbook).toContain("The app does not send email.");
    expect(runbook).toContain("/invites/<token>");
    expect(runbook).toContain("/password-reset/<token>");
    expect(runbook).toContain("The app prevents disabling the last active admin.");
    expect(runbook).toContain("Admins can manage accounts, invites, and reset tokens, but they do not get sheet play-edit access by default.");
  });

  test("hosted rehearsal acceptance documents final verification coverage and follow-ups", async () => {
    const acceptance = await Bun.file("docs/operations/hosted-rehearsal-acceptance.md").text();
    const readme = await Bun.file("README.md").text();
    const architecture = await Bun.file("ARCHITECTURE.md").text();

    expect(readme).toContain("[Hosted Rehearsal Acceptance](./docs/operations/hosted-rehearsal-acceptance.md)");
    expect(architecture).toContain("[Hosted Rehearsal Acceptance](./docs/operations/hosted-rehearsal-acceptance.md)");
    expect(acceptance).toContain("bun run verify");
    expect(acceptance).toContain("protected seeded assets");
    expect(acceptance).toContain("Game Master campaign images");
    expect(acceptance).toContain("sheet-0037");
    expect(acceptance).toContain("Campaign Density Decision");
  });
});
