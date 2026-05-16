import type { AuthUser } from "../../../db";
import { Layout } from "../../templates/Layout";

interface AdminPageProps {
  appName: string;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const AdminPage = ({ appName, user }: AdminPageProps) => {
  return (
    <Layout title={appName}>
      <main class="admin-shell">
        <section class="admin-panel" aria-labelledby="admin-heading">
          <h1 id="admin-heading">Admin</h1>
          <p class="account-summary">
            {user.displayName} · {user.role}
          </p>

          <section aria-labelledby="invite-heading">
            <h2 id="invite-heading">Create invite</h2>
            <form class="auth-form" action="/admin/invites" method="post">
              <div class="form-field">
                <label for="invite-email">Email</label>
                <input id="invite-email" name="email" type="email" required />
              </div>
              <div class="form-field">
                <label for="invite-role">Role</label>
                <select id="invite-role" name="role">
                  <option value="player">Player</option>
                  <option value="game_master">Game Master</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button class="submit-button" type="submit">
                Create invite
              </button>
            </form>
          </section>
        </section>
      </main>
    </Layout>
  );
};
