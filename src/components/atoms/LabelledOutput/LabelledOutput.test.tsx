import { describe, expect, test } from "bun:test";
import { LabelledOutput } from "./LabelledOutput";

const render = (node: unknown): string => String(node);

describe("LabelledOutput", () => {
  test("renders a labelled value", () => {
    const html = render(<LabelledOutput label="Armour class" value="17" />);

    expect(html).toContain('<div class="labelled-output">');
    expect(html).toContain('<span class="labelled-output-label">Armour class</span>');
    expect(html).toContain('<strong class="labelled-output-value">17</strong>');
  });
});
