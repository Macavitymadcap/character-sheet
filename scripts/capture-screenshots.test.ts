import { describe, expect, test } from "bun:test";
import { sheetScreenshotTargets } from "./capture-screenshots";

describe("sheet screenshot targets", () => {
  test("captures Lynott's sheet in light and dark mode", () => {
    expect(sheetScreenshotTargets).toEqual([
      {
        fileName: "lynott-sheet-light.png",
        label: "Lynott sheet light",
        theme: "light",
      },
      {
        fileName: "lynott-sheet-dark.png",
        label: "Lynott sheet dark",
        theme: "dark",
      },
      {
        fileName: "lynott-background-faction.png",
        label: "Lynott background faction",
        tabId: "background",
        theme: "light",
      },
    ]);
  });
});
