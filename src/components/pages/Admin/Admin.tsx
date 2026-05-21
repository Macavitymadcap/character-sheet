import type { AuthUser } from "../../../db";
import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { FormField } from "../../molecules/FormField";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface AdminUserRow {
  campaignCount: number;
  characterCount: number;
  displayName: string;
  email: string;
  id: string;
  role: AuthUser["role"];
  status: AuthUser["status"];
}

interface AdminInviteRow {
  acceptedAt: Date | null;
  email: string;
  expiresAt: Date;
  id: string;
  role: AuthUser["role"];
}

interface AdminResetTokenRow {
  expiresAt: Date;
  id: string;
  usedAt: Date | null;
  userId: string;
}

type AdminTokenHandoff =
  | {
      email: string;
      expiresAt: Date;
      role: AuthUser["role"];
      type: "invite";
      url: string;
    }
  | {
      expiresAt: Date;
      type: "password_reset";
      url: string;
      userDisplayName: string;
    };

interface AdminPageProps {
  appName: string;
  handoff?: AdminTokenHandoff;
  invites: AdminInviteRow[];
  resetTokens: AdminResetTokenRow[];
  users: AdminUserRow[];
  user: Pick<AuthUser, "displayName" | "role">;
}

const formatDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "—");

export const AdminPage = ({ appName, handoff, invites, resetTokens, users, user }: AdminPageProps) => {
  const userLabels = new Map(users.map((row) => [row.id, `${row.displayName} (${row.email})`]));

  return (
    <Layout title={appName}>
      <div class="shell admin-page-shell">
        <SiteHeader appName={appName} currentSection="admin" user={user} />
        <main class="admin-shell">
          <Panel labelledBy="admin-heading">
            <h1 id="admin-heading" class="panel-heading">
              Admin
            </h1>
            <p class="admin-copy">Create links here and send them manually. Campaign Ledger does not send email.</p>

            {handoff ? (
              <section class="admin-handoff" aria-labelledby="handoff-heading">
                <div>
                  <p class="admin-kicker">
                    {handoff.type === "invite" ? "Invite ready" : "Password reset ready"}
                  </p>
                  <h2 id="handoff-heading">
                    {handoff.type === "invite" ? "Invite link" : "Password reset link"}
                  </h2>
                  <p>
                    {handoff.type === "invite"
                      ? `${handoff.email} (${handoff.role.replace("_", " ")})`
                      : handoff.userDisplayName}
                  </p>
                  <p>
                    Expires {formatDate(handoff.expiresAt)}. Copy the full URL and send it through
                    your table's usual channel.
                  </p>
                </div>
                <div class="admin-copy-url">
                  <input
                    id="admin-handoff-url"
                    readonly
                    value={handoff.url}
                    aria-label="Generated handoff URL"
                  />
                  <button
                    class="button"
                    data-variant="ghost"
                    type="button"
                    aria-controls="admin-handoff-url"
                    data-copy-value={handoff.url}
                  >
                    Copy URL
                  </button>
                </div>
              </section>
            ) : null}

            <section aria-labelledby="invite-heading">
              <h2 id="invite-heading">Create invite</h2>
              <form class="form-stack" action="/admin/invites" method="post">
                <FormField id="invite-email" label="Email" name="email" required type="email" />
                <FormField id="invite-role" label="Role">
                  <select id="invite-role" name="role">
                    <option value="player">Player</option>
                    <option value="game_master">Game Master</option>
                    <option value="admin">Admin</option>
                  </select>
                </FormField>
                <Button type="submit">Create invite</Button>
              </form>
            </section>

            <section aria-labelledby="users-heading">
              <h2 id="users-heading">Users</h2>
              <div class="table-scroll">
                <table class="sheet-table admin-users-table">
                  <thead>
                    <tr>
                      <th scope="col">Display name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Campaigns</th>
                      <th scope="col">Characters</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((row) => (
                      <tr>
                        <td>{row.displayName}</td>
                        <td>{row.email}</td>
                        <td>{row.role.replace("_", " ")}</td>
                        <td>{row.status}</td>
                        <td>{row.campaignCount}</td>
                        <td>{row.characterCount}</td>
                        <td>
                          <form class="admin-inline-form" action={`/admin/users/${row.id}/status`} method="post">
                            <input
                              type="hidden"
                              name="status"
                              value={row.status === "active" ? "disabled" : "active"}
                            />
                            <Button type="submit" variant="ghost">
                              {row.status === "active" ? "Disable" : "Reactivate"}
                            </Button>
                          </form>
                          <form
                            class="admin-inline-form"
                            action={`/admin/users/${row.id}/password-reset`}
                            method="post"
                          >
                            <Button type="submit" variant="ghost">
                              Create reset token
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="invites-heading">
              <h2 id="invites-heading">Invites</h2>
              <div class="table-scroll">
                <table class="sheet-table admin-invites-table">
                  <thead>
                    <tr>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Expires</th>
                      <th scope="col">Accepted</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => (
                      <tr>
                        <td>{invite.email}</td>
                        <td>{invite.role.replace("_", " ")}</td>
                        <td>{formatDate(invite.expiresAt)}</td>
                        <td>{formatDate(invite.acceptedAt)}</td>
                        <td>{invite.acceptedAt ? "Accepted" : "Waiting"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="reset-tokens-heading">
              <h2 id="reset-tokens-heading">Password reset tokens</h2>
              <div class="table-scroll">
                <table class="sheet-table admin-reset-tokens-table">
                  <thead>
                    <tr>
                      <th scope="col">User</th>
                      <th scope="col">Expires</th>
                      <th scope="col">Used</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resetTokens.map((token) => (
                      <tr>
                        <td>{userLabels.get(token.userId) ?? token.userId}</td>
                        <td>{formatDate(token.expiresAt)}</td>
                        <td>{formatDate(token.usedAt)}</td>
                        <td>{token.usedAt ? "Used" : "Waiting"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
