import { renderCampaignMarkdown } from "../../../campaigns/wiki";
import type {
  AuthUser,
  CampaignImageAsset,
  CampaignMember,
  CampaignNpcDossier,
  CampaignNpcSummary,
  CampaignSessionRecord,
  CampaignSummary,
  CampaignWikiPage,
  RuleSummary,
  RulesSourceSummary,
} from "../../../db";
import { Panel } from "../../atoms/Panel";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface CampaignPageProps {
  appName: string;
  campaign: CampaignSummary;
  gameMasterDisplayName: string;
  members: CampaignMember[];
  imageAssets: CampaignImageAsset[];
  ruleSources: RulesSourceSummary[];
  sessions: CampaignSessionRecord[];
  user: Pick<AuthUser, "displayName" | "role"> &
    Partial<Pick<AuthUser, "campaignRoles" | "capabilities">>;
  viewerRole: CampaignMember["role"];
  wikiPages: CampaignWikiPage[];
}

export const CampaignPage = ({ appName, campaign, gameMasterDisplayName, imageAssets, members, ruleSources, sessions, user, viewerRole, wikiPages }: CampaignPageProps) => {
  const canManageCampaign = viewerRole === "game_master";

  return (
    <Layout title={`${campaign.name} - ${appName}`}>
      <div class="shell campaign-shell">
        <SiteHeader appName={appName} currentSection="campaign" user={user} />
        <main class="campaign-main" aria-labelledby="campaign-heading">
          <Panel labelledBy="campaign-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">Campaign</p>
              <h1 id="campaign-heading" class="panel-heading">
                {campaign.name}
              </h1>
            </div>
            <dl class="campaign-summary-list">
              <div>
                <dt>Game Master</dt>
                <dd>{gameMasterDisplayName}</dd>
              </div>
              <div>
                <dt>Members</dt>
                <dd>{members.length}</dd>
              </div>
            </dl>
            {canManageCampaign ? (
              <nav class="campaign-action-row" aria-label="Game Master campaign tools">
                <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}/prep`}>Prep workspace</a>
                <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}/npcs`}>NPCs</a>
              </nav>
            ) : null}
          </Panel>
          <Panel labelledBy="campaign-wiki-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">Campaign Wiki</p>
              <h2 id="campaign-wiki-heading" class="panel-heading">Pages</h2>
            </div>
            <div class="campaign-wiki-grid">
              {wikiPages.map((page) => {
                const cover = imageAssets.find((asset) => asset.id === page.coverImageAssetId);

                return (
                  <article class="campaign-wiki-card">
                    {cover ? (
                      <img
                        alt={cover.altText}
                        class="campaign-wiki-cover"
                        src={`/campaigns/${campaign.slug}/assets/${cover.id}`}
                      />
                    ) : null}
                    <div class="campaign-wiki-card-body">
                      <p class="campaign-kicker">{page.pageType.replace("_", " ")}</p>
                      <h3><a href={`/campaigns/${campaign.slug}/wiki/${page.slug}`}>{page.title}</a></h3>
                      <div class="campaign-tag-list" aria-label={`${page.title} tags`}>
                        {page.tags.map((tag) => <span>{tag}</span>)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {wikiPages.length === 0 ? <p class="campaign-empty-state">No wiki pages recorded.</p> : null}
          </Panel>
          {canManageCampaign ? <Panel labelledBy="campaign-assets-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">Game Master</p>
              <h2 id="campaign-assets-heading" class="panel-heading">Images</h2>
            </div>
            <form class="campaign-session-form" action={`/campaigns/${campaign.slug}/assets`} method="post" enctype="multipart/form-data">
              <label>Title<input name="title" required type="text" /></label>
              <label>Alt text<input name="altText" required type="text" /></label>
              <label>Caption<input name="caption" type="text" /></label>
              <label>Visibility<select name="visibility"><option value="player">Player</option><option value="game_master">Game Master</option></select></label>
              <label>Width<input name="width" min="1" type="number" /></label>
              <label>Height<input name="height" min="1" type="number" /></label>
              <label class="campaign-session-form-wide">Image<input accept="image/png,image/jpeg,image/webp" name="image" required type="file" /></label>
              <button type="submit">Upload image</button>
            </form>
            <div class="campaign-asset-list">
              {imageAssets.map((asset) => (
                <figure>
                  <img alt={asset.altText} src={`/campaigns/${campaign.slug}/assets/${asset.id}`} />
                  <figcaption>
                    <strong>{asset.title}</strong>
                    {asset.caption ? <span>{asset.caption}</span> : null}
                    <span class="campaign-asset-status">
                      {assetStatusLabels(asset).map((label) => <span>{label}</span>)}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Panel> : null}
          {canManageCampaign ? <Panel labelledBy="campaign-rules-sources-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">Game Master</p>
              <h2 id="campaign-rules-sources-heading" class="panel-heading">Rules sources</h2>
            </div>
            <div class="campaign-source-list">
              {ruleSources.length > 0 ? ruleSources.map((source) => (
                <article class="campaign-source-item">
                  <h3>{source.name}</h3>
                  <div class="campaign-tag-list" aria-label={`${source.name} rules source metadata`}>
                    <span>{formatRulesCategory(source.contentCategory)}</span>
                    <span>{source.visibility === "campaign" ? "Campaign scoped" : "Public source"}</span>
                    <span>{source.publicExportEligible ? "Exportable" : "Not public exportable"}</span>
                    <span>{source.abbreviation}</span>
                  </div>
                </article>
              )) : <p class="campaign-empty-state">No campaign rules sources attached.</p>}
            </div>
          </Panel> : null}
          {canManageCampaign ? <Panel labelledBy="campaign-wiki-create-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">Game Master</p>
              <h2 id="campaign-wiki-create-heading" class="panel-heading">Add wiki page</h2>
            </div>
            <form class="campaign-session-form" action={`/campaigns/${campaign.slug}/wiki`} method="post">
              <label>Title<input name="title" required type="text" /></label>
              <label>Page type<select name="pageType"><option value="campaign">Campaign</option><option value="faction">Faction</option><option value="location">Location</option><option value="lore">Lore</option><option value="npc">NPC</option><option value="session">Session</option></select></label>
              <label>Tags<input name="tags" type="text" /></label>
              <label>Visibility<select name="visibility"><option value="player">Player</option><option value="game_master">Game Master</option></select></label>
              <label>Cover<select name="coverImageAssetId"><option value="">None</option>{imageAssets.map((asset) => <option value={asset.id}>{asset.title}</option>)}</select></label>
              <label>Source title<input name="sourceTitle" type="text" /></label>
              <label class="campaign-session-form-wide">Markdown<textarea name="bodyMarkdown" required rows={8}></textarea></label>
              <button type="submit">Add page</button>
            </form>
          </Panel> : null}
          {canManageCampaign ? <Panel labelledBy="campaign-sessions-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">Game Master</p>
              <h2 id="campaign-sessions-heading" class="panel-heading">
                Sessions
              </h2>
            </div>
            <form class="campaign-session-form" action={`/campaigns/${campaign.slug}/sessions`} method="post">
              <label>
                Title
                <input name="title" required type="text" />
              </label>
              <label>
                Date
                <input name="sessionDate" type="date" />
              </label>
              <label>
                Visibility
                <select name="visibility">
                  <option value="player">Player</option>
                  <option value="game_master">Game Master</option>
                </select>
              </label>
              <label>
                Summary
                <input name="summary" type="text" />
              </label>
              <label class="campaign-session-form-wide">
                Body
                <textarea name="body" rows={5}></textarea>
              </label>
              <button type="submit">Add session</button>
            </form>
            {sessions.length > 0 ? (
              <div class="campaign-session-list">
                {sessions.map((session) => (
                  <form
                    class="campaign-session-item"
                    action={`/campaigns/${campaign.slug}/sessions/${session.id}`}
                    method="post"
                  >
                    <label>
                      Title
                      <input name="title" required type="text" value={session.title} />
                    </label>
                    <div class="campaign-session-meta">
                      <label>
                        Date
                        <input name="sessionDate" type="date" value={session.sessionDate ?? ""} />
                      </label>
                      <label>
                        Visibility
                        <select name="visibility">
                          <option value="player" selected={session.visibility === "player"}>Player</option>
                          <option value="game_master" selected={session.visibility === "game_master"}>Game Master</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Summary
                      <input name="summary" type="text" value={session.summary} />
                    </label>
                    <label>
                      Body
                      <textarea name="body" rows={4}>{session.body}</textarea>
                    </label>
                    <div class="campaign-session-actions">
                      <button type="submit">Save session</button>
                      <button
                        type="submit"
                        formaction={`/campaigns/${campaign.slug}/sessions/${session.id}/delete`}
                      >
                        Delete
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            ) : (
              <p class="campaign-empty-state">No sessions recorded.</p>
            )}
          </Panel> : null}
        </main>
      </div>
    </Layout>
  );
};

interface CampaignPrepPageProps {
  appName: string;
  campaign: CampaignSummary;
  npcCount: number;
  privateNpcCount: number;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const CampaignPrepPage = ({ appName, campaign, npcCount, privateNpcCount, user }: CampaignPrepPageProps) => (
  <Layout title={`Prep - ${campaign.name} - ${appName}`}>
    <div class="shell campaign-shell">
      <SiteHeader appName={appName} currentSection="campaign" user={user} />
      <main class="campaign-main" aria-labelledby="campaign-prep-heading">
        <Panel labelledBy="campaign-prep-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Game Master</p>
            <h1 id="campaign-prep-heading" class="panel-heading">Prep workspace</h1>
          </div>
          <div class="campaign-prep-grid">
            <a class="campaign-prep-link" href={`/campaigns/${campaign.slug}/npcs`}>
              <span>NPCs</span>
              <strong>{npcCount}</strong>
              <small>{privateNpcCount} private</small>
            </a>
          </div>
        </Panel>
      </main>
    </div>
  </Layout>
);

interface NpcListPageProps {
  appName: string;
  campaign: CampaignSummary;
  imageAssets: CampaignImageAsset[];
  npcs: CampaignNpcDossier[];
  rules: RuleSummary[];
  user: Pick<AuthUser, "displayName" | "role">;
  wikiPages: CampaignWikiPage[];
}

export const NpcListPage = ({ appName, campaign, imageAssets, npcs, rules, user, wikiPages }: NpcListPageProps) => (
  <Layout title={`NPCs - ${campaign.name} - ${appName}`}>
    <div class="shell campaign-shell">
      <SiteHeader appName={appName} currentSection="campaign" user={user} />
      <main class="campaign-main" aria-labelledby="campaign-npcs-heading">
        <Panel labelledBy="campaign-npcs-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Game Master</p>
            <h1 id="campaign-npcs-heading" class="panel-heading">NPCs</h1>
          </div>
          <div class="campaign-npc-grid">
            {npcs.map((npc) => <NpcSummaryCard campaign={campaign} npc={npc} />)}
          </div>
          {npcs.length === 0 ? <p class="campaign-empty-state">No NPC dossiers yet.</p> : null}
        </Panel>
        <Panel labelledBy="campaign-npc-create-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Private prep</p>
            <h2 id="campaign-npc-create-heading" class="panel-heading">Add NPC</h2>
          </div>
          <NpcForm
            action={`/campaigns/${campaign.slug}/npcs`}
            campaign={campaign}
            imageAssets={imageAssets}
            rules={rules}
            submitLabel="Add NPC"
            wikiPages={wikiPages}
          />
        </Panel>
      </main>
    </div>
  </Layout>
);

interface NpcDetailPageProps {
  appName: string;
  campaign: CampaignSummary;
  imageAssets: CampaignImageAsset[];
  npc: CampaignNpcDossier | CampaignNpcSummary;
  rules: RuleSummary[];
  user: Pick<AuthUser, "displayName" | "role">;
  viewerRole: CampaignMember["role"];
  wikiPages: CampaignWikiPage[];
}

export const NpcDetailPage = ({ appName, campaign, imageAssets, npc, rules, user, viewerRole, wikiPages }: NpcDetailPageProps) => {
  const canManage = viewerRole === "game_master" && isNpcDossier(npc);
  const portrait = npc.portraitImageAssetId
    ? imageAssets.find((asset) => asset.id === npc.portraitImageAssetId)
    : null;
  const profile = npc.publicWikiPageId
    ? wikiPages.find((page) => page.id === npc.publicWikiPageId)
    : null;

  return (
    <Layout title={`${npc.name} - ${campaign.name} - ${appName}`}>
      <div class="shell campaign-shell">
        <SiteHeader appName={appName} currentSection="campaign" user={user} />
        <main class="campaign-main" aria-labelledby="campaign-npc-heading">
          <Panel labelledBy="campaign-npc-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">{npc.visibility === "player" ? "Player visible" : "Game Master only"}</p>
              <h1 id="campaign-npc-heading" class="panel-heading">{npc.name}</h1>
            </div>
            {portrait ? (
              <figure class="campaign-npc-portrait-frame">
                <img class="campaign-npc-portrait" alt={portrait.altText} src={`/campaigns/${campaign.slug}/assets/${portrait.id}`} />
                <figcaption>Portrait: {portrait.title}</figcaption>
              </figure>
            ) : null}
            <p class="campaign-npc-summary">{npc.publicSummary}</p>
            <div class="campaign-tag-list" aria-label={`${npc.name} public references`}>
              {profile ? <span>Profile: {profile.title}</span> : null}
              <span>{npc.visibility === "player" ? "Player visible" : "Game Master only"}</span>
            </div>
          </Panel>
          {canManage ? (
            <Panel labelledBy="campaign-npc-private-heading">
              <div class="campaign-heading">
                <p class="campaign-kicker">Private prep</p>
                <h2 id="campaign-npc-private-heading" class="panel-heading">Dossier</h2>
              </div>
              <dl class="campaign-npc-dossier">
                <div><dt>Game Master notes</dt><dd>{npc.gmNotes || "None recorded."}</dd></div>
                <div><dt>Secrets</dt><dd>{npc.secrets || "None recorded."}</dd></div>
                <div><dt>Motivations</dt><dd>{npc.motivations || "None recorded."}</dd></div>
                <div><dt>Hooks</dt><dd>{npc.hooks || "None recorded."}</dd></div>
                <div><dt>Scene notes</dt><dd>{npc.sceneNotes || "None recorded."}</dd></div>
                <div><dt>Reveal notes</dt><dd>{npc.revealNotes || "None recorded."}</dd></div>
              </dl>
              <form class="campaign-session-actions" action={`/campaigns/${campaign.slug}/npcs/${npc.id}/reveal`} method="post">
                <input type="hidden" name="visibility" value={npc.visibility === "player" ? "game_master" : "player"} />
                <button type="submit">{npc.visibility === "player" ? "Hide from players" : "Reveal to players"}</button>
              </form>
            </Panel>
          ) : null}
          {canManage ? (
            <Panel labelledBy="campaign-npc-edit-heading">
              <div class="campaign-heading">
                <p class="campaign-kicker">Edit</p>
                <h2 id="campaign-npc-edit-heading" class="panel-heading">NPC dossier</h2>
              </div>
              <NpcForm
                action={`/campaigns/${campaign.slug}/npcs/${npc.id}`}
                campaign={campaign}
                imageAssets={imageAssets}
                npc={npc}
                rules={rules}
                submitLabel="Save NPC"
                wikiPages={wikiPages}
              />
            </Panel>
          ) : null}
        </main>
      </div>
    </Layout>
  );
};

function NpcSummaryCard({ campaign, npc }: { campaign: CampaignSummary; npc: CampaignNpcDossier }) {
  return (
    <article class="campaign-npc-card">
      <div>
        <p class="campaign-kicker">{npc.visibility === "player" ? "Player visible" : "Game Master only"}</p>
        <h2><a href={`/campaigns/${campaign.slug}/npcs/${npc.slug}`}>{npc.name}</a></h2>
      </div>
      <p>{npc.publicSummary || "No public summary yet."}</p>
    </article>
  );
}

function NpcForm({
  action,
  imageAssets,
  npc,
  rules,
  submitLabel,
  wikiPages,
}: {
  action: string;
  campaign: CampaignSummary;
  imageAssets: CampaignImageAsset[];
  npc?: CampaignNpcDossier;
  rules: RuleSummary[];
  submitLabel: string;
  wikiPages: CampaignWikiPage[];
}) {
  return (
    <form class="campaign-session-form" action={action} method="post">
      <label>Name<input name="name" required type="text" value={npc?.name ?? ""} /></label>
      <label>Visibility<select name="visibility">
        <option value="game_master" selected={!npc || npc.visibility === "game_master"}>Game Master</option>
        <option value="player" selected={npc?.visibility === "player"}>Player</option>
      </select></label>
      <label class="campaign-session-form-wide">Public summary<textarea name="publicSummary" required rows={3}>{npc?.publicSummary ?? ""}</textarea></label>
      <label>Portrait<select name="portraitImageAssetId">
        <option value="">None</option>
        {imageAssets.map((asset) => <option value={asset.id} selected={npc?.portraitImageAssetId === asset.id}>{asset.title}</option>)}
      </select></label>
      <label>Public profile<select name="publicWikiPageId">
        <option value="">None</option>
        {wikiPages.map((page) => <option value={page.id} selected={npc?.publicWikiPageId === page.id}>{page.title}</option>)}
      </select></label>
      <label>Rules/stat block<select name="rulesEntityId">
        <option value="">None</option>
        {rules.map((rule) => <option value={rule.id} selected={npc?.rulesEntityId === rule.id}>{rule.name}</option>)}
      </select></label>
      <label>Motivations<input name="motivations" type="text" value={npc?.motivations ?? ""} /></label>
      <label>Hooks<input name="hooks" type="text" value={npc?.hooks ?? ""} /></label>
      <label class="campaign-session-form-wide">Game Master notes<textarea name="gmNotes" rows={4}>{npc?.gmNotes ?? ""}</textarea></label>
      <label class="campaign-session-form-wide">Secrets<textarea name="secrets" rows={4}>{npc?.secrets ?? ""}</textarea></label>
      <label class="campaign-session-form-wide">Scene notes<textarea name="sceneNotes" rows={4}>{npc?.sceneNotes ?? ""}</textarea></label>
      <label class="campaign-session-form-wide">Reveal notes<textarea name="revealNotes" rows={3}>{npc?.revealNotes ?? ""}</textarea></label>
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

function isNpcDossier(npc: CampaignNpcDossier | CampaignNpcSummary): npc is CampaignNpcDossier {
  return "gmNotes" in npc;
}

interface CampaignWikiDetailPageProps {
  appName: string;
  campaign: CampaignSummary;
  cover: CampaignImageAsset | null;
  galleryAssets: CampaignImageAsset[];
  inlineAssets: CampaignImageAsset[];
  page: CampaignWikiPage;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const CampaignWikiDetailPage = ({ appName, campaign, cover, galleryAssets, inlineAssets, page, user }: CampaignWikiDetailPageProps) => (
  <Layout title={`${page.title} - ${campaign.name} - ${appName}`}>
    <div class="shell campaign-shell">
      <SiteHeader appName={appName} currentSection="campaign" user={user} />
      <main class="campaign-main" aria-labelledby="campaign-wiki-detail-heading">
        <Panel labelledBy="campaign-wiki-detail-heading">
          <a class="action-link" href={`/campaigns/${campaign.slug}`}>Back to campaign</a>
          {cover ? <img alt={cover.altText} class="campaign-wiki-hero" src={`/campaigns/${campaign.slug}/assets/${cover.id}`} /> : null}
          <p class="campaign-kicker">{page.pageType}</p>
          <h1 id="campaign-wiki-detail-heading" class="panel-heading">{page.title}</h1>
          <div class="campaign-tag-list">{page.tags.map((tag) => <span>{tag}</span>)}</div>
          <article class="campaign-markdown">{renderCampaignMarkdown(page.bodyMarkdown, (assetId, altText) => {
            const asset = inlineAssets.find((item) => item.id === assetId);
            if (!asset) return null;

            return {
              altText: altText || asset.altText,
              src: `/campaigns/${campaign.slug}/assets/${asset.id}`,
            };
          })}</article>
          {galleryAssets.length > 0 ? (
            <div class="campaign-asset-list" aria-label={`${page.title} gallery`}>
              {galleryAssets.map((asset) => (
                <figure>
                  <img alt={asset.altText} src={`/campaigns/${campaign.slug}/assets/${asset.id}`} />
                  <figcaption>{asset.title}{asset.caption ? ` - ${asset.caption}` : ""}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </Panel>
      </main>
    </div>
  </Layout>
);

function formatRulesCategory(category: RulesSourceSummary["contentCategory"]) {
  if (category === "srd") return "SRD";
  if (category === "local") return "Local";

  return "Non-SRD";
}

function assetStatusLabels(asset: CampaignImageAsset) {
  const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Dimensions unknown";
  const source = asset.id.startsWith("campaign_image_asset_") ? "Uploaded" : "Seeded";
  const visibility = asset.visibility === "game_master" ? "Game Master only" : "Player visible";

  return [source, visibility, dimensions, "Fallback shown if file is missing locally"];
}
