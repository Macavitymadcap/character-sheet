import { describe, expect, test } from "bun:test";
import { Panel } from "./Panel";

const render = (node: unknown): string => String(node);

describe("Panel", () => {
  test("renders a labelled panel", () => {
    const html = render(
      <Panel labelledBy="heading" width="narrow">
        Body
      </Panel>,
    );

    expect(html).toBe('<section class="panel" data-width="narrow" aria-labelledby="heading">Body</section>');
  });
});
