import type { AuthUser } from "../../../db";
import { PopoverMenu } from "../PopoverMenu";
import { Switch } from "../../atoms/Switch";

type SiteSection = "admin" | "campaign" | "characters" | "home" | "local" | "login" | "logout" | "rules" | "sheet";

interface SiteHeaderProps {
  appName: string;
  currentSection: SiteSection;
  user?: Pick<AuthUser, "displayName" | "role">;
}

export const SiteHeader = ({ appName, currentSection, user }: SiteHeaderProps) => {
  const menuLinks = getMenuLinks(user, currentSection);

  return (
    <header id="site-header" class="site-header">
      <a class="site-brand" href="/">
        <span class="site-title">{appName}</span>
      </a>
      <div class="site-actions">
        <Switch id="theme-toggle" label="Colour mode" dataThemeToggle />
        {user ? (
          <p class="site-user">
            <span>{user.displayName}</span>
            <span>{formatRole(user.role)}</span>
          </p>
        ) : (
          <span class="site-user">Visitor</span>
        )}
        <PopoverMenu id="site-menu" label="Open navigation menu" items={menuLinks} />
      </div>
    </header>
  );
};

function getMenuLinks(user: SiteHeaderProps["user"], currentSection: SiteSection) {
  const links: Array<{
    action?: string;
    current?: boolean;
    href: string;
    label: string;
    method?: "get" | "post";
  }> = [
    { current: currentSection === "home", href: "/", label: "Home" },
  ];

  if (!user) {
    links.push({ current: currentSection === "rules", href: "/rules", label: "Rules" });
    links.push({ current: currentSection === "login", href: "/login", label: "Sign in" });

    return links;
  }

  if (user.role === "admin") {
    links.push({ current: currentSection === "admin", href: "/admin", label: "Admin" });
  }

  if (user.role === "game_master") {
    links.push({
      current: currentSection === "campaign",
      href: "/campaigns/rovnost-shadows",
      label: "Campaign",
    });
    links.push({
      current: currentSection === "characters",
      href: "/campaigns/rovnost-shadows/characters",
      label: "Characters",
    });
  }

  if (user.role === "player") {
    links.push({ current: currentSection === "characters", href: "/characters", label: "Characters" });
  }

  links.push({ current: currentSection === "rules", href: "/rules", label: "Rules" });

  links.push({
    action: "/logout",
    current: currentSection === "logout",
    href: "/logout",
    label: "Sign out",
    method: "post",
  });

  return links;
}

function formatRole(role: AuthUser["role"]) {
  if (role === "game_master") return "Game Master";
  if (role === "admin") return "Admin";

  return "Player";
}
