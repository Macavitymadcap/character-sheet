import { describe, expect, test } from "bun:test";
import { pa11yTargets } from "./test-a11y";

describe("Pa11y targets", () => {
  test("covers public, player, Game Master, wiki, roster, and admin pages", () => {
    expect(pa11yTargets).toEqual([
      { label: "home", path: "/", role: "public" },
      { label: "login", path: "/login", role: "public" },
      { label: "local characters", path: "/local/characters", role: "public" },
      { label: "local campaigns", path: "/local/campaigns", role: "public" },
      { label: "player roster", path: "/characters", role: "player" },
      { label: "sheet", path: "/sheet/lynott", role: "player" },
      { label: "rules", path: "/rules?type=spell&level=1", role: "public" },
      { label: "rule detail", path: "/rules/spell/bless", role: "public" },
      { label: "wiki", path: "/campaigns/rovnost-shadows/wiki/factions-guide", role: "player" },
      { label: "logout", path: "/logout", role: "player" },
      { label: "campaign", path: "/campaigns/rovnost-shadows", role: "game_master" },
      { label: "gm prep", path: "/campaigns/rovnost-shadows/prep", role: "game_master" },
      { label: "gm npcs", path: "/campaigns/rovnost-shadows/npcs", role: "game_master" },
      { label: "gm npc detail", path: "/campaigns/rovnost-shadows/npcs/magister-vallen", role: "game_master" },
      { label: "gm roster", path: "/campaigns/rovnost-shadows/characters", role: "game_master" },
      { label: "admin", path: "/admin", role: "admin" },
    ]);
  });

  test("covers hosted-ready role surfaces", () => {
    expect(pa11yTargets.map((target) => target.label)).toEqual(expect.arrayContaining([
      "admin",
      "campaign",
      "gm npc detail",
      "gm npcs",
      "gm prep",
      "gm roster",
      "login",
      "local campaigns",
      "local characters",
      "player roster",
      "rule detail",
      "rules",
      "sheet",
      "wiki",
    ]));
  });
});
