import { describe, expect, test } from "bun:test";
import { LocalPlayPage } from "./LocalPlay";

const render = (node: unknown): string => String(node);

describe("LocalPlayPage", () => {
  test("renders the public local character placeholder", () => {
    const html = render(<LocalPlayPage appName="Campaign Ledger" kind="characters" />);

    expect(html).toContain("<title>Local characters - Campaign Ledger</title>");
    expect(html).toContain('<h1 id="local-play-heading" class="panel-heading">Local characters</h1>');
    expect(html).toContain("Track a quick character on this device");
    expect(html).toContain("This data lives in your browser storage only.");
    expect(html).toContain("data-local-play-edit");
    expect(html).toContain("data-local-play-delete");
    expect(html).toContain('data-local-play-export');
    expect(html).toContain('data-local-play-import-trigger');
    expect(html).toContain('type="file" accept="application/json,.json"');
    expect(html).toContain('aria-label="Import local play JSON"');
    expect(html).toContain('class="local-play-form" data-local-play-form');
    expect(html).toContain('name="className" required');
    expect(html).toContain('name="level" required');
    expect(html).toContain('type="number" min="1" max="20" value="1"');
    expect(html).toContain("No local characters yet.");
    expect(html).toContain('<a class="action-link" href="/rules">Browse SRD rules</a>');
    expect(html).toContain('<a class="action-link action-link-secondary" href="/login">Sign in</a>');
    expect(html).toContain("campaign-ledger.local-play.v1");
  });

  test("renders the public local campaign placeholder", () => {
    const html = render(<LocalPlayPage appName="Campaign Ledger" kind="campaigns" />);

    expect(html).toContain("<title>Local campaigns - Campaign Ledger</title>");
    expect(html).toContain('<h1 id="local-play-heading" class="panel-heading">Local campaigns</h1>');
    expect(html).toContain("Track a quick campaign record on this device");
    expect(html).toContain('name="currentScene"');
    expect(html).toContain("No local campaigns yet.");
    expect(html).toContain('<a class="action-link action-link-secondary" href="/local/characters">');
  });
});
