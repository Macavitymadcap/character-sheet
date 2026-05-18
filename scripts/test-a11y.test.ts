import { describe, expect, test } from "bun:test";
import { pa11yTargets } from "./test-a11y";

describe("Pa11y targets", () => {
  test("covers public, player, Game Master, wiki, roster, and admin pages", () => {
    expect(pa11yTargets).toEqual([
      { label: "home", path: "/", role: "public" },
      { label: "login", path: "/login", role: "public" },
      { label: "player roster", path: "/characters", role: "player" },
      { label: "sheet", path: "/sheet/lynott", role: "player" },
      { label: "wiki", path: "/campaigns/rovnost-shadows/wiki/factions-guide", role: "player" },
      { label: "logout", path: "/logout", role: "player" },
      { label: "campaign", path: "/campaigns/rovnost-shadows", role: "game_master" },
      { label: "gm roster", path: "/campaigns/rovnost-shadows/characters", role: "game_master" },
      { label: "admin", path: "/admin", role: "admin" },
    ]);
  });
});
