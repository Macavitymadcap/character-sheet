import { badgeStyles } from "./atoms/Badge/Badge.styles";
import { homeStyles } from "./pages/Home/Home.styles";
import { layoutStyles } from "./templates/Layout/Layout.styles";

export const appStyles = [layoutStyles, badgeStyles, homeStyles].join("\n");
