import { describe, expect, test } from "bun:test";
import { Accordion } from "./Accordion";

const render = (node: unknown): string => String(node);

describe("Accordion", () => {
  test("renders native grouped details items", () => {
    const html = render(
      <Accordion
        name="spells"
        items={[
          {
            body: <p>Spell details</p>,
            controls: <button type="button">Cast</button>,
            id: "spell-card",
            meta: "Prepared",
            title: "Shield",
          },
        ]}
      />,
    );

    expect(html).toContain('<div class="accordion">');
    expect(html).toContain('<details class="accordion-item" name="spells">');
    expect(html).toContain("<strong>Shield</strong>");
    expect(html).toContain("<small>Prepared</small>");
    expect(html).toContain('<div class="accordion-body" id="spell-card">');
    expect(html).toContain("<button type=\"button\">Cast</button>");
  });
});
