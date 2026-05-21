import { describe, expect, test } from "bun:test";
import { LocalPlayPage } from "./LocalPlay";

const render = (node: unknown): string => String(node);

describe("LocalPlayPage", () => {
  test("renders the public local character placeholder", () => {
    const html = render(<LocalPlayPage appName="Campaign Ledger" kind="characters" />);

    expect(html).toContain("<title>Local characters - Campaign Ledger</title>");
    expect(html).toContain('<h1 id="local-play-heading" class="panel-heading">Local characters</h1>');
    expect(html).toContain("Browser-local character tracking");
    expect(html).toContain('<a class="action-link" href="/rules">Browse SRD rules</a>');
    expect(html).toContain('<a class="action-link action-link-secondary" href="/login">Sign in</a>');
  });

  test("renders the public local campaign placeholder", () => {
    const html = render(<LocalPlayPage appName="Campaign Ledger" kind="campaigns" />);

    expect(html).toContain("<title>Local campaigns - Campaign Ledger</title>");
    expect(html).toContain('<h1 id="local-play-heading" class="panel-heading">Local campaigns</h1>');
    expect(html).toContain("Browser-local campaign tracking");
  });
});
