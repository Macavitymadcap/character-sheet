import { Panel } from "../../atoms/Panel";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

type LocalPlayKind = "campaigns" | "characters";

interface LocalPlayPageProps {
  appName: string;
  kind: LocalPlayKind;
}

export const LocalPlayPage = ({ appName, kind }: LocalPlayPageProps) => {
  const title = kind === "characters" ? "Local characters" : "Local campaigns";
  const description = kind === "characters"
    ? "Browser-local character tracking will keep table notes on this device without requiring sign-in."
    : "Browser-local campaign tracking will keep table records on this device without requiring sign-in.";

  return (
    <Layout title={`${title} - ${appName}`}>
      <div class="shell auth-page-shell">
        <SiteHeader appName={appName} currentSection="local" />
        <main class="auth-shell" aria-labelledby="local-play-heading">
          <Panel labelledBy="local-play-heading">
            <p class="rules-kicker">Public local play</p>
            <h1 id="local-play-heading" class="panel-heading">{title}</h1>
            <p class="auth-copy">{description}</p>
            <p class="auth-copy">
              For now, public SRD rules are ready to use. Local storage, import, and export are the
              next public play slice.
            </p>
            <div class="home-actions">
              <a class="action-link" href="/rules">Browse SRD rules</a>
              <a class="action-link action-link-secondary" href="/login">Sign in</a>
            </div>
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
