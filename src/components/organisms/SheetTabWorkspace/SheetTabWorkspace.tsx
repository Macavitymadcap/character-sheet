import type { CharacterResource, CharacterSheetReadModel } from "../../../db";
import { SheetTabPanel } from "../SheetTabPanel";
import { SheetTabs, type SheetTabId } from "../SheetTabs";

interface SheetTabWorkspaceProps {
  activeTab: SheetTabId;
  resources: CharacterResource[];
  sheet: CharacterSheetReadModel;
}

export const SheetTabWorkspace = ({ activeTab, resources, sheet }: SheetTabWorkspaceProps) => (
  <div id="sheet-tab-workspace" class="sheet-tab-workspace">
    <SheetTabs activeTab={activeTab} characterId={sheet.id} />
    <SheetTabPanel resources={resources} sheet={sheet} tabId={activeTab} />
  </div>
);
