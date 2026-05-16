import { Layout } from "../../templates/Layout";

interface LoginPageProps {
  appName: string;
  error?: string;
}

export const LoginPage = ({ appName, error }: LoginPageProps) => {
  return (
    <Layout title={appName}>
      <main class="auth-shell">
        <section class="auth-panel" aria-labelledby="login-heading">
          <h1 id="login-heading">Sign in</h1>
          {error ? (
            <p class="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <form class="auth-form" action="/login" method="post">
            <div class="form-field">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" autocomplete="username" required />
            </div>
            <div class="form-field">
              <label for="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
              />
            </div>
            <button class="submit-button" type="submit">
              Sign in
            </button>
          </form>
        </section>
      </main>
    </Layout>
  );
};
