import { describe, expect, test } from "bun:test";
import { PasswordResetPage } from "./PasswordReset";

const render = (node: unknown): string => String(node);

describe("PasswordResetPage", () => {
  test("renders safer password entry and confirmation", () => {
    const html = render(<PasswordResetPage appName="Campaign Ledger" token="reset-token" />);

    expect(html).toContain("Reset password");
    expect(html).toContain('action="/password-reset/reset-token"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="passwordConfirmation"');
    expect(html).toContain('aria-controls="reset-password"');
    expect(html).toContain('aria-controls="reset-password-confirmation"');
  });

  test("renders password confirmation errors", () => {
    const html = render(
      <PasswordResetPage
        appName="Campaign Ledger"
        error="Passwords do not match."
        token="reset-token"
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Passwords do not match.");
  });
});
