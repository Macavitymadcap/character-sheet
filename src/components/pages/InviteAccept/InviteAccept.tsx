import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { FormField } from "../../molecules/FormField";
import { Layout } from "../../templates/Layout";

interface InviteAcceptPageProps {
  appName: string;
  email: string;
  role: string;
  token: string;
}

export const InviteAcceptPage = ({ appName, email, role, token }: InviteAcceptPageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell login-shell">
        <main class="login-page">
          <Panel labelledBy="invite-heading">
            <h1 id="invite-heading" class="panel-heading">
              Accept invite
            </h1>
            <p class="login-lede">
              {email} ({role.replace("_", " ")})
            </p>
            <form class="form-stack" action={`/invites/${token}`} method="post">
              <FormField
                id="invite-display-name"
                label="Display name"
                name="displayName"
                required
                type="text"
              />
              <FormField id="invite-password" label="Password" name="password" required type="password" />
              <Button type="submit">Create account</Button>
            </form>
          </Panel>
        </main>
      </div>
    </Layout>
  );
};

