import { describe, expect, test } from "bun:test";
import { Switch } from "./Switch";

const render = (node: unknown): string => String(node);

describe("Switch", () => {
  test("renders a checkbox-backed theme toggle", () => {
    const html = render(<Switch id="theme-toggle" label="Colour mode" dataThemeToggle />);

    expect(html).toContain('<label class="switch" for="theme-toggle">');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Colour mode"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('data-theme-toggle=""');
    expect(html).toContain("light_mode");
    expect(html).toContain("dark_mode");
  });

  test("renders checked state for dark mode", () => {
    const html = render(<Switch id="theme-toggle" label="Colour mode" checked dataThemeToggle />);

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('checked=""');
  });
});
