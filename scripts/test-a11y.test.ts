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
      { label: "player npcs", path: "/campaigns/rovnost-shadows/npcs", role: "player" },
      { label: "player images", path: "/campaigns/rovnost-shadows/images", role: "player" },
      { label: "logout", path: "/logout", role: "player" },
      { label: "campaign", path: "/campaigns/rovnost-shadows", role: "game_master" },
      { label: "gm prep", path: "/campaigns/rovnost-shadows/prep", role: "game_master" },
      { label: "gm player preview", path: "/campaigns/rovnost-shadows/preview/player", role: "game_master" },
      { label: "gm npcs", path: "/campaigns/rovnost-shadows/npcs", role: "game_master" },
      { label: "gm npc detail", path: "/campaigns/rovnost-shadows/npcs/magister-vallen", role: "game_master" },
      { label: "gm images", path: "/campaigns/rovnost-shadows/images", role: "game_master" },
      { label: "gm image detail", path: "/campaigns/rovnost-shadows/images/asset_magister_vallen", role: "game_master" },
      { label: "gm imports", path: "/campaigns/rovnost-shadows/imports", role: "game_master" },
      { label: "gm roster", path: "/campaigns/rovnost-shadows/characters", role: "game_master" },
      { label: "admin", path: "/admin", role: "admin" },
    ]);
  });

  test("covers hosted-ready role surfaces", () => {
    expect(pa11yTargets.map((target) => target.label)).toEqual(expect.arrayContaining([
      "admin",
      "campaign",
      "gm image detail",
      "gm images",
      "gm imports",
      "gm npc detail",
      "gm npcs",
      "gm player preview",
      "gm prep",
      "gm roster",
      "login",
      "local campaigns",
      "local characters",
      "player images",
      "player npcs",
      "player roster",
      "rule detail",
      "rules",
      "sheet",
      "wiki",
    ]));
  });
});
