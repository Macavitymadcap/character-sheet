import type { AuthUser, CampaignMember, CampaignSummary } from "../../../db";
import { Panel } from "../../atoms/Panel";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface CampaignPageProps {
  appName: string;
  campaign: CampaignSummary;
  members: CampaignMember[];
  user: Pick<AuthUser, "displayName" | "role">;
}

export const CampaignPage = ({ appName, campaign, members, user }: CampaignPageProps) => {
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
        </main>
      </div>
    </Layout>
  );
};
