import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { PasswordField } from "../../molecules/PasswordField";
import { Layout } from "../../templates/Layout";

interface PasswordResetPageProps {
  appName: string;
  error?: string;
  token: string;
}

export const PasswordResetPage = ({ appName, error, token }: PasswordResetPageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell login-shell">
        <main class="login-page">
          <Panel labelledBy="reset-heading">
            <h1 id="reset-heading" class="panel-heading">
              Reset password
            </h1>
            {error ? (
              <p class="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <form class="form-stack" action={`/password-reset/${token}`} method="post">
              <PasswordField
                autocomplete="new-password"
                id="reset-password"
                label="New password"
                name="password"
              />
              <PasswordField
                autocomplete="new-password"
                id="reset-password-confirmation"
                label="Confirm password"
                name="passwordConfirmation"
              />
              <Button type="submit">Set password</Button>
            </form>
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
