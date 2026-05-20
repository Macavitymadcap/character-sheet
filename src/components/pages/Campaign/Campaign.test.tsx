import { describe, expect, test } from "bun:test";
import { CampaignPage } from "./Campaign";

const render = (node: unknown): string => String(node);

describe("CampaignPage", () => {
  test("renders the shared shell for Game Masters", () => {
    const html = render(
      <CampaignPage
        appName="Campaign Ledger"
        campaign={{
          gmUserId: "user_game_master",
          id: "campaign_rovnost_shadows",
          name: "Rovnost Shadows",
          slug: "rovnost-shadows",
        }}
        gameMasterDisplayName="Game Master"
        imageAssets={[]}
        members={[
          {
            campaignId: "campaign_rovnost_shadows",
            role: "game_master",
            userId: "user_game_master",
          },
          {
            campaignId: "campaign_rovnost_shadows",
            role: "player",
            userId: "user_lynott_player",
          },
        ]}
        sessions={[]}
        user={{ displayName: "Game Master", role: "game_master" }}
        wikiPages={[]}
      />,
    );

    expect(html).toContain("<title>Rovnost Shadows - Campaign Ledger</title>");
    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain(
      '<a class="popover-menu-item" href="/campaigns/rovnost-shadows" role="menuitem" aria-current="page">Campaign</a>',
    );
    expect(html).toContain('<h1 id="campaign-heading" class="panel-heading">Rovnost Shadows</h1>');
    expect(html).toContain("<dt>Members</dt>");
    expect(html).toContain("<dd>2</dd>");
  });
});
