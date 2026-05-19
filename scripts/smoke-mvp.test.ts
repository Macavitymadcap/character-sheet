import { describe, expect, test } from "bun:test";
import { mvpSmokeTabs, operatorSmokePaths } from "./smoke-mvp";

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
});
