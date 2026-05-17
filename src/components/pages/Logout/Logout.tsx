import type { AuthUser } from "../../../db";
import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface LogoutPageProps {
  appName: string;
  user?: Pick<AuthUser, "displayName" | "role">;
}

export const LogoutPage = ({ appName, user }: LogoutPageProps) => {
  return (
    <Layout title={`Sign out - ${appName}`}>
      <div class="shell auth-page-shell">
        <SiteHeader appName={appName} currentSection="logout" user={user} />
        <main class="auth-shell">
          <Panel labelledBy="logout-heading" width="narrow">
            {user ? (
              <>
                <h1 id="logout-heading" class="panel-heading">
                  Sign out
                </h1>
                <p class="auth-copy">End the current session for {user.displayName}.</p>
                <form class="form-stack" action="/logout" method="post">
                  <Button type="submit">Sign out</Button>
                </form>
              </>
            ) : (
              <>
                <h1 id="logout-heading" class="panel-heading">
                  Signed out
                </h1>
                <p class="auth-copy">There is no active session in this browser.</p>
                <a class="action-link" href="/login">
                  Sign in
                </a>
              </>
            )}
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
