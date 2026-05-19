import { sheetTabs, type SheetTabId } from "./SheetTabs.config";

interface SheetTabsProps {
  activeTab: SheetTabId;
  characterSlug: string;
}

export const SheetTabs = ({ activeTab, characterSlug }: SheetTabsProps) => {
  return (
    <nav id="sheet-tabs" class="sheet-tabs" aria-label="Sheet tabs" role="tablist">
      {sheetTabs.map((tab) => (
        <a
          id={`sheet-tab-${tab.id}`}
          aria-controls="sheet-tab-panel"
          aria-selected={tab.id === activeTab ? "true" : "false"}
          class="sheet-tab"
          data-tab-id={tab.id}
          data-state={tab.id === activeTab ? "active" : "idle"}
          href={`/sheet/${characterSlug}/${tab.id}`}
          hx-get={`/sheet/${characterSlug}/tabs/${tab.id}`}
          hx-push-url={`/sheet/${characterSlug}/${tab.id}`}
          hx-swap="outerHTML"
          hx-target="#sheet-tab-panel"
          role="tab"
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
};
