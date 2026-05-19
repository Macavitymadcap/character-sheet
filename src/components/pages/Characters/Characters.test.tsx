import { describe, expect, test } from "bun:test";
import { CharactersPage } from "./Characters";

const render = (node: unknown): string => String(node);

describe("CharactersPage", () => {
  test("renders player roster, create form, and empty state", () => {
    const html = render(
      <CharactersPage
        appName="Character Sheet"
        characters={[]}
        mode="player"
        user={{ displayName: "Mira Player", id: "user_mira_player", role: "player" }}
      />,
    );

    expect(html).toContain("Player roster");
    expect(html).toContain('action="/characters"');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="hitPointMax"');
    expect(html).toContain("No characters yet.");
  });

  test("renders a separate create link when the roster hides the form", () => {
    const html = render(
      <CharactersPage
        appName="Character Sheet"
        characters={[]}
        mode="player"
        showCreateForm={false}
        user={{ displayName: "Mira Player", id: "user_mira_player", role: "player" }}
      />,
    );

    expect(html).toContain('<a class="action-link" href="/characters/new">Create character</a>');
    expect(html).not.toContain('name="hitPointMax"');
    expect(html).toContain("No characters yet.");
  });

  test("renders Game Master roster owner choices", () => {
    const html = render(
      <CharactersPage
        appName="Character Sheet"
        campaign={{
          gmUserId: "user_game_master",
          id: "campaign_rovnost_shadows",
          name: "Rovnost Shadows",
          slug: "rovnost-shadows",
        }}
        characters={[
          {
            background: "Guide",
            campaignId: "campaign_rovnost_shadows",
            campaignName: "Rovnost Shadows",
            campaignSlug: "rovnost-shadows",
            classSummary: "Ranger 1",
            factionId: null,
            factionName: null,
            id: "character_ash_vale",
            level: 1,
            name: "Ash Vale",
            ownerDisplayName: "Mira Player",
            ownerUserId: "user_mira_player",
            slug: "ash_vale",
            species: "Human",
          },
        ]}
        members={[
          {
            campaignId: "campaign_rovnost_shadows",
            displayName: "Campaign GM",
            role: "game_master",
            userId: "user_game_master",
          },
          {
            campaignId: "campaign_rovnost_shadows",
            displayName: "Mira Player",
            role: "player",
            userId: "user_mira_player",
          },
        ]}
        mode="game_master"
        user={{ displayName: "Campaign GM", id: "user_game_master", role: "game_master" }}
      />,
    );

    expect(html).toContain("Campaign roster");
    expect(html).toContain('<table class="sheet-table characters-table">');
    expect(html).toContain('action="/campaigns/rovnost-shadows/characters"');
    expect(html).toContain('<option value="user_mira_player">Mira Player</option>');
    expect(html).not.toContain('<option value="user_game_master">Campaign GM</option>');
    expect(html).toContain('<a href="/sheet/ash_vale">Ash Vale</a>');
  });
});
