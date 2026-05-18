import type {
  AuthUser,
  CharacterBackgroundEntry,
  CharacterEquipment,
  CharacterFactionChoice,
  CharacterNote,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
  CampaignFaction,
} from "../../../db";
import { SiteHeader } from "../../molecules/SiteHeader";
import { SheetHeader } from "../../organisms/SheetHeader";
import { type SheetTabId } from "../../organisms/SheetTabs";
import { SheetTabWorkspace } from "../../organisms/SheetTabWorkspace";
import { Layout } from "../../templates/Layout";

interface SheetPageProps {
  activeTab: SheetTabId;
  appName: string;
  backgroundEntries: CharacterBackgroundEntry[];
  campaignFactions: CampaignFaction[];
  equipment: CharacterEquipment[];
  factionChoice: CharacterFactionChoice | null;
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const SheetPage = ({
  activeTab,
  appName,
  backgroundEntries,
  campaignFactions,
  equipment,
  factionChoice,
  notes,
  resources,
  ruleLinks,
  sheet,
  user,
}: SheetPageProps) => {
  return (
    <Layout title={`${sheet.name} - ${appName}`}>
      <div class="shell sheet-shell">
        <SiteHeader appName={appName} currentSection="sheet" user={user} />
        <main class="sheet-main" aria-labelledby="sheet-heading">
          <SheetTabWorkspace
            activeTab={activeTab}
            backgroundEntries={backgroundEntries}
            campaignFactions={campaignFactions}
            equipment={equipment}
            factionChoice={factionChoice}
            header={<SheetHeader resources={resources} sheet={sheet} />}
            notes={notes}
            resources={resources}
            ruleLinks={ruleLinks}
            sheet={sheet}
          />
        </main>
      </div>
    </Layout>
  );
};
