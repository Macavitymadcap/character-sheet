import type { AuthUser } from "../../../db";
import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { FormField } from "../../molecules/FormField";
import { Layout } from "../../templates/Layout";

interface AdminPageProps {
  appName: string;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const AdminPage = ({ appName, user }: AdminPageProps) => {
  return (
    <Layout title={appName}>
      <main class="admin-shell">
        <Panel labelledBy="admin-heading">
          <h1 id="admin-heading" class="panel-heading">
            Admin
          </h1>
          <p class="account-summary">
            {user.displayName} · {user.role}
          </p>

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
        </Panel>
      </main>
    </Layout>
  );
};
