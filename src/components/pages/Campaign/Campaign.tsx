import type { AuthUser, CampaignMember, CampaignSessionRecord, CampaignSummary } from "../../../db";
import { Panel } from "../../atoms/Panel";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface CampaignPageProps {
  appName: string;
  campaign: CampaignSummary;
  members: CampaignMember[];
  sessions: CampaignSessionRecord[];
  user: Pick<AuthUser, "displayName" | "role">;
}

export const CampaignPage = ({ appName, campaign, members, sessions, user }: CampaignPageProps) => {
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
                <dd>{user.displayName}</dd>
              </div>
              <div>
                <dt>Members</dt>
                <dd>{members.length}</dd>
              </div>
            </dl>
          </Panel>
          <Panel labelledBy="campaign-sessions-heading">
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
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
