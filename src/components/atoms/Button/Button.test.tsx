import { describe, expect, test } from "bun:test";
import { Button } from "./Button";

const render = (node: unknown): string => String(node);

describe("Button", () => {
  test("renders a primary button by default", () => {
    const html = render(<Button type="submit">Save</Button>);

    expect(html).toBe(
      '<button class="button" type="submit" data-size="default" data-variant="primary">Save</button>',
    );
  });

  test("renders alternate variants", () => {
    const html = render(<Button variant="ghost">Sign out</Button>);

    expect(html).toBe(
      '<button class="button" type="button" data-size="default" data-variant="ghost">Sign out</button>',
    );
  });

  test("passes HTMX attributes through the Hyper-Dank primitive", () => {
    const html = render(<Button hx-post="/characters" hx-target="#character-roster">Create</Button>);

    expect(html).toContain('hx-post="/characters"');
    expect(html).toContain('hx-target="#character-roster"');
  });
});
