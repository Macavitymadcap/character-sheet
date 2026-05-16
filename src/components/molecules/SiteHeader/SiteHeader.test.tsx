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
    expect(html).toContain('<a href="/rules">Rules</a>');
    expect(html).toContain('<a href="/admin">Admin</a>');
    expect(html).toContain("Lynott Player");
    expect(html).toContain("Player");
    expect(html).toContain('<form action="/logout" method="post">');
  });

  test("renders a sign-in link for visitors", () => {
    const html = render(<SiteHeader appName="Character Sheet" currentSection="sheet" />);

    expect(html).toContain('<a class="site-login-link" href="/login">Sign in</a>');
  });
});
