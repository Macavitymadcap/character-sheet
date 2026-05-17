import { describe, expect, test } from "bun:test";
import { PopoverMenu } from "./PopoverMenu";

const render = (node: unknown): string => String(node);

describe("PopoverMenu", () => {
  test("renders a native popover menu anchored to its trigger", () => {
    const html = render(
      <PopoverMenu
        id="site-menu"
        label="Open navigation menu"
        items={[
          { href: "/", label: "Home" },
          { current: true, href: "/sheet/lynott", label: "Sheet" },
          { action: "/logout", href: "/logout", label: "Sign out", method: "post" },
        ]}
      />,
    );

    expect(html).toContain('style="--popover-anchor-name: --site-menu-anchor;"');
    expect(html).toContain('popovertarget="site-menu-panel"');
    expect(html).toContain('popover="auto"');
    expect(html).toContain('role="menu"');
    expect(html).toContain('<a class="popover-menu-item" href="/" role="menuitem">Home</a>');
    expect(html).toContain(
      '<a class="popover-menu-item" href="/sheet/lynott" role="menuitem" aria-current="page">Sheet</a>',
    );
    expect(html).toContain(
      '<form class="popover-menu-form" action="/logout" method="post" role="none">',
    );
    expect(html).toContain(
      '<button class="popover-menu-item" type="submit" role="menuitem">Sign out</button>',
    );
  });
});
