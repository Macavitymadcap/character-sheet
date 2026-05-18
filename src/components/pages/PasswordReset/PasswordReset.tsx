import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { FormField } from "../../molecules/FormField";
import { Layout } from "../../templates/Layout";

interface PasswordResetPageProps {
  appName: string;
  token: string;
}

export const PasswordResetPage = ({ appName, token }: PasswordResetPageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell login-shell">
        <main class="login-page">
          <Panel labelledBy="reset-heading">
            <h1 id="reset-heading" class="panel-heading">
              Reset password
            </h1>
            <form class="form-stack" action={`/password-reset/${token}`} method="post">
              <FormField
                id="reset-password"
                label="New password"
                name="password"
                required
                type="password"
              />
              <Button type="submit">Set password</Button>
            </form>
          </Panel>
        </main>
      </div>
    </Layout>
  );
};

