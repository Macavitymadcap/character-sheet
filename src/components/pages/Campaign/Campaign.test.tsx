import { describe, expect, test } from "bun:test";
import { CampaignImageDetailPage, CampaignImageLibraryPage, CampaignPage, CampaignPlayerPreviewPage, NpcDetailPage, NpcListPage } from "./Campaign";

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
    expect(html).toContain('href="/campaigns/rovnost-shadows/images"');
  });

  test("renders image library and detail metadata for Game Masters", () => {
    const campaign = {
      gmUserId: "user_game_master",
      id: "campaign_rovnost_shadows",
      name: "Rovnost Shadows",
      slug: "rovnost-shadows",
    };
    const asset = {
      altText: "Campaign cover over the city",
      byteSize: 144000,
      campaignId: "campaign_rovnost_shadows",
      caption: "Campaign cover art.",
      fileStatus: "fallback" as const,
      height: 800,
      id: "asset_rovnost_cover",
      mimeType: "image/png",
      storageKey: "campaigns/rovnost-shadows/cover.png",
      title: "Campaign cover",
      usageCount: 2,
      visibility: "player" as const,
      width: 1200,
    };
    const library = render(
      <CampaignImageLibraryPage
        appName="Campaign Ledger"
        campaign={campaign}
        imageAssets={[asset]}
        user={{ displayName: "Game Master", role: "game_master" }}
        viewerRole="game_master"
      />,
    );
    const detail = render(
      <CampaignImageDetailPage
        appName="Campaign Ledger"
        asset={{
          ...asset,
          usages: [
            {
              href: "/campaigns/rovnost-shadows/wiki/rovnost-shadows-overview",
              id: "wiki_rovnost_overview",
              label: "Rovnost Shadows Overview",
              type: "wiki",
            },
          ],
        }}
        campaign={campaign}
        user={{ displayName: "Game Master", role: "game_master" }}
        viewerRole="game_master"
      />,
    );

    expect(library).toContain("<title>Images - Rovnost Shadows - Campaign Ledger</title>");
    expect(library).toContain('action="/campaigns/rovnost-shadows/assets"');
    expect(library).toContain("Campaign Ledger stores an app-managed copy");
    expect(library).toContain("Fallback active");
    expect(library).toContain("2 uses");
    expect(detail).toContain("<title>Campaign cover - Images - Rovnost Shadows - Campaign Ledger</title>");
    expect(detail).toContain("Storage key");
    expect(detail).toContain("campaigns/rovnost-shadows/cover.png");
    expect(detail).toContain("Rovnost Shadows Overview");
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
      selectedPlayerIds: ["user_lynott_player"],
      slug: "canal-broker",
      visibility: "selected" as const,
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
        playerMembers={[{
          campaignId: "campaign_rovnost_shadows",
          displayName: "Lynott Player",
          role: "player",
          userId: "user_lynott_player",
        }]}
        rules={[]}
        user={user}
        viewerRole="game_master"
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
        playerMembers={[{
          campaignId: "campaign_rovnost_shadows",
          displayName: "Lynott Player",
          role: "player",
          userId: "user_lynott_player",
        }]}
        rules={[]}
        user={user}
        viewerRole="game_master"
        wikiPages={[]}
      />,
    );

    expect(list).toContain("<title>NPCs - Rovnost Shadows - Campaign Ledger</title>");
    expect(list).toContain('action="/campaigns/rovnost-shadows/npcs"');
    expect(list).toContain('href="/campaigns/rovnost-shadows/npcs/canal-broker"');
    expect(list).toContain("Selected players");
    expect(detail).toContain("Private motive.");
    expect(detail).toContain("Portrait: Canal Broker portrait");
    expect(detail).toContain("Works for Tidebound.");
    expect(detail).toContain("Make public");
    expect(detail).toContain("Lynott Player");
    expect(detail).toContain('action="/campaigns/rovnost-shadows/npcs/npc_1"');
  });

  test("renders player preview and visibility audit states", () => {
    const campaign = {
      gmUserId: "user_game_master",
      id: "campaign_rovnost_shadows",
      name: "Rovnost Shadows",
      slug: "rovnost-shadows",
    };
    const html = render(
      <CampaignPlayerPreviewPage
        appName="Campaign Ledger"
        auditItems={[
          { hidden: 2, href: "/campaigns/rovnost-shadows#campaign-wiki-heading", label: "Wiki pages", visible: 1 },
          { hidden: 1, href: "/campaigns/rovnost-shadows/npcs", label: "NPCs", visible: 1 },
        ]}
        campaign={campaign}
        imageAssets={[{
          altText: "Rovnost cover",
          byteSize: 12000,
          campaignId: "campaign_rovnost_shadows",
          caption: "City under pressure.",
          height: 800,
          id: "asset_rovnost_cover",
          mimeType: "image/png",
          storageKey: "campaigns/rovnost-shadows/cover.png",
          title: "Rovnost cover",
          visibility: "player",
          width: 1200,
        }]}
        notesByCharacter={[{
          character: {
            background: "Raised beside the locks.",
            campaignId: "campaign_rovnost_shadows",
            campaignName: "Rovnost Shadows",
            campaignSlug: "rovnost-shadows",
            classSummary: "Cleric 3",
            factionId: null,
            factionName: null,
            id: "character_lynott_magulbisson",
            level: 3,
            name: "Lynott Magulbisson",
            ownerDisplayName: "Lynott Player",
            ownerUserId: "user_lynott_player",
            slug: "lynott",
            species: "Dwarf",
          },
          notes: [{
            body: "Player-facing clue.",
            id: "note_1",
            title: "Clue",
            visibility: "player",
          }],
        }]}
        npcs={[{
          campaignId: "campaign_rovnost_shadows",
          id: "npc_magister_vallen",
          name: "Magister Vallen",
          portraitImageAssetId: null,
          publicSummary: "A senior magistrate linked to factory pressure.",
          publicWikiPageId: null,
          slug: "magister-vallen",
          visibility: "selected",
        }]}
        previewDisplayName="Lynott Player"
        sessions={[{
          body: "The public recap.",
          campaignId: "campaign_rovnost_shadows",
          createdByUserId: "user_game_master",
          id: "session_1",
          sessionDate: "2026-05-20",
          slug: "lock-gate",
          summary: "The lock gate investigation begins.",
          title: "Lock Gate",
          visibility: "player",
        }]}
        user={{ displayName: "Game Master", role: "game_master" }}
        wikiPages={[{
          bodyMarkdown: "Visible notes.",
          campaignId: "campaign_rovnost_shadows",
          coverImageAssetId: null,
          id: "wiki_1",
          pageType: "campaign",
          slug: "players-guide",
          sourcePath: null,
          sourceTitle: null,
          tags: ["guide"],
          title: "Players Guide",
          visibility: "player",
        }]}
      />,
    );

    expect(html).toContain("<title>Player preview - Rovnost Shadows - Campaign Ledger</title>");
    expect(html).toContain("Previewing as Lynott Player");
    expect(html).toContain("Visibility audit");
    expect(html).toContain("Visible to Lynott Player");
    expect(html).toContain("1 visible");
    expect(html).toContain("2 hidden");
    expect(html).toContain("Magister Vallen");
    expect(html).toContain("Rovnost cover");
    expect(html).toContain("Lynott Magulbisson");
    expect(html).toContain("Visible notes.");
    expect(html).toContain("The public recap.");
    expect(html).toContain("Clue");
    expect(html).toContain("Player-facing clue.");
    expect(html).toContain('href="/campaigns/rovnost-shadows/prep"');
  });
});
