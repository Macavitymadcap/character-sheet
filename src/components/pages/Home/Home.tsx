import type { AuthUser } from "../../../db";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface HomePageProps {
  appName: string;
  user?: {
    displayName: string;
    role: AuthUser["role"];
  };
}

export const HomePage = ({ appName, user }: HomePageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell home-shell">
        <SiteHeader appName={appName} currentSection="home" user={user} />

        <main class="home-main" aria-labelledby="home-heading">
          <section class="home-intro">
            <p class="home-kicker">Rovnost Shadows</p>
            <h1 id="home-heading">Character Sheet</h1>
            <p>
              Local table tools for Lynott, the Game Master, and campaign administration.
            </p>
            <div class="home-actions">
              {user ? (
                <a class="action-link" href={getDestination(user.role)}>
                  Continue
                </a>
              ) : (
                <a class="action-link" href="/login">
                  Sign in
                </a>
              )}
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
};

function getDestination(role: AuthUser["role"]) {
  if (role === "admin") return "/admin";
  if (role === "game_master") return "/campaigns/rovnost-shadows";

  return "/characters";
}
