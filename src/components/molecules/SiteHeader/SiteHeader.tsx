import type { AuthUser } from "../../../db";
import { PopoverMenu } from "../PopoverMenu";
import { Switch } from "../../atoms/Switch";

type SiteSection = "admin" | "campaign" | "characters" | "home" | "local" | "login" | "logout" | "rules" | "sheet";

interface SiteHeaderProps {
  appName: string;
  currentSection: SiteSection;
  user?: Pick<AuthUser, "displayName" | "role"> &
    Partial<Pick<AuthUser, "campaignRoles" | "capabilities">>;
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
            <span>{formatAccess(user)}</span>
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

  if (hasAdminAccess(user)) {
    links.push({ current: currentSection === "admin", href: "/admin", label: "Admin" });
  }

  if (hasCampaignRole(user, "game_master")) {
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

  if (hasCampaignRole(user, "player")) {
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

function formatAccess(user: NonNullable<SiteHeaderProps["user"]>) {
  const labels = [];
  if (hasAdminAccess(user)) labels.push("Admin");
  if (hasCampaignRole(user, "game_master")) labels.push("Game Master");
  if (hasCampaignRole(user, "player")) labels.push("Player");

  return labels[0] ? labels.join(" + ") : formatRole(user.role);
}

function formatRole(role: AuthUser["role"]) {
  if (role === "game_master") return "Game Master";
  if (role === "admin") return "Admin";

  return "Player";
}

function hasAdminAccess(user: NonNullable<SiteHeaderProps["user"]>) {
  return user.role === "admin" || (user.capabilities ?? []).includes("admin");
}

function hasCampaignRole(
  user: NonNullable<SiteHeaderProps["user"]>,
  role: "game_master" | "player",
) {
  return user.role === role || (user.campaignRoles ?? []).includes(role);
}
