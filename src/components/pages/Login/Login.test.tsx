import { describe, expect, test } from "bun:test";
import { LoginPage } from "./Login";

const render = (node: unknown): string => String(node);

describe("LoginPage", () => {
  test("renders a local sign-in form", () => {
    const html = render(<LoginPage appName="Character Sheet" />);

    expect(html).toContain("<title>Character Sheet</title>");
    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain('id="theme-toggle"');
    expect(html).toContain("Sign in");
    expect(html).toContain('<section class="panel" data-width="narrow" aria-labelledby="login-heading">');
    expect(html).toContain('<form class="form-stack" action="/login" method="post">');
    expect(html).toContain('method="post"');
    expect(html).toContain('action="/login"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain('<button class="button" data-variant="primary" type="submit">Sign in</button>');
  });

  test("renders authentication errors", () => {
    const html = render(<LoginPage appName="Character Sheet" error="Invalid email or password." />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Invalid email or password.");
  });
});
