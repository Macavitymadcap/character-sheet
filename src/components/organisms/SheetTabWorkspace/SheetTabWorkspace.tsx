import type {
  CharacterEquipment,
  CharacterNote,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
} from "../../../db";
import { SheetTabPanel } from "../SheetTabPanel";
import { SheetTabs, type SheetTabId } from "../SheetTabs";

interface SheetTabWorkspaceProps {
  activeTab: SheetTabId;
  equipment: CharacterEquipment[];
  header?: unknown;
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
}

export const SheetTabWorkspace = ({
  activeTab,
  equipment,
  header,
  notes,
  resources,
  ruleLinks,
  sheet,
}: SheetTabWorkspaceProps) => (
  <div id="sheet-tab-workspace" class="sheet-tab-workspace">
    <div class="sheet-sticky-stack">
      {header}
      <SheetTabs activeTab={activeTab} characterSlug={sheet.slug} />
    </div>
    <SheetTabPanel
      equipment={equipment}
      notes={notes}
      resources={resources}
      ruleLinks={ruleLinks}
      sheet={sheet}
      tabId={activeTab}
    />
  </div>
);
