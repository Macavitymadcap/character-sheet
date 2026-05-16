import { badgeStyles } from "./atoms/Badge/Badge.styles";
import { adminStyles } from "./pages/Admin/Admin.styles";
import { homeStyles } from "./pages/Home/Home.styles";
import { loginStyles } from "./pages/Login/Login.styles";
import { layoutStyles } from "./templates/Layout/Layout.styles";

export const appStyles = [layoutStyles, badgeStyles, homeStyles, loginStyles, adminStyles].join("\n");
