import { describe, expect, test } from "bun:test";
import { hostedRehearsalSmokeCoverage, mvpSmokeTabs, operatorSmokePaths } from "./smoke-mvp";

describe("MVP smoke workflow config", () => {
  test("covers every seeded sheet tab", () => {
    expect(mvpSmokeTabs).toEqual([
      "core",
      "skills",
      "actions",
      "spellcasting",
      "features",
      "equipment",
      "background",
      "notes",
    ]);
  });

  test("covers manual hosted account handoff paths", () => {
    expect(operatorSmokePaths).toEqual(["/invites/<token>", "/password-reset/<token>"]);
  });

  test("summarises hosted rehearsal smoke coverage", () => {
    expect(hostedRehearsalSmokeCoverage).toEqual([
      "seeded sign-in",
      "player roster character creation",
      "sheet tabs",
      "SRD rules browsing",
      "campaign sessions",
      "campaign wiki",
      "protected seeded assets",
      "image upload",
      "admin invite handoff",
      "admin password reset handoff",
      "logout protection",
    ]);
  });
});
