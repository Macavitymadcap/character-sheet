import { describe, expect, test } from "bun:test";
import { mvpSmokeTabs } from "./smoke-mvp";

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
});
