import { describe, expect, test } from "bun:test";
import { AdminPage } from "./Admin";

const render = (node: unknown): string => String(node);

describe("AdminPage", () => {
  test("renders local admin workflows", () => {
    const html = render(
      <AdminPage appName="Character Sheet" user={{ displayName: "Site Admin", role: "admin" }} />,
    );

    expect(html).toContain("<title>Character Sheet</title>");
    expect(html).toContain("Admin");
    expect(html).toContain("Site Admin");
    expect(html).toContain('action="/admin/invites"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="role"');
  });
});
