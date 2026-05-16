import { describe, expect, test } from "bun:test";
import { HomePage } from "./Home";

const render = (node: unknown): string => String(node);

describe("HomePage", () => {
  test("renders the app shell, navigation, and Lynott summary", () => {
    const html = render(<HomePage appName="Character Sheet" />);

    expect(html).toContain('<title>Character Sheet</title>');
    expect(html).toContain('<h1 class="site-title">Character Sheet</h1>');
    expect(html).toContain('<nav class="site-nav" aria-label="Primary">');
    expect(html).toContain('<a href="/" aria-current="page">Sheet</a>');
    expect(html).toContain('<a href="/rules">Rules</a>');
    expect(html).toContain('<a href="/admin">Admin</a>');
    expect(html).toContain('<h2 id="character-heading" class="character-name">Lynott Magulbisson</h2>');
    expect(html).toContain("Level 4 hobgoblin Artillerist Artificer");
    expect(html).toContain('<div class="badge-row" aria-label="Character state">');
    expect(html).toContain('<span class="badge" data-tone="accent">Ready</span>');
    expect(html).toContain('<span class="badge" data-tone="warning">Local SQLite</span>');
  });

  test("renders stable labelled outputs for the current scaffold", () => {
    const html = render(<HomePage appName="Character Sheet" />);

    expect(html).toContain('<div class="stat-grid" aria-label="Combat summary">');
    expect(html).toContain('<span class="labelled-output-label">Armour class</span>');
    expect(html).toContain('<strong class="labelled-output-value">18</strong>');
    expect(html).toContain('<span class="labelled-output-label">Hit points</span>');
    expect(html).toContain('<strong class="labelled-output-value">35</strong>');
    expect(html).toContain('<span class="labelled-output-label">Initiative</span>');
    expect(html).toContain('<strong class="labelled-output-value">+2</strong>');
    expect(html).toContain('<span class="labelled-output-label">Speed</span>');
    expect(html).toContain('<strong class="labelled-output-value">30 ft</strong>');
  });

  test("keeps the sheet sections and health action discoverable", () => {
    const html = render(<HomePage appName="Character Sheet" />);

    expect(html).toContain('<section aria-labelledby="sheet-sections-heading">');
    expect(html).toContain('<h3 id="sheet-sections-heading" class="section-heading">Sheet sections</h3>');
    expect(html).toContain("<dt>Core</dt>");
    expect(html).toContain("<dd>Abilities, saves, senses, speed, and defence</dd>");
    expect(html).toContain("<dt>Actions</dt>");
    expect(html).toContain("<dd>Weapons, spells, features, and rest actions</dd>");
    expect(html).toContain("<dt>Notes</dt>");
    expect(html).toContain("<dd>Player notes and Game Master records</dd>");
    expect(html).toContain('<a class="action-link" href="/healthz">Health check</a>');
  });
});
