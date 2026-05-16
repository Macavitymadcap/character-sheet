import { describe, expect, test } from "bun:test";
import { Button } from "./Button";

const render = (node: unknown): string => String(node);

describe("Button", () => {
  test("renders a primary button by default", () => {
    const html = render(<Button type="submit">Save</Button>);

    expect(html).toBe('<button class="button" data-variant="primary" type="submit">Save</button>');
  });

  test("renders alternate variants", () => {
    const html = render(<Button variant="ghost">Sign out</Button>);

    expect(html).toBe('<button class="button" data-variant="ghost" type="button">Sign out</button>');
  });
});
