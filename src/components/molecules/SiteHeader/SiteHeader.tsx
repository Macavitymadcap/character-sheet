import type { AuthUser } from "../../../db";
import { Button } from "../../atoms/Button";

type SiteSection = "admin" | "rules" | "sheet";

interface SiteHeaderProps {
  appName: string;
  currentSection: SiteSection;
  user?: Pick<AuthUser, "displayName" | "role">;
}

const navLinks: Array<{ href: string; label: string; section: SiteSection }> = [
  { href: "/sheet/character_lynott_magulbisson", label: "Sheet", section: "sheet" },
  { href: "/rules", label: "Rules", section: "rules" },
  { href: "/admin", label: "Admin", section: "admin" },
];

export const SiteHeader = ({ appName, currentSection, user }: SiteHeaderProps) => {
  return (
    <header id="site-header" class="site-header">
      <a class="site-brand" href="/">
        <span class="site-title">{appName}</span>
      </a>
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
      <div class="site-actions">
        {user ? (
          <>
            <p class="site-user">
              <span>{user.displayName}</span>
              <span>{formatRole(user.role)}</span>
            </p>
            <form action="/logout" method="post">
              <Button type="submit" variant="ghost">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <a class="site-login-link" href="/login">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
};

function formatRole(role: AuthUser["role"]) {
  if (role === "game_master") return "Game Master";
  if (role === "admin") return "Admin";

  return "Player";
}
