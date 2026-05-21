import { renderCampaignMarkdown } from "../../../campaigns/wiki";
import type { AuthUser, CampaignImageAsset, CampaignMember, CampaignSessionRecord, CampaignSummary, CampaignWikiPage, RulesSourceSummary } from "../../../db";
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
