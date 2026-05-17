import { describe, expect, test } from "bun:test";
import { SheetTabs } from "./SheetTabs";
import { isSheetTabId, sheetTabs } from "./SheetTabs.config";

const render = (node: unknown): string => String(node);

describe("SheetTabs", () => {
  test("renders accessible HTMX tab links", () => {
    const html = render(<SheetTabs activeTab="core" characterSlug="lynott" />);

    expect(html).toContain('<nav id="sheet-tabs" class="sheet-tabs" aria-label="Sheet tabs" role="tablist">');
    expect(html).toContain('id="sheet-tab-core"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('data-tab-id="core"');
    expect(html).toContain('hx-get="/sheet/lynott/tabs/core"');
    expect(html).toContain('hx-target="#sheet-tab-panel"');
    expect(html).not.toContain('hx-push-url');
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
});
