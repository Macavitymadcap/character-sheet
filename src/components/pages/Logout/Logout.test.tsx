import { describe, expect, test } from "bun:test";
import { LogoutPage } from "./Logout";

const render = (node: unknown): string => String(node);

describe("LogoutPage", () => {
  test("renders the shared header and sign-out confirmation", () => {
    const html = render(
      <LogoutPage appName="Character Sheet" user={{ displayName: "Lynott Player", role: "player" }} />,
    );

    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain("Lynott Player");
    expect(html).toContain('<h1 id="logout-heading" class="panel-heading">Sign out</h1>');
    expect(html).toContain('<form class="form-stack" action="/logout" method="post">');
  });

  test("renders a signed-out state for visitors", () => {
    const html = render(<LogoutPage appName="Character Sheet" />);

    expect(html).toContain('<h1 id="logout-heading" class="panel-heading">Signed out</h1>');
    expect(html).toContain('<a class="action-link" href="/login">Sign in</a>');
  });
});
