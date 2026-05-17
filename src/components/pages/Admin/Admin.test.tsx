import { describe, expect, test } from "bun:test";
import { AdminPage } from "./Admin";

const render = (node: unknown): string => String(node);

describe("AdminPage", () => {
  test("renders local admin workflows", () => {
    const html = render(
      <AdminPage appName="Character Sheet" user={{ displayName: "Site Admin", role: "admin" }} />,
    );

    expect(html).toContain("<title>Character Sheet</title>");
    expect(html).toContain('<header id="site-header" class="site-header">');
    expect(html).toContain('<a href="/admin" aria-current="page">Admin</a>');
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
  });
});
