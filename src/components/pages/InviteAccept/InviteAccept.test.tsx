import { describe, expect, test } from "bun:test";
import { InviteAcceptPage } from "./InviteAccept";

const render = (node: unknown): string => String(node);

describe("InviteAcceptPage", () => {
  test("renders safer password entry and confirmation", () => {
    const html = render(
      <InviteAcceptPage
        appName="Campaign Ledger"
        email="new.player@example.local"
        role="player"
        token="invite-token"
      />,
    );

    expect(html).toContain("Accept invite");
    expect(html).toContain("new.player@example.local");
    expect(html).toContain('action="/invites/invite-token"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="passwordConfirmation"');
    expect(html).toContain('aria-controls="invite-password"');
    expect(html).toContain('aria-controls="invite-password-confirmation"');
  });

  test("renders password confirmation errors", () => {
    const html = render(
      <InviteAcceptPage
        appName="Campaign Ledger"
        email="new.player@example.local"
        error="Passwords do not match."
        role="player"
        token="invite-token"
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Passwords do not match.");
  });
});
