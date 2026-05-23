import { describe, expect, test } from "bun:test";
import { LabelledOutput } from "./LabelledOutput";

const render = (node: unknown): string => String(node);

describe("LabelledOutput", () => {
  test("renders a labelled value", () => {
    const html = render(<LabelledOutput label="Armour class" value="17" />);

    expect(html).toContain('<div class="labelled-output">');
    expect(html).toContain('<output class="labelled-output-label">Armour class</output>');
    expect(html).toContain('<output class="labelled-output-value">17</output>');
  });
});
