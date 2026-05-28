import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { FormField } from "../../molecules/FormField";
import { PasswordField } from "../../molecules/PasswordField";
import { Layout } from "../../templates/Layout";

interface InviteAcceptPageProps {
  appName: string;
  email: string;
  error?: string;
  role: string;
  token: string;
}

export const InviteAcceptPage = ({ appName, email, error, role, token }: InviteAcceptPageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell login-shell">
        <main class="login-page">
          <Panel labelledBy="invite-heading">
            <h1 id="invite-heading" class="panel-heading">
              Accept invite
            </h1>
            <p class="login-lede">
              Username: {email} ({role.replace("_", " ")})
            </p>
            {error ? (
              <p class="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <form class="form-stack" action={`/invites/${token}`} method="post">
              <FormField
                id="invite-display-name"
                label="Display name"
                name="displayName"
                required
                type="text"
              />
              <PasswordField
                autocomplete="new-password"
                id="invite-password"
                label="Password"
                name="password"
              />
              <PasswordField
                autocomplete="new-password"
                id="invite-password-confirmation"
                label="Confirm password"
                name="passwordConfirmation"
              />
              <Button type="submit">Create account</Button>
            </form>
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
