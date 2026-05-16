import { Badge } from "../../atoms/Badge";
import { LabelledOutput } from "../../atoms/LabelledOutput";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";
import type { AuthUser } from "../../../db";

interface HomePageProps {
  appName: string;
  user?: {
    displayName: string;
    role: AuthUser["role"];
  };
}

const keyStats = [
  { label: "Armour class", value: "17" },
  { label: "Hit points", value: "31" },
  { label: "Initiative", value: "+3" },
  { label: "Speed", value: "30 ft" },
];

export const HomePage = ({ appName, user }: HomePageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell">
        <SiteHeader appName={appName} currentSection="sheet" user={user} />

        <main class="home-main">
          {user ? (
            <p class="account-summary">
              {user.displayName} · {user.role}
            </p>
          ) : null}
          <section class="dashboard-panel" aria-labelledby="character-heading">
            <div class="character-summary">
              <div class="character-heading">
                <div>
                  <h2 id="character-heading" class="character-name">
                    Lynott Magulbisson
                  </h2>
                  <p class="character-kicker">Level 4 hobgoblin Artillerist Artificer</p>
                </div>
                <div class="badge-row" aria-label="Character state">
                  <Badge tone="accent">Ready</Badge>
                  <Badge tone="warning">Local SQLite</Badge>
                </div>
              </div>

              <div class="stat-grid" aria-label="Combat summary">
                {keyStats.map((stat) => (
                  <LabelledOutput label={stat.label} value={stat.value} />
                ))}
              </div>
            </div>

            <section aria-labelledby="sheet-sections-heading">
              <h3 id="sheet-sections-heading" class="section-heading">
                Sheet sections
              </h3>
              <dl class="sheet-list">
                <div class="sheet-row">
                  <dt>Core</dt>
                  <dd>Abilities, saves, senses, speed, and defence</dd>
                </div>
                <div class="sheet-row">
                  <dt>Actions</dt>
                  <dd>Weapons, spells, features, and rest actions</dd>
                </div>
                <div class="sheet-row">
                  <dt>Notes</dt>
                  <dd>Player notes and Game Master records</dd>
                </div>
              </dl>
            </section>
          </section>

          <div class="action-bar">
            <strong>Runtime scaffold online</strong>
            <a class="action-link" href="/sheet/character_lynott_magulbisson">
              Open sheet
            </a>
          </div>
        </main>
      </div>
    </Layout>
  );
};
