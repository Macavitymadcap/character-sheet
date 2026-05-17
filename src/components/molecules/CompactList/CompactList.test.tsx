import { describe, expect, test } from "bun:test";
import { CompactList } from "./CompactList";

const render = (node: unknown): string => String(node);

describe("CompactList", () => {
  test("renders compact labelled rows with optional metadata", () => {
    const html = render(
      <CompactList
        items={[
          { label: "Weapon", meta: "Equipped", value: "Pistol" },
          {
            controls: <button type="button">Spend</button>,
            label: "Slots",
            value: "3 / 3",
          },
        ]}
      />,
    );

    expect(html).toContain('<dl class="compact-list">');
    expect(html).toContain("<dt>Weapon</dt>");
    expect(html).toContain("<strong>Pistol</strong>");
    expect(html).toContain("<span>Equipped</span>");
    expect(html).toContain("<dt>Slots</dt>");
    expect(html).toContain("<strong>3 / 3</strong>");
    expect(html).toContain('<span class="compact-list-controls">');
    expect(html).toContain('<button type="button">Spend</button>');
  });
});
