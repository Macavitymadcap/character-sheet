import type {
  CharacterBackgroundEntry,
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
  backgroundEntries: CharacterBackgroundEntry[];
  equipment: CharacterEquipment[];
  header?: unknown;
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
}

export const SheetTabWorkspace = ({
  activeTab,
  backgroundEntries,
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
      backgroundEntries={backgroundEntries}
      equipment={equipment}
      notes={notes}
      resources={resources}
      ruleLinks={ruleLinks}
      sheet={sheet}
      tabId={activeTab}
    />
  </div>
);
