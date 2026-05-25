import type { AuthUser } from "../../../db";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface HomePageProps {
  appName: string;
  user?: {
    capabilities?: AuthUser["capabilities"];
    campaignRoles?: AuthUser["campaignRoles"];
    displayName: string;
    role: AuthUser["role"];
  };
}

export const HomePage = ({ appName, user }: HomePageProps) => {
  const primaryAction = user ? getDestination(user) : null;

  return (
    <Layout title={appName}>
      <div class="shell home-shell">
        <SiteHeader appName={appName} currentSection="home" user={user} />

        <main class="home-main" aria-labelledby="home-heading">
          <section class="home-intro">
            <p class="home-kicker">Rovnost Shadows</p>
            <h1 id="home-heading">{appName}</h1>
            <p>
              Public SRD rules, browser-local play tools, and signed-in campaign records for
              Rovnost table nights.
            </p>
            <div class="home-actions">
              <a class="action-link" href="/rules">
                Browse SRD rules
              </a>
              <a class="action-link action-link-secondary" href="/local/characters">
                Local characters
              </a>
              <a class="action-link action-link-secondary" href="/local/campaigns">
                Local campaigns
              </a>
              {primaryAction ? (
                <a class="action-link action-link-secondary" href={primaryAction.href}>
                  {primaryAction.label}
                </a>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
};

function getDestination(user: NonNullable<HomePageProps["user"]>) {
  if (user.role === "admin" || (user.capabilities ?? []).includes("admin")) {
    return { href: "/admin", label: "Admin" };
  }
  if (user.role === "game_master" || (user.campaignRoles ?? []).includes("game_master")) {
    return { href: "/campaigns/rovnost-shadows", label: "Campaign" };
  }

  return { href: "/characters", label: "Characters" };
}
