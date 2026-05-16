import { describe, expect, test } from "bun:test";
import { LoginPage } from "./Login";

const render = (node: unknown): string => String(node);

describe("LoginPage", () => {
  test("renders a local sign-in form", () => {
    const html = render(<LoginPage appName="Character Sheet" />);

    expect(html).toContain("<title>Character Sheet</title>");
    expect(html).toContain("Sign in");
    expect(html).toContain('method="post"');
    expect(html).toContain('action="/login"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
  });

  test("renders authentication errors", () => {
    const html = render(<LoginPage appName="Character Sheet" error="Invalid email or password." />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Invalid email or password.");
  });
});
