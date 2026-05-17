import type { AuthUser } from "../../../db";
import { Switch } from "../../atoms/Switch";

type SiteSection = "admin" | "campaign" | "home" | "login" | "logout" | "sheet";

interface SiteHeaderProps {
  appName: string;
  currentSection: SiteSection;
  user?: Pick<AuthUser, "displayName" | "role">;
}

export const SiteHeader = ({ appName, currentSection, user }: SiteHeaderProps) => {
  const navLinks = getNavLinks(user);

  return (
    <header id="site-header" class="site-header">
      <a class="site-brand" href="/">
        <span class="site-title">{appName}</span>
      </a>
      {navLinks.length > 0 ? (
        <nav class="site-nav" aria-label="Primary">
          {navLinks.map((link) =>
            link.section === currentSection ? (
              <a href={link.href} aria-current="page">
                {link.label}
              </a>
            ) : (
              <a href={link.href}>{link.label}</a>
            ),
          )}
        </nav>
      ) : null}
      <div class="site-actions">
        <Switch id="theme-toggle" label="Colour mode" dataThemeToggle />
        {user ? (
          <>
            <p class="site-user">
              <span>{user.displayName}</span>
              <span>{formatRole(user.role)}</span>
            </p>
            <a
              class="site-auth-link"
              href="/logout"
              aria-current={currentSection === "logout" ? "page" : undefined}
            >
              Sign out
            </a>
          </>
        ) : (
          <a
            class="site-auth-link"
            href="/login"
            aria-current={currentSection === "login" ? "page" : undefined}
          >
            Sign in
          </a>
        )}
      </div>
    </header>
  );
};

function getNavLinks(
  user: SiteHeaderProps["user"],
): Array<{ href: string; label: string; section: SiteSection }> {
  if (!user) return [];
  if (user.role === "admin") return [{ href: "/admin", label: "Admin", section: "admin" }];
  if (user.role === "game_master") {
    return [{ href: "/campaigns/rovnost-shadows", label: "Campaign", section: "campaign" }];
  }

  return [{ href: "/sheet/character_lynott_magulbisson", label: "Sheet", section: "sheet" }];
}

function formatRole(role: AuthUser["role"]) {
  if (role === "game_master") return "Game Master";
  if (role === "admin") return "Admin";

  return "Player";
}
