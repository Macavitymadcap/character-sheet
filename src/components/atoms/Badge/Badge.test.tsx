import { describe, expect, test } from "bun:test";
import { Badge } from "./Badge";

const render = (node: unknown): string => String(node);

describe("Badge", () => {
  test("renders children with the neutral tone by default", () => {
    const html = render(<Badge>Ready</Badge>);

    expect(html).toBe('<span class="badge" data-tone="neutral">Ready</span>');
  });

  test("renders the selected tone for state styling", () => {
    const html = render(<Badge tone="accent">Local SQLite</Badge>);

    expect(html).toBe('<span class="badge" data-tone="accent">Local SQLite</span>');
  });
});
