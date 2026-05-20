import { describe, expect, test } from "bun:test";
import { SheetTabs } from "./SheetTabs";
import { isSheetTabId, sheetTabs } from "./SheetTabs.config";
import { sheetTabsStyles } from "./SheetTabs.styles";

const render = (node: unknown): string => String(node);

describe("SheetTabs", () => {
  test("renders accessible HTMX tab links", () => {
    const html = render(<SheetTabs activeTab="core" characterSlug="lynott" />);

    expect(html).toContain('<nav id="sheet-tabs" class="sheet-tabs" aria-label="Sheet tabs" role="tablist">');
    expect(html).toContain('id="sheet-tab-core"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('data-tab-id="core"');
    expect(html).toContain('href="/sheet/lynott/core"');
    expect(html).toContain('hx-get="/sheet/lynott/tabs/core"');
    expect(html).toContain('hx-push-url="/sheet/lynott/core"');
    expect(html).toContain('hx-target="#sheet-tab-panel"');
    expect(html).toContain(">Spellcasting</a>");
    expect(html).toContain(">Notes</a>");
  });

  test("exposes the complete MVP tab set and validates tab ids", () => {
    expect(sheetTabs.map((tab) => tab.id)).toEqual([
      "core",
      "skills",
      "actions",
      "spellcasting",
      "features",
      "equipment",
      "background",
      "notes",
    ]);
    expect(isSheetTabId("core")).toBeTrue();
    expect(isSheetTabId("unknown")).toBeFalse();
  });

  test("keeps every tab button compact in the scrollable strip", () => {
    expect(sheetTabsStyles).toContain("align-items: start;");
    expect(sheetTabsStyles).toContain("display: flex;");
    expect(sheetTabsStyles).toContain("flex: 0 0 auto;");
    expect(sheetTabsStyles).toContain("grid-auto-rows: max-content;");
    expect(sheetTabsStyles).toContain("inline-size: max-content;");
    expect(sheetTabsStyles).toContain("justify-content: flex-start;");
    expect(sheetTabsStyles).toContain("overflow-x: auto;");
    expect(sheetTabsStyles).toContain("scroll-padding-inline: 0.75rem;");
    expect(sheetTabsStyles).toContain("scroll-margin-inline: 0.75rem;");
    expect(sheetTabsStyles).toContain("scroll-snap-align: start;");
    expect(sheetTabsStyles).toContain("scroll-snap-type: x proximity;");
    expect(sheetTabsStyles).toContain(".sheet-tabs::after");
    expect(sheetTabsStyles).toContain("flex: 0 0 3rem;");
    expect(sheetTabsStyles).toContain(".sheet-tab:hover");
    expect(sheetTabsStyles).not.toContain("justify-content: space-between;");
    expect(sheetTabsStyles).not.toContain("repeat(8");
    expect(sheetTabsStyles).not.toContain("grid-template-columns");
  });
});
