import { describe, expect, test } from "bun:test";
import { CampaignPage, NpcDetailPage, NpcListPage } from "./Campaign";

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
    expect(html).toContain('href="/campaigns/rovnost-shadows/prep"');
    expect(html).toContain('href="/campaigns/rovnost-shadows/npcs"');
  });

  test("renders NPC workspace list and private detail states", () => {
    const campaign = {
      gmUserId: "user_game_master",
      id: "campaign_rovnost_shadows",
      name: "Rovnost Shadows",
      slug: "rovnost-shadows",
    };
    const user = { displayName: "Game Master", role: "game_master" as const };
    const npc = {
      campaignId: "campaign_rovnost_shadows",
      gmNotes: "Private motive.",
      hooks: "Needs a discreet courier.",
      id: "npc_1",
      motivations: "Keep the docks independent.",
      name: "Canal Broker",
      portraitImageAssetId: "asset_canal_broker",
      publicSummary: "A broker with friends near the canal gates.",
      publicWikiPageId: "wiki_rovnost_factions",
      revealNotes: "Reveal after the warehouse scene.",
      rulesEntityId: null,
      sceneNotes: "Use at the lock gate.",
      secrets: "Works for Tidebound.",
      slug: "canal-broker",
      visibility: "game_master" as const,
    };
    const list = render(
      <NpcListPage
        appName="Campaign Ledger"
        campaign={campaign}
        imageAssets={[{
          altText: "Canal Broker portrait",
          byteSize: 1234,
          campaignId: "campaign_rovnost_shadows",
          caption: "Private prep portrait.",
          height: 768,
          id: "asset_canal_broker",
          mimeType: "image/png",
          storageKey: "campaigns/rovnost-shadows/canal-broker.png",
          title: "Canal Broker portrait",
          visibility: "game_master",
          width: 768,
        }]}
        npcs={[npc]}
        rules={[]}
        user={user}
        wikiPages={[]}
      />,
    );
    const detail = render(
      <NpcDetailPage
        appName="Campaign Ledger"
        campaign={campaign}
        imageAssets={[{
          altText: "Canal Broker portrait",
          byteSize: 1234,
          campaignId: "campaign_rovnost_shadows",
          caption: "Private prep portrait.",
          height: 768,
          id: "asset_canal_broker",
          mimeType: "image/png",
          storageKey: "campaigns/rovnost-shadows/canal-broker.png",
          title: "Canal Broker portrait",
          visibility: "game_master",
          width: 768,
        }]}
        npc={npc}
        rules={[]}
        user={user}
        viewerRole="game_master"
        wikiPages={[]}
      />,
    );

    expect(list).toContain("<title>NPCs - Rovnost Shadows - Campaign Ledger</title>");
    expect(list).toContain('action="/campaigns/rovnost-shadows/npcs"');
    expect(list).toContain('href="/campaigns/rovnost-shadows/npcs/canal-broker"');
    expect(list).toContain("Game Master only");
    expect(detail).toContain("Private motive.");
    expect(detail).toContain("Portrait: Canal Broker portrait");
    expect(detail).toContain("Works for Tidebound.");
    expect(detail).toContain("Reveal to players");
    expect(detail).toContain('action="/campaigns/rovnost-shadows/npcs/npc_1"');
  });
});
