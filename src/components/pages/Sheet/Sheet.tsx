import type {
  AuthUser,
  CharacterEquipment,
  CharacterNote,
  CharacterResource,
  CharacterRuleLink,
  CharacterSheetReadModel,
} from "../../../db";
import { SiteHeader } from "../../molecules/SiteHeader";
import { SheetHeader } from "../../organisms/SheetHeader";
import { type SheetTabId } from "../../organisms/SheetTabs";
import { SheetTabWorkspace } from "../../organisms/SheetTabWorkspace";
import { Layout } from "../../templates/Layout";

interface SheetPageProps {
  activeTab: SheetTabId;
  appName: string;
  equipment: CharacterEquipment[];
  notes: CharacterNote[];
  resources: CharacterResource[];
  ruleLinks: CharacterRuleLink[];
  sheet: CharacterSheetReadModel;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const SheetPage = ({
  activeTab,
  appName,
  equipment,
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
            equipment={equipment}
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
