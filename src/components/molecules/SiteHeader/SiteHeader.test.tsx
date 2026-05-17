import { describe, expect, test } from "bun:test";
import { SiteHeader } from "./SiteHeader";

const render = (node: unknown): string => String(node);

describe("SiteHeader", () => {
  test("renders primary navigation and the current user identity", () => {
    const html = render(
      <SiteHeader
        appName="Character Sheet"
        currentSection="sheet"
        user={{ displayName: "Lynott Player", role: "player" }}
      />,
    );

    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain('<span class="site-title">Character Sheet</span>');
    expect(html).toContain('<a class="site-brand" href="/">');
    expect(html).toContain('popovertarget="site-menu-panel"');
    expect(html).toContain('<a class="popover-menu-item" href="/" role="menuitem">Home</a>');
    expect(html).toContain(
      '<a class="popover-menu-item" href="/sheet/lynott" role="menuitem" aria-current="page">Sheet</a>',
    );
    expect(html).toContain('id="theme-toggle"');
    expect(html).toContain('data-theme-toggle=""');
    expect(html).toContain("Lynott Player");
    expect(html).toContain("Player");
    expect(html).toContain('<a class="popover-menu-item" href="/logout" role="menuitem">Sign out</a>');
  });

  test("renders a sign-in link for visitors", () => {
    const html = render(<SiteHeader appName="Character Sheet" currentSection="home" />);

    expect(html).toContain("Visitor");
    expect(html).toContain(
      '<a class="popover-menu-item" href="/" role="menuitem" aria-current="page">Home</a>',
    );
    expect(html).toContain('<a class="popover-menu-item" href="/login" role="menuitem">Sign in</a>');
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

    expect(gm).toContain(
      '<a class="popover-menu-item" href="/campaigns/rovnost-shadows" role="menuitem" aria-current="page">Campaign</a>',
    );
    expect(admin).toContain(
      '<a class="popover-menu-item" href="/admin" role="menuitem" aria-current="page">Admin</a>',
    );
  });
});
