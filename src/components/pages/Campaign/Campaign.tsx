import { renderCampaignMarkdown } from "../../../campaigns/wiki";
import type {
  AuthUser,
  CampaignContentImport,
  CampaignImageAsset,
  CampaignImageAssetUsage,
  CampaignImportSourceFormat,
  CampaignImportTargetType,
  CampaignMember,
  CampaignNpcDossier,
  CampaignNpcSummary,
  CampaignSessionRecord,
  CampaignSummary,
  CampaignWikiPage,
  CharacterNote,
  CharacterRosterItem,
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

export interface CampaignImageLibraryItem extends CampaignImageAsset {
  fileStatus: "available" | "fallback";
  usageCount: number;
}

export interface CampaignImageDetail extends CampaignImageAsset {
  fileStatus: "available" | "fallback";
  usages: CampaignImageAssetUsage[];
}

export interface CampaignImportPreviewModel {
  content: string;
  convertedMarkdown: string;
  detectedTitle: string;
  provider: "manual" | "google_docs_manual";
  sourceFormat: CampaignImportSourceFormat;
  sourceReference: string | null;
  sourceTitle: string;
  targetType: CampaignImportTargetType;
  visibility: "game_master" | "player";
  warnings: string[];
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
                <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}/images`}>Images</a>
                <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}/preview/player`}>Player preview</a>
              </nav>
            ) : (
              <nav class="campaign-action-row" aria-label="Campaign tools">
                <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}/npcs`}>NPCs</a>
              </nav>
            )}
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
            <p class="campaign-help-text"><a href={`/campaigns/${campaign.slug}/images`}>Open image library</a> to review metadata, usage, and local file status.</p>
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
            <a class="campaign-prep-link" href={`/campaigns/${campaign.slug}/images`}>
              <span>Images</span>
              <strong>Library</strong>
              <small>Uploads and usage</small>
            </a>
            <a class="campaign-prep-link" href={`/campaigns/${campaign.slug}/imports`}>
              <span>Imports</span>
              <strong>Drafts</strong>
              <small>Paste, preview, save</small>
            </a>
            <a class="campaign-prep-link" href={`/campaigns/${campaign.slug}/preview/player`}>
              <span>Player preview</span>
              <strong>Audit</strong>
              <small>Check visible prep</small>
            </a>
          </div>
        </Panel>
      </main>
    </div>
  </Layout>
);

interface VisibilityAuditItem {
  hidden: number;
  href: string;
  label: string;
  visible: number;
}

interface CampaignPlayerPreviewPageProps {
  appName: string;
  auditItems: VisibilityAuditItem[];
  campaign: CampaignSummary;
  imageAssets: CampaignImageAsset[];
  notesByCharacter: Array<{
    character: CharacterRosterItem;
    notes: CharacterNote[];
  }>;
  npcs: CampaignNpcSummary[];
  previewDisplayName: string | null;
  sessions: CampaignSessionRecord[];
  user: Pick<AuthUser, "displayName" | "role">;
  wikiPages: CampaignWikiPage[];
}

export const CampaignPlayerPreviewPage = ({
  appName,
  auditItems,
  campaign,
  imageAssets,
  notesByCharacter,
  npcs,
  previewDisplayName,
  sessions,
  user,
  wikiPages,
}: CampaignPlayerPreviewPageProps) => (
  <Layout title={`Player preview - ${campaign.name} - ${appName}`}>
    <div class="shell campaign-shell">
      <SiteHeader appName={appName} currentSection="campaign" user={user} />
      <main class="campaign-main" aria-labelledby="campaign-preview-heading">
        <Panel labelledBy="campaign-preview-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Game Master tool</p>
            <h1 id="campaign-preview-heading" class="panel-heading">Player preview</h1>
          </div>
          <p class="campaign-help-text">
            Previewing as {previewDisplayName ?? "a player"} using the same player-visible campaign reads as the live app.
          </p>
          <nav class="campaign-action-row" aria-label="Preview actions">
            <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}`}>Campaign</a>
            <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}/prep`}>Prep workspace</a>
            <a class="action-link action-link-secondary" href={`/campaigns/${campaign.slug}/npcs`}>NPCs</a>
          </nav>
        </Panel>
        <Panel labelledBy="campaign-visibility-audit-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Visibility audit</p>
            <h2 id="campaign-visibility-audit-heading" class="panel-heading">Visible to {previewDisplayName ?? "the previewed player"}</h2>
          </div>
          <div class="campaign-audit-grid">
            {auditItems.map((item) => (
              <a class="campaign-audit-card" href={item.href}>
                <span>{item.label}</span>
                <strong>{item.visible} visible</strong>
                <small>{item.hidden} hidden</small>
              </a>
            ))}
          </div>
        </Panel>
        <Panel labelledBy="campaign-preview-wiki-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Campaign wiki</p>
            <h2 id="campaign-preview-wiki-heading" class="panel-heading">Pages</h2>
          </div>
          <div class="campaign-wiki-grid">
            {wikiPages.map((page) => (
              <article class="campaign-wiki-card">
                <div class="campaign-wiki-card-body">
                  <p class="campaign-kicker">{page.pageType}</p>
                  <h3><a href={`/campaigns/${campaign.slug}/wiki/${page.slug}`}>{page.title}</a></h3>
                  <p class="campaign-card-copy">{previewText(page.bodyMarkdown)}</p>
                  <div class="campaign-tag-list" aria-label={`${page.title} tags`}>
                    {page.tags.map((tag) => <span>{tag}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {wikiPages.length === 0 ? <p class="campaign-empty-state">No player-visible wiki pages.</p> : null}
        </Panel>
        <Panel labelledBy="campaign-preview-npcs-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">NPCs</p>
            <h2 id="campaign-preview-npcs-heading" class="panel-heading">Visible NPCs</h2>
          </div>
          <div class="campaign-npc-grid">
            {npcs.map((npc) => <NpcSummaryCard campaign={campaign} npc={npc} />)}
          </div>
          {npcs.length === 0 ? <p class="campaign-empty-state">No NPCs visible to this player.</p> : null}
        </Panel>
        <Panel labelledBy="campaign-preview-sessions-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Sessions</p>
            <h2 id="campaign-preview-sessions-heading" class="panel-heading">Session records</h2>
          </div>
          <div class="campaign-source-list">
            {sessions.map((session) => (
              <article class="campaign-source-item">
                <h3>{session.title}</h3>
                <p class="campaign-help-text">{session.summary || "No public summary."}</p>
                {session.body ? <p class="campaign-card-copy">{previewText(session.body)}</p> : null}
                <div class="campaign-tag-list">
                  <span>{session.sessionDate ?? "No date"}</span>
                  <span>Player visible</span>
                </div>
              </article>
            ))}
          </div>
          {sessions.length === 0 ? <p class="campaign-empty-state">No player-visible sessions.</p> : null}
        </Panel>
        <Panel labelledBy="campaign-preview-images-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Images</p>
            <h2 id="campaign-preview-images-heading" class="panel-heading">Player-visible images</h2>
          </div>
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
          {imageAssets.length === 0 ? <p class="campaign-empty-state">No player-visible images.</p> : null}
        </Panel>
        <Panel labelledBy="campaign-preview-notes-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Character notes</p>
            <h2 id="campaign-preview-notes-heading" class="panel-heading">Player-visible notes</h2>
          </div>
          <div class="campaign-source-list">
            {notesByCharacter.map(({ character, notes }) => (
              <article class="campaign-source-item">
                <h3>{character.name}</h3>
                <div class="campaign-tag-list">
                  <span>{notes.length} visible</span>
                  <span>{character.ownerDisplayName}</span>
                </div>
                <div class="campaign-note-preview-list">
                  {notes.map((note) => (
                    <section>
                      <h4>{note.title}</h4>
                      <p>{previewText(note.body)}</p>
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
          {notesByCharacter.length === 0 ? <p class="campaign-empty-state">No character notes visible to players.</p> : null}
        </Panel>
      </main>
    </div>
  </Layout>
);

function previewText(value: string, maxLength = 160) {
  const text = value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/[#*_`>[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

interface NpcListPageProps {
  appName: string;
  campaign: CampaignSummary;
  imageAssets: CampaignImageAsset[];
  npcs: Array<CampaignNpcDossier | CampaignNpcSummary>;
  playerMembers: Array<CampaignMember & { displayName: string }>;
  rules: RuleSummary[];
  user: Pick<AuthUser, "displayName" | "role">;
  viewerRole: CampaignMember["role"];
  wikiPages: CampaignWikiPage[];
}

export const NpcListPage = ({ appName, campaign, imageAssets, npcs, playerMembers, rules, user, viewerRole, wikiPages }: NpcListPageProps) => (
  <Layout title={`NPCs - ${campaign.name} - ${appName}`}>
    <div class="shell campaign-shell">
      <SiteHeader appName={appName} currentSection="campaign" user={user} />
      <main class="campaign-main" aria-labelledby="campaign-npcs-heading">
        <Panel labelledBy="campaign-npcs-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">{viewerRole === "game_master" ? "Game Master" : "Campaign"}</p>
            <h1 id="campaign-npcs-heading" class="panel-heading">NPCs</h1>
          </div>
          <div class="campaign-npc-grid">
            {npcs.map((npc) => <NpcSummaryCard campaign={campaign} npc={npc} />)}
          </div>
          {npcs.length === 0 ? <p class="campaign-empty-state">No NPC dossiers yet.</p> : null}
        </Panel>
        {viewerRole === "game_master" ? <Panel labelledBy="campaign-npc-create-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Private prep</p>
            <h2 id="campaign-npc-create-heading" class="panel-heading">Add NPC</h2>
          </div>
          <p class="campaign-help-text"><a href={`/campaigns/${campaign.slug}/images`}>Upload or manage campaign images</a> before choosing a portrait.</p>
          <NpcForm
            action={`/campaigns/${campaign.slug}/npcs`}
            imageAssets={imageAssets}
            playerMembers={playerMembers}
            rules={rules}
            submitLabel="Add NPC"
            wikiPages={wikiPages}
          />
        </Panel> : null}
      </main>
    </div>
  </Layout>
);

interface CampaignImageLibraryPageProps {
  appName: string;
  campaign: CampaignSummary;
  imageAssets: CampaignImageLibraryItem[];
  user: Pick<AuthUser, "displayName" | "role">;
  viewerRole: CampaignMember["role"];
}

export const CampaignImageLibraryPage = ({ appName, campaign, imageAssets, user, viewerRole }: CampaignImageLibraryPageProps) => {
  const canManage = viewerRole === "game_master";

  return (
    <Layout title={`Images - ${campaign.name} - ${appName}`}>
      <div class="shell campaign-shell">
        <SiteHeader appName={appName} currentSection="campaign" user={user} />
        <main class="campaign-main" aria-labelledby="campaign-images-heading">
          <Panel labelledBy="campaign-images-heading">
            <a class="action-link" href={`/campaigns/${campaign.slug}`}>Back to campaign</a>
            <div class="campaign-heading">
              <p class="campaign-kicker">{canManage ? "Game Master" : "Campaign"}</p>
              <h1 id="campaign-images-heading" class="panel-heading">Images</h1>
            </div>
            <div class="campaign-asset-list">
              {imageAssets.map((asset) => <CampaignImageCard asset={asset} campaign={campaign} />)}
            </div>
            {imageAssets.length === 0 ? <p class="campaign-empty-state">No images available.</p> : null}
          </Panel>
          {canManage ? <Panel labelledBy="campaign-image-upload-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">Local photo workflow</p>
              <h2 id="campaign-image-upload-heading" class="panel-heading">Add image</h2>
            </div>
            <p class="campaign-help-text">Upload PNG, JPEG, or WebP files from this computer. Campaign Ledger stores an app-managed copy, so source filenames and local paths are not exposed.</p>
            <ImageUploadForm campaign={campaign} />
          </Panel> : null}
        </main>
      </div>
    </Layout>
  );
};

interface CampaignImageDetailPageProps {
  appName: string;
  asset: CampaignImageDetail;
  campaign: CampaignSummary;
  user: Pick<AuthUser, "displayName" | "role">;
  viewerRole: CampaignMember["role"];
}

export const CampaignImageDetailPage = ({ appName, asset, campaign, user, viewerRole }: CampaignImageDetailPageProps) => {
  const canManage = viewerRole === "game_master";

  return (
    <Layout title={`${asset.title} - Images - ${campaign.name} - ${appName}`}>
      <div class="shell campaign-shell">
        <SiteHeader appName={appName} currentSection="campaign" user={user} />
        <main class="campaign-main" aria-labelledby="campaign-image-detail-heading">
          <Panel labelledBy="campaign-image-detail-heading">
            <a class="action-link" href={`/campaigns/${campaign.slug}/images`}>Back to images</a>
            <figure class="campaign-image-detail-figure">
              <img alt={asset.altText} src={`/campaigns/${campaign.slug}/assets/${asset.id}`} />
              <figcaption>{asset.caption || asset.title}</figcaption>
            </figure>
            <div class="campaign-heading">
              <p class="campaign-kicker">{asset.visibility === "game_master" ? "Game Master only" : "Player visible"}</p>
              <h1 id="campaign-image-detail-heading" class="panel-heading">{asset.title}</h1>
            </div>
            <p class="campaign-card-copy">{asset.altText}</p>
            <div class="campaign-asset-status">
              {assetStatusLabels(asset).map((label) => <span>{label}</span>)}
              <span>{asset.fileStatus === "available" ? "File available" : "Fallback active"}</span>
              <span>{formatByteSize(asset.byteSize)}</span>
            </div>
            {canManage ? (
              <dl class="campaign-image-metadata">
                <div><dt>Storage key</dt><dd>{asset.storageKey}</dd></div>
                <div><dt>MIME type</dt><dd>{asset.mimeType}</dd></div>
                <div><dt>Byte size</dt><dd>{formatByteSize(asset.byteSize)}</dd></div>
              </dl>
            ) : null}
          </Panel>
          {canManage ? <Panel labelledBy="campaign-image-usage-heading">
            <div class="campaign-heading">
              <p class="campaign-kicker">References</p>
              <h2 id="campaign-image-usage-heading" class="panel-heading">Usage</h2>
            </div>
            {asset.usages.length > 0 ? (
              <div class="campaign-source-list">
                {asset.usages.map((usage) => (
                  <article class="campaign-source-item">
                    <p class="campaign-kicker">{usage.type}</p>
                    <h3><a href={usage.href}>{usage.label}</a></h3>
                  </article>
                ))}
              </div>
            ) : <p class="campaign-empty-state">This image is not linked from wiki pages, NPCs, or factions yet.</p>}
          </Panel> : null}
        </main>
      </div>
    </Layout>
  );
};

function CampaignImageCard({ asset, campaign }: { asset: CampaignImageLibraryItem; campaign: CampaignSummary }) {
  return (
    <figure>
      <a href={`/campaigns/${campaign.slug}/images/${asset.id}`}>
        <img alt={asset.altText} src={`/campaigns/${campaign.slug}/assets/${asset.id}`} />
      </a>
      <figcaption>
        <strong><a href={`/campaigns/${campaign.slug}/images/${asset.id}`}>{asset.title}</a></strong>
        {asset.caption ? <span>{asset.caption}</span> : null}
        <span>{asset.altText}</span>
        <span class="campaign-asset-status">
          {assetStatusLabels(asset).map((label) => <span>{label}</span>)}
          <span>{asset.fileStatus === "available" ? "File available" : "Fallback active"}</span>
          <span>{formatByteSize(asset.byteSize)}</span>
          <span>{asset.usageCount} uses</span>
        </span>
      </figcaption>
    </figure>
  );
}

function ImageUploadForm({ campaign }: { campaign: CampaignSummary }) {
  return (
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
  );
}

interface CampaignImportBaseProps {
  appName: string;
  campaign: CampaignSummary;
  user: Pick<AuthUser, "displayName" | "role">;
}

interface CampaignImportPageProps extends CampaignImportBaseProps {
  imports: CampaignContentImport[];
}

export const CampaignImportPage = ({ appName, campaign, imports, user }: CampaignImportPageProps) => (
  <Layout title={`Imports - ${campaign.name} - ${appName}`}>
    <div class="shell campaign-shell">
      <SiteHeader appName={appName} currentSection="campaign" user={user} />
      <main class="campaign-main" aria-labelledby="campaign-import-heading">
        <Panel labelledBy="campaign-import-heading">
          <a class="action-link" href={`/campaigns/${campaign.slug}/prep`}>Back to prep</a>
          <div class="campaign-heading">
            <p class="campaign-kicker">Game Master import</p>
            <h1 id="campaign-import-heading" class="panel-heading">Stage campaign writing</h1>
          </div>
          <p class="campaign-help-text">Paste exported Markdown or a small HTML excerpt, preview the safe campaign Markdown, then save it as a wiki page, session record, NPC dossier, or retained draft.</p>
          <CampaignImportForm campaign={campaign} />
        </Panel>
        <Panel labelledBy="campaign-imports-recent-heading">
          <div class="campaign-heading">
            <p class="campaign-kicker">Import history</p>
            <h2 id="campaign-imports-recent-heading" class="panel-heading">Recent imports</h2>
          </div>
          {imports.length > 0 ? (
            <div class="campaign-source-list">
              {imports.map((item) => (
                <article class="campaign-source-item">
                  <p class="campaign-kicker">{importTargetLabel(item.targetType)}</p>
                  <h3>{item.sourceTitle}</h3>
                  <p class="campaign-card-copy">{item.targetRecordId ? "Saved to campaign content." : "Retained as draft."}</p>
                  <span class="campaign-asset-status">
                    <span>{item.provider === "google_docs_manual" ? "Google Docs manual" : "Manual import"}</span>
                    <span>{item.visibility === "player" ? "Player visible" : "Game Master only"}</span>
                  </span>
                </article>
              ))}
            </div>
          ) : <p class="campaign-empty-state">No staged imports yet.</p>}
        </Panel>
      </main>
    </div>
  </Layout>
);

interface CampaignImportPreviewPageProps extends CampaignImportBaseProps {
  preview: CampaignImportPreviewModel;
}

export const CampaignImportPreviewPage = ({ appName, campaign, preview, user }: CampaignImportPreviewPageProps) => (
  <Layout title={`Import preview - ${campaign.name} - ${appName}`}>
    <div class="shell campaign-shell">
      <SiteHeader appName={appName} currentSection="campaign" user={user} />
      <main class="campaign-main" aria-labelledby="campaign-import-preview-heading">
        <Panel labelledBy="campaign-import-preview-heading">
          <a class="action-link" href={`/campaigns/${campaign.slug}/imports`}>Back to import</a>
          <div class="campaign-heading">
            <p class="campaign-kicker">Preview</p>
            <h1 id="campaign-import-preview-heading" class="panel-heading">{preview.detectedTitle}</h1>
          </div>
          <div class="campaign-asset-status">
            <span>{importTargetLabel(preview.targetType)}</span>
            <span>{preview.visibility === "player" ? "Player visible" : "Game Master only"}</span>
            <span>{preview.sourceFormat.toUpperCase()} source</span>
          </div>
          {preview.warnings.length > 0 ? (
            <div class="campaign-import-warning-list" role="status">
              {preview.warnings.map((warning) => <p>{warning}</p>)}
            </div>
          ) : null}
          <div class="campaign-markdown">
            {renderCampaignMarkdown(preview.convertedMarkdown)}
          </div>
          <form class="campaign-session-form" action={`/campaigns/${campaign.slug}/imports/save`} method="post">
            {importHiddenFields(preview)}
            <label>Final title<input name="title" required type="text" value={preview.detectedTitle} /></label>
            <label>Target<select name="targetType">
              {importTargetOption("wiki", preview.targetType)}
              {importTargetOption("session", preview.targetType)}
              {importTargetOption("npc", preview.targetType)}
              {importTargetOption("draft", preview.targetType)}
            </select></label>
            <label>Visibility<select name="visibility">
              <option value="game_master" selected={preview.visibility === "game_master"}>Game Master</option>
              <option value="player" selected={preview.visibility === "player"}>Player</option>
            </select></label>
            <button type="submit">Save import</button>
          </form>
        </Panel>
      </main>
    </div>
  </Layout>
);

function CampaignImportForm({ campaign }: { campaign: CampaignSummary }) {
  return (
    <form class="campaign-session-form" action={`/campaigns/${campaign.slug}/imports/preview`} method="post">
      <label>Source/export title<input name="sourceTitle" type="text" /></label>
      <label>Source reference<input name="sourceReference" type="text" /></label>
      <label>Source format<select name="sourceFormat"><option value="markdown">Markdown</option><option value="html">HTML</option></select></label>
      <label>Target<select name="targetType">
        <option value="wiki">Wiki page</option>
        <option value="session">Session record</option>
        <option value="npc">NPC dossier</option>
        <option value="draft">Retained draft</option>
      </select></label>
      <label>Visibility<select name="visibility"><option value="game_master">Game Master</option><option value="player">Player</option></select></label>
      <label class="campaign-session-form-wide">Content<textarea name="content" required rows={12}></textarea></label>
      <button type="submit">Preview import</button>
    </form>
  );
}

function importHiddenFields(preview: CampaignImportPreviewModel) {
  return (
    <>
      <input name="provider" type="hidden" value={preview.provider} />
      <input name="sourceFormat" type="hidden" value={preview.sourceFormat} />
      <input name="sourceTitle" type="hidden" value={preview.sourceTitle} />
      <input name="sourceReference" type="hidden" value={preview.sourceReference ?? ""} />
      <input name="convertedMarkdown" type="hidden" value={preview.convertedMarkdown} />
      <input name="conversionNotes" type="hidden" value={preview.warnings.join("\n")} />
    </>
  );
}

function importTargetOption(targetType: CampaignImportTargetType, current: CampaignImportTargetType) {
  return <option value={targetType} selected={targetType === current}>{importTargetLabel(targetType)}</option>;
}

function importTargetLabel(targetType: CampaignImportTargetType) {
  if (targetType === "npc") return "NPC dossier";
  if (targetType === "session") return "Session record";
  if (targetType === "wiki") return "Wiki page";

  return "Retained draft";
}

interface NpcDetailPageProps {
  appName: string;
  campaign: CampaignSummary;
  imageAssets: CampaignImageAsset[];
  npc: CampaignNpcDossier | CampaignNpcSummary;
  playerMembers: Array<CampaignMember & { displayName: string }>;
  rules: RuleSummary[];
  user: Pick<AuthUser, "displayName" | "role">;
  viewerRole: CampaignMember["role"];
  wikiPages: CampaignWikiPage[];
}

export const NpcDetailPage = ({ appName, campaign, imageAssets, npc, playerMembers, rules, user, viewerRole, wikiPages }: NpcDetailPageProps) => {
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
              <p class="campaign-kicker">{npcVisibilityLabel(npc.visibility)}</p>
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
              <span>{npcVisibilityLabel(npc.visibility)}</span>
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
                <input type="hidden" name="visibility" value={npc.visibility === "public" ? "private" : "public"} />
                <button type="submit">{npc.visibility === "public" ? "Make private" : "Make public"}</button>
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
                imageAssets={imageAssets}
                npc={npc}
                playerMembers={playerMembers}
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

function NpcSummaryCard({ campaign, npc }: { campaign: CampaignSummary; npc: CampaignNpcDossier | CampaignNpcSummary }) {
  return (
    <article class="campaign-npc-card">
      <div>
        <p class="campaign-kicker">{npcVisibilityLabel(npc.visibility)}</p>
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
  playerMembers,
  rules,
  submitLabel,
  wikiPages,
}: {
  action: string;
  imageAssets: CampaignImageAsset[];
  npc?: CampaignNpcDossier;
  playerMembers: Array<CampaignMember & { displayName: string }>;
  rules: RuleSummary[];
  submitLabel: string;
  wikiPages: CampaignWikiPage[];
}) {
  return (
    <form class="campaign-session-form" action={action} method="post">
      <label>Name<input name="name" required type="text" value={npc?.name ?? ""} /></label>
      <label>Visibility<select name="visibility">
        <option value="private" selected={!npc || npc.visibility === "private"}>Private</option>
        <option value="public" selected={npc?.visibility === "public"}>Public</option>
        <option value="selected" selected={npc?.visibility === "selected"}>Selected players</option>
      </select></label>
      <fieldset class="campaign-session-form-wide campaign-checkbox-list">
        <legend>Selected players</legend>
        {playerMembers.map((member) => (
          <label>
            <input
              checked={npc?.selectedPlayerIds.includes(member.userId)}
              name="selectedPlayerIds"
              type="checkbox"
              value={member.userId}
            />
            <span>{member.displayName}</span>
          </label>
        ))}
      </fieldset>
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

function npcVisibilityLabel(visibility: CampaignNpcDossier["visibility"]) {
  if (visibility === "public") return "Public";
  if (visibility === "selected") return "Selected players";

  return "Private";
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

  return [source, visibility, dimensions];
}

function formatByteSize(byteSize: number) {
  if (byteSize < 1024) return `${byteSize} B`;
  const kib = byteSize / 1024;
  if (kib < 1024) return `${kib.toFixed(1)} KiB`;

  return `${(kib / 1024).toFixed(1)} MiB`;
}
