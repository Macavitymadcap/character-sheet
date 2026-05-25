import { describe, expect, test } from "bun:test";
import { freshHostedRehearsalCoverage, runFreshHostedRehearsal } from "./fresh-hosted-rehearsal";

describe("fresh hosted rehearsal", () => {
  test("covers the hosted table-ready workflow", () => {
    expect(freshHostedRehearsalCoverage).toContain("file-backed SQLite prepare");
    expect(freshHostedRehearsalCoverage).toContain("readiness check");
    expect(freshHostedRehearsalCoverage).toContain("admin invite handoff");
    expect(freshHostedRehearsalCoverage).toContain("protected seeded asset");
    expect(freshHostedRehearsalCoverage).toContain("hosted backup bundle");
  });

  test("prepares and smokes a fresh file-backed hosted environment", async () => {
    await expect(runFreshHostedRehearsal()).resolves.toMatchObject({
      assetRoot: expect.stringContaining("data/assets"),
      backupDir: expect.stringContaining("data/backups"),
      databasePath: expect.stringContaining("data/character-sheet.sqlite3"),
    });
  }, 20_000);
});
