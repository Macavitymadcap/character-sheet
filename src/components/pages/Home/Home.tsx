import { Badge } from "../../atoms/Badge";
import { Layout } from "../../templates/Layout";

interface HomePageProps {
  appName: string;
}

const keyStats = [
  { label: "Armour class", value: "18" },
  { label: "Hit points", value: "35" },
  { label: "Initiative", value: "+2" },
  { label: "Speed", value: "30 ft" },
];

export const HomePage = ({ appName }: HomePageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell">
        <header class="site-header">
          <h1 class="site-title">{appName}</h1>
          <nav class="site-nav" aria-label="Primary">
            <a href="/" aria-current="page">
              Sheet
            </a>
            <a href="/rules">Rules</a>
            <a href="/admin">Admin</a>
          </nav>
        </header>

        <main class="home-main">
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
                  <div class="stat-card">
                    <span class="stat-label">{stat.label}</span>
                    <strong class="stat-value">{stat.value}</strong>
                  </div>
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
            <a class="action-link" href="/healthz">
              Health check
            </a>
          </div>
        </main>
      </div>
    </Layout>
  );
};
