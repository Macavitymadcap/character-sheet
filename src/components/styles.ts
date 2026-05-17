import { buttonStyles } from "./atoms/Button/Button.styles";
import { badgeStyles } from "./atoms/Badge/Badge.styles";
import { panelStyles } from "./atoms/Panel/Panel.styles";
import { switchStyles } from "./atoms/Switch/Switch.styles";
import { formFieldStyles } from "./molecules/FormField/FormField.styles";
import { labelledOutputStyles } from "./molecules/LabelledOutput/LabelledOutput.styles";
import { siteHeaderStyles } from "./molecules/SiteHeader/SiteHeader.styles";
import { coreTabStyles } from "./organisms/CoreTab/CoreTab.styles";
import { sheetHeaderStyles } from "./organisms/SheetHeader/SheetHeader.styles";
import { sheetTabPanelStyles } from "./organisms/SheetTabPanel/SheetTabPanel.styles";
import { sheetTabsStyles } from "./organisms/SheetTabs/SheetTabs.styles";
import { skillsTrainingTabStyles } from "./organisms/SkillsTrainingTab/SkillsTrainingTab.styles";
import { adminStyles } from "./pages/Admin/Admin.styles";
import { campaignStyles } from "./pages/Campaign/Campaign.styles";
import { homeStyles } from "./pages/Home/Home.styles";
import { loginStyles } from "./pages/Login/Login.styles";
import { sheetStyles } from "./pages/Sheet/Sheet.styles";
import { layoutStyles } from "./templates/Layout/Layout.styles";

export const appStyles = [
  layoutStyles,
  badgeStyles,
  buttonStyles,
  labelledOutputStyles,
  panelStyles,
  switchStyles,
  formFieldStyles,
  siteHeaderStyles,
  coreTabStyles,
  sheetHeaderStyles,
  sheetTabsStyles,
  sheetTabPanelStyles,
  skillsTrainingTabStyles,
  homeStyles,
  campaignStyles,
  loginStyles,
  adminStyles,
  sheetStyles,
].join("\n");
