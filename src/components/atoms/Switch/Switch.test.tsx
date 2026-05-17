import { describe, expect, test } from "bun:test";
import { Switch } from "./Switch";

const render = (node: unknown): string => String(node);

describe("Switch", () => {
  test("renders a checkbox-backed theme toggle", () => {
    const html = render(<Switch id="theme-toggle" label="Colour mode" dataThemeToggle />);

    expect(html).toContain('<label class="switch" data-variant="theme" for="theme-toggle">');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Colour mode"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('data-theme-toggle=""');
    expect(html).toContain("☀");
    expect(html).toContain("◐");
  });

  test("renders checked state for dark mode", () => {
    const html = render(<Switch id="theme-toggle" label="Colour mode" checked dataThemeToggle />);

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('checked=""');
  });

  test("renders custom icons, variant, and HTMX attributes", () => {
    const html = render(
      <Switch
        id="inspiration-toggle"
        label="Inspiration"
        offIcon="radio_button_unchecked"
        onIcon="auto_awesome"
        variant="inspiration"
        trackGradient="linear-gradient(110deg, #0f766e, #f59e0b)"
        hxPatch="/sheet/character/resources/inspiration"
        hxTarget="#sheet-header"
        hxSwap="outerHTML"
        hxTrigger="change delay:250ms"
        hxVals="js:{current: event.target.checked ? 1 : 0}"
      />,
    );

    expect(html).toContain('data-variant="inspiration"');
    expect(html).toContain("○");
    expect(html).toContain("✦");
    expect(html).toContain("--switch-track-gradient: linear-gradient(110deg, #0f766e, #f59e0b);");
    expect(html).toContain('hx-patch="/sheet/character/resources/inspiration"');
    expect(html).toContain('hx-target="#sheet-header"');
    expect(html).toContain('hx-trigger="change delay:250ms"');
    expect(html).toContain('hx-vals="js:{current: event.target.checked ? 1 : 0}"');
  });
});
