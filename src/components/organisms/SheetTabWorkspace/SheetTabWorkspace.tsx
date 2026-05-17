import type { CharacterResource, CharacterSheetReadModel } from "../../../db";
import { SheetTabPanel } from "../SheetTabPanel";
import { SheetTabs, type SheetTabId } from "../SheetTabs";

interface SheetTabWorkspaceProps {
  activeTab: SheetTabId;
  header?: unknown;
  resources: CharacterResource[];
  sheet: CharacterSheetReadModel;
}

export const SheetTabWorkspace = ({ activeTab, header, resources, sheet }: SheetTabWorkspaceProps) => (
  <div id="sheet-tab-workspace" class="sheet-tab-workspace">
    <div class="sheet-sticky-stack">
      {header}
      <SheetTabs activeTab={activeTab} characterId={sheet.id} />
    </div>
    <SheetTabPanel resources={resources} sheet={sheet} tabId={activeTab} />
  </div>
);
