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
        imageAssets={[
          {
            altText: "Campaign cover",
            byteSize: 144000,
            campaignId: "campaign_rovnost_shadows",
            caption: "Campaign cover art.",
            height: 800,
            id: "asset_rovnost_cover",
            mimeType: "image/png",
            storageKey: "campaigns/rovnost-shadows/cover.png",
            title: "Campaign cover",
            visibility: "player",
            width: 1200,
          },
          {
            altText: "Secret portrait",
            byteSize: 86000,
            campaignId: "campaign_rovnost_shadows",
            caption: "Game Master reference.",
            height: null,
            id: "campaign_image_asset_123",
            mimeType: "image/png",
            storageKey: "campaigns/rovnost-shadows/upload.png",
            title: "Secret portrait",
            visibility: "game_master",
            width: null,
          },
        ]}
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
        ruleSources={[
          {
            abbreviation: "Rovnost",
            campaignIds: ["campaign_rovnost_shadows"],
            contentCategory: "local",
            id: "rules_source_rovnost",
            name: "Rovnost Private Notes",
            publicExportEligible: false,
            slug: "rovnost-private",
            visibility: "campaign",
          },
        ]}
        sessions={[]}
        user={{ displayName: "Game Master", role: "game_master" }}
        viewerRole="game_master"
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
    expect(html).toContain("Rules sources");
    expect(html).toContain("Campaign scoped");
    expect(html).toContain("Not public exportable");
    expect(html).toContain("Seeded");
    expect(html).toContain("Uploaded");
    expect(html).toContain("Player visible");
    expect(html).toContain("Game Master only");
    expect(html).toContain("1200 x 800");
    expect(html).toContain("Fallback shown if file is missing locally");
  });
});
