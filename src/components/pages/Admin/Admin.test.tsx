import { describe, expect, test } from "bun:test";
import { AdminPage } from "./Admin";
import { adminStyles } from "./Admin.styles";

const render = (node: unknown): string => String(node);

describe("AdminPage", () => {
  test("renders local admin workflows", () => {
    const html = render(
      <AdminPage
        appName="Campaign Ledger"
        invites={[]}
        resetTokens={[]}
        users={[
          {
            campaignCount: 1,
            characterCount: 2,
            displayName: "Site Admin",
            email: "admin@example.local",
            id: "user_site_admin",
            role: "admin",
            status: "active",
          },
        ]}
        user={{ displayName: "Site Admin", role: "admin" }}
      />,
    );

    expect(html).toContain("<title>Campaign Ledger</title>");
    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain(
      '<a class="popover-menu-item" href="/admin" role="menuitem" aria-current="page">Admin</a>',
    );
    expect(html).toContain("Admin");
    expect(html).toContain("Site Admin");
    expect(html).toContain('<section class="panel" data-width="default" aria-labelledby="admin-heading">');
    expect(html).toContain('<form class="form-stack" action="/admin/invites" method="post">');
    expect(html).toContain('action="/admin/invites"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="role"');
    expect(html).toContain(
      '<button class="button" data-variant="primary" type="submit">Create invite</button>',
    );
    expect(html).toContain("Users");
    expect(html).toContain('<table class="sheet-table admin-users-table">');
    expect(html).toContain("Invites");
    expect(html).toContain('<table class="sheet-table admin-invites-table">');
    expect(html).toContain("Password reset tokens");
    expect(html).toContain('<table class="sheet-table admin-reset-tokens-table">');
  });

  test("keeps admin tables compressed and scrollable on mobile", () => {
    expect(adminStyles).toContain(".admin-users-table {\n  min-width: 44rem;");
    expect(adminStyles).toContain("@media (max-width: 760px)");
    expect(adminStyles).toContain(".admin-users-table {\n    min-width: 46rem;");
    expect(adminStyles).toContain("white-space: nowrap;");
  });
});
