import { describe, expect, test } from "bun:test";
import { HomePage } from "./Home";

const render = (node: unknown): string => String(node);

describe("HomePage", () => {
  test("renders the public base page and shared header", () => {
    const html = render(<HomePage appName="Character Sheet" />);

    expect(html).toContain('<title>Character Sheet</title>');
    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain('<span class="site-title">Character Sheet</span>');
    expect(html).toContain('<a class="site-auth-link" href="/login">Sign in</a>');
    expect(html).toContain('<h1 id="home-heading">Character Sheet</h1>');
    expect(html).toContain("Rovnost Shadows");
    expect(html).toContain('<a class="action-link" href="/login">Sign in</a>');
  });

  test("drops the scaffold sheet summary and status chips", () => {
    const html = render(<HomePage appName="Character Sheet" />);

    expect(html).not.toContain("Runtime scaffold online");
    expect(html).not.toContain("Local SQLite");
    expect(html).not.toContain('<span class="badge"');
    expect(html).not.toContain('<div class="stat-grid"');
  });

  test("links signed-in users to their role destination", () => {
    const player = render(
      <HomePage appName="Character Sheet" user={{ displayName: "Lynott Player", role: "player" }} />,
    );
    const gm = render(
      <HomePage appName="Character Sheet" user={{ displayName: "Game Master", role: "game_master" }} />,
    );
    const admin = render(
      <HomePage appName="Character Sheet" user={{ displayName: "Admin", role: "admin" }} />,
    );

    expect(player).toContain('<a class="action-link" href="/sheet/character_lynott_magulbisson">Continue</a>');
    expect(gm).toContain('<a class="action-link" href="/campaigns/rovnost-shadows">Continue</a>');
    expect(admin).toContain('<a class="action-link" href="/admin">Continue</a>');
  });
});
