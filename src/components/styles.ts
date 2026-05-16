import { buttonStyles } from "./atoms/Button/Button.styles";
import { badgeStyles } from "./atoms/Badge/Badge.styles";
import { labelledOutputStyles } from "./atoms/LabelledOutput/LabelledOutput.styles";
import { panelStyles } from "./atoms/Panel/Panel.styles";
import { formFieldStyles } from "./molecules/FormField/FormField.styles";
import { adminStyles } from "./pages/Admin/Admin.styles";
import { homeStyles } from "./pages/Home/Home.styles";
import { loginStyles } from "./pages/Login/Login.styles";
import { layoutStyles } from "./templates/Layout/Layout.styles";

export const appStyles = [
  layoutStyles,
  badgeStyles,
  buttonStyles,
  labelledOutputStyles,
  panelStyles,
  formFieldStyles,
  homeStyles,
  loginStyles,
  adminStyles,
].join("\n");
