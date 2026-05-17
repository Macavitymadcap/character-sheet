import { describe, expect, test } from "bun:test";
import { SiteHeader } from "./SiteHeader";

const render = (node: unknown): string => String(node);

describe("SiteHeader", () => {
  test("renders primary navigation and the current user state", () => {
    const html = render(
      <SiteHeader
        appName="Character Sheet"
        currentSection="sheet"
        user={{ displayName: "Lynott Player", role: "player" }}
      />,
    );

    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain('<span class="site-title">Character Sheet</span>');
    expect(html).toContain('<nav class="site-nav" aria-label="Primary">');
    expect(html).toContain('<a href="/sheet/character_lynott_magulbisson" aria-current="page">Sheet</a>');
    expect(html).toContain('id="theme-toggle"');
    expect(html).toContain('data-theme-toggle=""');
    expect(html).toContain("Lynott Player");
    expect(html).toContain("Player");
    expect(html).toContain('<a class="site-auth-link" href="/logout">Sign out</a>');
  });

  test("renders a sign-in link for visitors", () => {
    const html = render(<SiteHeader appName="Character Sheet" currentSection="home" />);

    expect(html).not.toContain('<nav class="site-nav"');
    expect(html).toContain('<a class="site-auth-link" href="/login">Sign in</a>');
  });

  test("renders role-specific navigation", () => {
    const gm = render(
      <SiteHeader
        appName="Character Sheet"
        currentSection="campaign"
        user={{ displayName: "Game Master", role: "game_master" }}
      />,
    );
    const admin = render(
      <SiteHeader
        appName="Character Sheet"
        currentSection="admin"
        user={{ displayName: "Admin", role: "admin" }}
      />,
    );

    expect(gm).toContain('<a href="/campaigns/rovnost-shadows" aria-current="page">Campaign</a>');
    expect(admin).toContain('<a href="/admin" aria-current="page">Admin</a>');
  });
});
