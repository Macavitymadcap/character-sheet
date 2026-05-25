import { buttonStyles } from "./atoms/Button/Button.styles";
import { badgeStyles } from "./atoms/Badge/Badge.styles";
import { iconStyles } from "./atoms/Icon/Icon.styles";
import { panelStyles } from "./atoms/Panel/Panel.styles";
import { switchStyles } from "./atoms/Switch/Switch.styles";
import { accordionStyles } from "./molecules/Accordion/Accordion.styles";
import { breadcrumbsStyles } from "./molecules/Breadcrumbs/Breadcrumbs.styles";
import { compactListStyles } from "./molecules/CompactList/CompactList.styles";
import { diceRollerStyles } from "./molecules/DiceRoller/DiceRoller.styles";
import { formFieldStyles } from "./molecules/FormField/FormField.styles";
import { labelledOutputStyles } from "./molecules/LabelledOutput/LabelledOutput.styles";
import { passwordFieldStyles } from "./molecules/PasswordField/PasswordField.styles";
import { popoverMenuStyles } from "./molecules/PopoverMenu/PopoverMenu.styles";
import { siteHeaderStyles } from "./molecules/SiteHeader/SiteHeader.styles";
import { coreTabStyles } from "./organisms/CoreTab/CoreTab.styles";
import { sheetHeaderStyles } from "./organisms/SheetHeader/SheetHeader.styles";
import { sheetTabPanelStyles } from "./organisms/SheetTabPanel/SheetTabPanel.styles";
import { sheetTabsStyles } from "./organisms/SheetTabs/SheetTabs.styles";
import { skillsTrainingTabStyles } from "./organisms/SkillsTrainingTab/SkillsTrainingTab.styles";
import { adminStyles } from "./pages/Admin/Admin.styles";
import { campaignStyles } from "./pages/Campaign/Campaign.styles";
import { charactersStyles } from "./pages/Characters/Characters.styles";
import { homeStyles } from "./pages/Home/Home.styles";
import { loginStyles } from "./pages/Login/Login.styles";
import { localPlayStyles } from "./pages/LocalPlay/LocalPlay.styles";
import { rulesStyles } from "./pages/Rules/Rules.styles";
import { sheetStyles } from "./pages/Sheet/Sheet.styles";
import { layoutStyles } from "./templates/Layout/Layout.styles";

export const appStyles = [
  layoutStyles,
  accordionStyles,
  badgeStyles,
  breadcrumbsStyles,
  buttonStyles,
  compactListStyles,
  diceRollerStyles,
  iconStyles,
  labelledOutputStyles,
  passwordFieldStyles,
  popoverMenuStyles,
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
  charactersStyles,
  loginStyles,
  localPlayStyles,
  rulesStyles,
  adminStyles,
  sheetStyles,
].join("\n");
