import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { FormField } from "../../molecules/FormField";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface LoginPageProps {
  appName: string;
  error?: string;
}

export const LoginPage = ({ appName, error }: LoginPageProps) => {
  return (
    <Layout title={appName}>
      <div class="shell auth-page-shell">
        <SiteHeader appName={appName} currentSection="login" />
        <main class="auth-shell">
          <Panel labelledBy="login-heading" width="narrow">
            <h1 id="login-heading" class="panel-heading">
              Sign in
            </h1>
            {error ? (
              <p class="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <form class="form-stack" action="/login" method="post">
              <FormField
                autocomplete="email"
                id="email"
                label="Email"
                name="email"
                required
                type="email"
              />
              <FormField
                autocomplete="current-password"
                id="password"
                label="Password"
                name="password"
                required
                type="password"
              />
              <Button type="submit">Sign in</Button>
            </form>
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
