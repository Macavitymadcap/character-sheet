import { describe, expect, test } from "bun:test";
import { Layout } from "./Layout";

const render = (node: unknown): string => String(node);

describe("Layout", () => {
  test("renders document shell semantics and shared assets", () => {
    const html = render(
      <Layout title="Test Sheet">
        <main>Body</main>
      </Layout>,
    );

    expect(html).toContain('<html lang="en-GB">');
    expect(html).toContain('<meta charset="UTF-8"/>');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0"/>');
    expect(html).toContain("<title>Test Sheet</title>");
    expect(html).toContain("character-sheet-theme");
    expect(html).toContain('document.querySelector("[data-theme-toggle]")');
    expect(html).toContain("htmx:afterSettle");
    expect(html).not.toContain("Material+Symbols+Outlined");
    expect(html).toContain("https://unpkg.com/htmx.org");
    expect(html).toContain("<style>");
    expect(html).toContain(':root[data-theme="dark"]');
    expect(html).toContain("--background-colour");
    expect(html).toContain("--surface-colour");
    expect(html).toContain("<main>Body</main>");
  });
});
