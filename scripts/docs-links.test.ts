import { existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { describe, expect, test } from "bun:test";

const docs = [
  "README.md",
  "ARCHITECTURE.md",
  "CONTRIBUTING.md",
  "docs/operations/hosted-rehearsal-acceptance.md",
  "docs/operations/fresh-hosted-deploy-runbook.md",
  "docs/operations/campaign-companion-acceptance.md",
  "docs/operations/hyper-dank-adoption-acceptance.md",
  "docs/operations/game-master-prep-acceptance.md",
  "docs/operations/hosted-account-runbook.md",
  "docs/operations/google-docs-manual-import.md",
  "docs/project-tracking.md",
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
    expect(packageJson.scripts["hosted:rehearse"]).toBe("bun scripts/fresh-hosted-rehearsal.ts");
    expect(railway.deploy.startCommand).toBe("bun run start");
    expect(railway.deploy.healthcheckPath).toBe("/readyz");
    expect(railway.deploy.healthcheckTimeout).toBe(60);
    expect(railwayDocs).toContain("Start command | `bun run start`");
    expect(packageJson.scripts["hosted:check"]).toBe("bun scripts/hosted-health.ts");
    expect(railwayDocs).toContain("Healthcheck path | `/readyz`");
    expect(railwayDocs).toContain("bun run hosted:check");
    expect(railwayDocs).toContain("bun run hosted:rehearse");
    expect(railwayDocs).toContain("bun run hosted:data -- prepare");
    expect(railwayDocs).toContain("bun run hosted:data -- backup");
    expect(railwayDocs).toContain("character-sheet-<timestamp>-assets/");
    expect(railwayDocs).toContain("character-sheet-<timestamp>.manifest.json");
    expect(railwayDocs).toContain("HOSTED_DATA_CONFIRM=replace");
    expect(railwayDocs).toContain("`DB_PATH`");
    expect(railwayDocs).toContain("`SESSION_SECRET`");
    expect(railwayDocs).toContain("`CAMPAIGN_LEDGER_ASSET_ROOT`");
    expect(railwayDocs).toContain("`ACCOUNT_DELIVERY_MODE`");
    expect(railwayDocs).toContain("`PUBLIC_BASE_URL`");
    expect(readme).toContain("# Campaign Ledger");
    expect(readme).toContain("`CAMPAIGN_LEDGER_ASSET_ROOT`");
    expect(readme).toContain("[Railway Hosted Rehearsal](./docs/deployment/railway.md)");
  });

  test("hosted account runbook documents manual token handoff", async () => {
    const runbook = await Bun.file("docs/operations/hosted-account-runbook.md").text();
    const readme = await Bun.file("README.md").text();

    expect(readme).toContain("[Hosted Account Operator Runbook](./docs/operations/hosted-account-runbook.md)");
    expect(runbook).toContain("The app does not send email.");
    expect(runbook).toContain("ACCOUNT_DELIVERY_MODE=operator");
    expect(runbook).toContain("PUBLIC_BASE_URL");
    expect(runbook).toContain("/invites/<token>");
    expect(runbook).toContain("/password-reset/<token>");
    expect(runbook).toContain("The app prevents disabling the last active admin.");
    expect(runbook).toContain("Admins can manage accounts, invites, and reset tokens, but they do not get sheet play-edit access by default.");
  });

  test("hosted rehearsal acceptance documents final verification coverage and follow-ups", async () => {
    const acceptance = await Bun.file("docs/operations/hosted-rehearsal-acceptance.md").text();
    const freshDeploy = await Bun.file("docs/operations/fresh-hosted-deploy-runbook.md").text();
    const readme = await Bun.file("README.md").text();
    const architecture = await Bun.file("ARCHITECTURE.md").text();

    expect(readme).toContain("[Hosted Rehearsal Acceptance](./docs/operations/hosted-rehearsal-acceptance.md)");
    expect(architecture).toContain("[Hosted Rehearsal Acceptance](./docs/operations/hosted-rehearsal-acceptance.md)");
    expect(acceptance).toContain("bun run verify");
    expect(acceptance).toContain("[Fresh Hosted Deploy Runbook](./fresh-hosted-deploy-runbook.md)");
    expect(freshDeploy).toContain("bun run hosted:rehearse");
    expect(freshDeploy).toContain("bun run hosted:check -- <hosted-url>");
    expect(freshDeploy).toContain("PUBLIC_BASE_URL");
    expect(acceptance).toContain("protected seeded assets");
    expect(acceptance).toContain("Game Master campaign images");
    expect(acceptance).toContain("sheet-0037");
    expect(acceptance).toContain("Campaign Density Decision");
  });

  test("campaign companion acceptance documents delivered scope and follow-ups", async () => {
    const acceptance = await Bun.file("docs/operations/campaign-companion-acceptance.md").text();
    const readme = await Bun.file("README.md").text();
    const architecture = await Bun.file("ARCHITECTURE.md").text();
    const ticket = await Bun.file("docs/tickets/sheet-0060.md").text();

    expect(readme).toContain("[Campaign Companion Acceptance](./docs/operations/campaign-companion-acceptance.md)");
    expect(architecture).toContain("[Campaign Companion Acceptance](./docs/operations/campaign-companion-acceptance.md)");
    expect(ticket).toContain("[Campaign Companion Acceptance](../operations/campaign-companion-acceptance.md)");
    expect(acceptance).toContain("Public SRD rules and browser-local play are available without sign-in.");
    expect(acceptance).toContain("Admin invite and password-reset handoff now surfaces complete local links.");
    expect(acceptance).toContain("Mira Voss has cleric-derived spells, actions, resources, equipment, and rule links.");
    expect(acceptance).toContain("Campaign-scoped private rules sources remain hidden from public routes.");
    expect(acceptance).toContain("Routine `bun run verify` screenshots are written to a temporary directory");
    expect(acceptance).toContain("sheet-0040");
    expect(acceptance).toContain("sheet-0037");
  });

  test("Hyper-Dank adoption acceptance documents package, visual, and follow-up boundaries", async () => {
    const acceptance = await Bun.file("docs/operations/hyper-dank-adoption-acceptance.md").text();
    const readme = await Bun.file("README.md").text();
    const architecture = await Bun.file("ARCHITECTURE.md").text();
    const ticket = await Bun.file("docs/tickets/sheet-0047.md").text();

    expect(readme).toContain("[Hyper-Dank Adoption Acceptance](./docs/operations/hyper-dank-adoption-acceptance.md)");
    expect(architecture).toContain("[Hyper-Dank Adoption Acceptance](./docs/operations/hyper-dank-adoption-acceptance.md)");
    expect(ticket).toContain("[Hyper-Dank Adoption Acceptance](../operations/hyper-dank-adoption-acceptance.md)");
    expect(acceptance).toContain("Campaign Ledger resolves Hyper-Dank packages from npm");
    expect(acceptance).toContain("bun run update:hyper-dank");
    expect(acceptance).toContain("bun run test:hyper-dank");
    expect(acceptance).toContain("Routine `bun run verify` screenshots are written to a temporary directory");
    expect(acceptance).toContain("docs/pr-screenshots/");
    expect(acceptance).toContain("GM/player visibility");
    expect(acceptance).toContain("Google Docs import");
  });

  test("GitHub workflow templates and docs describe the Hyper-Dank flow", async () => {
    const readme = await Bun.file("README.md").text();
    const contributing = await Bun.file("CONTRIBUTING.md").text();
    const architecture = await Bun.file("ARCHITECTURE.md").text();
    const workflowDocs = await Bun.file("docs/operations/github-workflow.md").text();
    const projectTracking = await Bun.file("docs/project-tracking.md").text();
    const prTemplate = await Bun.file(".github/PULL_REQUEST_TEMPLATE.md").text();
    const epicTemplate = await Bun.file(".github/ISSUE_TEMPLATE/epic.yml").text();
    const ticketTemplate = await Bun.file(".github/ISSUE_TEMPLATE/ticket.yml").text();
    const bugTemplate = await Bun.file(".github/ISSUE_TEMPLATE/bug.yml").text();
    const followUpTemplate = await Bun.file(".github/ISSUE_TEMPLATE/follow_up.yml").text();

    expect(readme).toContain("[GitHub Workflow](./docs/operations/github-workflow.md)");
    expect(readme).toContain("[Project Tracking](./docs/project-tracking.md)");
    expect(contributing).toContain("[GitHub Workflow](./docs/operations/github-workflow.md)");
    expect(contributing).toContain("[Project Tracking](./docs/project-tracking.md)");
    expect(architecture).toContain("[GitHub Workflow](./docs/operations/github-workflow.md)");
    expect(architecture).toContain("[Project Tracking](./docs/project-tracking.md)");
    expect(workflowDocs).toContain("GitHub Issues");
    expect(workflowDocs).toContain("GitHub Projects");
    expect(workflowDocs).toContain("[Project Tracking](../project-tracking.md)");
    expect(workflowDocs).toContain("issue-backed items");
    expect(workflowDocs).toContain("Status");
    expect(workflowDocs).toContain("Planned");
    expect(workflowDocs).toContain("In progress");
    expect(workflowDocs).toContain("Blocked");
    expect(workflowDocs).toContain("In review");
    expect(workflowDocs).toContain("Done");
    expect(workflowDocs).toContain("acceptance evidence");
    expect(projectTracking).toContain("GitHub Issues and GitHub Projects");
    expect(projectTracking).toContain("operational source of truth");
    expect(projectTracking).toContain("native sub-issue");
    expect(projectTracking).toContain("Project auto-add workflow");
    expect(projectTracking).toContain("Do not bulk-create issues for all historical `sheet-*` docs");
    expect(prTemplate).toContain("Issue:");
    expect(prTemplate).toContain("Project:");
    expect(prTemplate).toContain("Base branch:");
    expect(prTemplate).toContain("Screenshot evidence");
    expect(prTemplate).toContain("Follow-ups");
    expect(epicTemplate).toContain("type: epic");
    expect(ticketTemplate).toContain("type: ticket");
    expect(bugTemplate).toContain("type: bug");
    expect(followUpTemplate).toContain("type: follow-up");
  });

  test("Google Docs manual import docs describe the provider boundary", async () => {
    const docs = await Bun.file("docs/operations/google-docs-manual-import.md").text();
    const readme = await Bun.file("README.md").text();
    const architecture = await Bun.file("ARCHITECTURE.md").text();

    expect(readme).toContain("[Google Docs Manual Import](./docs/operations/google-docs-manual-import.md)");
    expect(architecture).toContain("[Google Docs Manual Import](./docs/operations/google-docs-manual-import.md)");
    expect(docs).toContain("does not connect to Google Drive");
    expect(docs).toContain("google_docs_manual");
    expect(docs).toContain("google-doc:<document-id>");
    expect(docs).toContain("OAuth tokens");
    expect(docs).toContain("two-way editing");
  });

  test("Game Master prep acceptance records delivered scope and GitHub handoff", async () => {
    const acceptance = await Bun.file("docs/operations/game-master-prep-acceptance.md").text();
    const readme = await Bun.file("README.md").text();
    const architecture = await Bun.file("ARCHITECTURE.md").text();
    const ticket = await Bun.file("docs/tickets/sheet-0069.md").text();

    expect(readme).toContain("[Game Master Prep Acceptance](./docs/operations/game-master-prep-acceptance.md)");
    expect(architecture).toContain("[Game Master Prep Acceptance](./docs/operations/game-master-prep-acceptance.md)");
    expect(ticket).toContain("[Game Master Prep Acceptance](../operations/game-master-prep-acceptance.md)");
    expect(acceptance).toContain("private, public, and selected-player visibility");
    expect(acceptance).toContain("Google Docs writing can be imported through the manual-export path");
    expect(acceptance).toContain("bun run verify");
    expect(acceptance).toContain("bun run test:hyper-dank");
    expect(acceptance).toContain("Campaign Ledger GitHub Project");
    expect(acceptance).toContain("#78");
    expect(acceptance).toContain("Production Google Drive OAuth");
  });
});
