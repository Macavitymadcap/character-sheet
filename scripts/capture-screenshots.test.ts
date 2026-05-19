import { describe, expect, test } from "bun:test";
import { sheetScreenshotTargets } from "./capture-screenshots";

describe("sheet screenshot targets", () => {
  test("captures sheet, group-use, wiki, and edited states", () => {
    expect(sheetScreenshotTargets).toEqual([
      {
        fileName: "lynott-sheet-light.png",
        label: "Lynott sheet light",
        path: "/sheet/lynott",
        role: "player",
        theme: "light",
      },
      {
        fileName: "lynott-sheet-dark.png",
        label: "Lynott sheet dark",
        path: "/sheet/lynott",
        role: "player",
        theme: "dark",
      },
      {
        fileName: "lynott-background-faction.png",
        label: "Lynott background faction",
        path: "/sheet/lynott",
        role: "player",
        tabId: "background",
        theme: "light",
      },
      {
        fileName: "player-roster.png",
        label: "Player roster",
        path: "/characters",
        role: "player",
        theme: "light",
      },
      {
        fileName: "gm-campaign.png",
        label: "Game Master campaign",
        path: "/campaigns/rovnost-shadows",
        role: "game_master",
        theme: "light",
      },
      {
        fileName: "wiki-factions-image.png",
        label: "Wiki page with image",
        path: "/campaigns/rovnost-shadows/wiki/factions-guide",
        role: "player",
        theme: "light",
      },
      {
        fileName: "rules-spells.png",
        label: "Rules spell list",
        path: "/rules?type=spell&level=1",
        role: "player",
        theme: "light",
      },
      {
        fileName: "rules-bless.png",
        label: "Rules Bless detail",
        path: "/rules/spell/bless",
        role: "player",
        theme: "light",
      },
      {
        fileName: "lynott-edited-sheet.png",
        label: "Lynott edited sheet light",
        path: "/sheet/lynott",
        prepare: "edited-sheet",
        role: "player",
        theme: "light",
      },
      {
        fileName: "lynott-edited-sheet-dark.png",
        label: "Lynott edited sheet dark",
        path: "/sheet/lynott",
        prepare: "edited-sheet",
        role: "player",
        theme: "dark",
      },
    ]);
  });
});
