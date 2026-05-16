import type { AuthUser, CharacterResource, CharacterSheetReadModel } from "../../../db";
import { SiteHeader } from "../../molecules/SiteHeader";
import { SheetHeader } from "../../organisms/SheetHeader";
import { SheetTabPanel } from "../../organisms/SheetTabPanel";
import { SheetTabs, type SheetTabId } from "../../organisms/SheetTabs";
import { Layout } from "../../templates/Layout";

interface SheetPageProps {
  activeTab: SheetTabId;
  appName: string;
  resources: CharacterResource[];
  sheet: CharacterSheetReadModel;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const SheetPage = ({ activeTab, appName, resources, sheet, user }: SheetPageProps) => {
  return (
    <Layout title={`${sheet.name} - ${appName}`}>
      <div class="shell sheet-shell">
        <SiteHeader appName={appName} currentSection="sheet" user={user} />
        <main class="sheet-main" aria-labelledby="sheet-heading">
          <SheetHeader resources={resources} sheet={sheet} />
          <SheetTabs activeTab={activeTab} characterId={sheet.id} />
          <SheetTabPanel resources={resources} sheet={sheet} tabId={activeTab} />
        </main>
      </div>
    </Layout>
  );
};
