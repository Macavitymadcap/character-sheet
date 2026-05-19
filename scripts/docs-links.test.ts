import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const docs = [
  "README.md",
  "ARCHITECTURE.md",
  "CONTRIBUTING.md",
  "docs/deployment/railway.md",
  "docs/tickets/sheet-0019.md",
];

describe("documentation references", () => {
  test("local markdown links point to existing files", async () => {
    const missing: string[] = [];

    for (const doc of docs) {
      const text = await Bun.file(doc).text();
      for (const match of text.matchAll(/\[[^\]]+\]\((\.\/[^)#]+|docs\/[^)#]+|\/[^)#]+)\)/g)) {
        const href = match[1]?.replace(/^\.\//, "");
        if (!href || href.startsWith("/")) continue;
        if (!existsSync(href)) missing.push(`${doc} -> ${href}`);
      }
    }

    expect(missing).toEqual([]);
  });

  test("documented verification scripts exist in package.json", async () => {
    const packageJson = await Bun.file("package.json").json() as { scripts: Record<string, string> };
    const readme = await Bun.file("README.md").text();
    const contributing = await Bun.file("CONTRIBUTING.md").text();
    const documentedScripts = [...`${readme}\n${contributing}`.matchAll(/bun run ([a-z0-9:-]+)/g)]
      .map((match) => match[1])
      .filter((script): script is string => Boolean(script));
    const missing = documentedScripts.filter((script) => !(script in packageJson.scripts));

    expect(missing).toEqual([]);
  });

  test("Railway runtime docs match repository configuration", async () => {
    const packageJson = await Bun.file("package.json").json() as { scripts: Record<string, string> };
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
    expect(readme).toContain("[Railway Hosted Rehearsal](./docs/deployment/railway.md)");
  });
});
