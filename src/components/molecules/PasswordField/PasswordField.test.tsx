import { describe, expect, test } from "bun:test";
import { PasswordField } from "./PasswordField";

const render = (node: unknown): string => String(node);

describe("PasswordField", () => {
  test("renders a password input with a visibility toggle", () => {
    const html = render(
      <PasswordField
        autocomplete="new-password"
        id="new-password"
        label="New password"
        name="password"
      />,
    );

    expect(html).toContain('<label for="new-password">New password</label>');
    expect(html).toContain('type="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('autocomplete="new-password"');
    expect(html).toContain("data-password-field");
    expect(html).toContain('aria-controls="new-password"');
    expect(html).toContain("data-password-toggle");
  });
});
