import { describe, expect, test } from "bun:test";
import { HomePage } from "./Home";

const render = (node: unknown): string => String(node);

describe("HomePage", () => {
  test("renders the public base page and shared header", () => {
    const html = render(<HomePage appName="Campaign Ledger" />);

    expect(html).toContain('<title>Campaign Ledger</title>');
    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain('<span class="site-title">Campaign Ledger</span>');
    expect(html).toContain('<a class="popover-menu-item" href="/login" role="menuitem">Sign in</a>');
    expect(html).toContain('<h1 id="home-heading">Campaign Ledger</h1>');
    expect(html).toContain("Rovnost Shadows");
    expect(html).toContain('<a class="action-link" href="/login">Sign in</a>');
  });

  test("drops the scaffold sheet summary and status chips", () => {
    const html = render(<HomePage appName="Campaign Ledger" />);

    expect(html).not.toContain("Runtime scaffold online");
    expect(html).not.toContain("Local SQLite");
    expect(html).not.toContain('<span class="badge"');
    expect(html).not.toContain('<div class="stat-grid"');
  });

  test("links signed-in users to their role destination", () => {
    const player = render(
      <HomePage appName="Campaign Ledger" user={{ displayName: "Lynott Player", role: "player" }} />,
    );
    const gm = render(
      <HomePage appName="Campaign Ledger" user={{ displayName: "Game Master", role: "game_master" }} />,
    );
    const admin = render(
      <HomePage appName="Campaign Ledger" user={{ displayName: "Admin", role: "admin" }} />,
    );

    expect(player).toContain('<a class="action-link" href="/characters">Continue</a>');
    expect(gm).toContain('<a class="action-link" href="/campaigns/rovnost-shadows">Continue</a>');
    expect(admin).toContain('<a class="action-link" href="/admin">Continue</a>');
  });
});
