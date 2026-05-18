import type {
  CharacterBackgroundEntry,
  CharacterEquipment,
  CharacterFactionChoice,
  CharacterNote,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
  CampaignFaction,
} from "../../../db";
import { SheetTabPanel } from "../SheetTabPanel";
import { SheetTabs, type SheetTabId } from "../SheetTabs";

interface SheetTabWorkspaceProps {
  activeTab: SheetTabId;
  backgroundEntries: CharacterBackgroundEntry[];
  campaignFactions: CampaignFaction[];
  equipment: CharacterEquipment[];
  factionChoice: CharacterFactionChoice | null;
  header?: unknown;
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
}

export const SheetTabWorkspace = ({
  activeTab,
  backgroundEntries,
  campaignFactions,
  equipment,
  factionChoice,
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
      campaignFactions={campaignFactions}
      equipment={equipment}
      factionChoice={factionChoice}
      notes={notes}
      resources={resources}
      ruleLinks={ruleLinks}
      sheet={sheet}
      tabId={activeTab}
    />
  </div>
);
