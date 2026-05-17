import { describe, expect, test } from "bun:test";
import { Icon } from "./Icon";

const render = (node: unknown): string => String(node);

describe("Icon", () => {
  test("renders a decorative SVG icon", () => {
    const html = render(<Icon name="check_circle" />);

    expect(html).toContain('class="icon icon-neutral"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-icon="check-circle"');
    expect(html).toContain("<svg");
    expect(html).toContain("stroke-linecap=\"round\"");
  });

  test("renders an accessible icon label", () => {
    const html = render(<Icon name="radio_button_unchecked" label="Untrained" tone="muted" />);

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Untrained"');
    expect(html).toContain('class="icon icon-muted"');
    expect(html).toContain('data-icon="circle"');
    expect(html).toContain("<circle");
  });
});
