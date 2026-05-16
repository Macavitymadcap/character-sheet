import { Hono } from "hono";
import { HomePage } from "./components/pages/Home";

export interface AppDependencies {
  appName: string;
}

export const createRuntimeDependencies = (): AppDependencies => ({
  appName: "Character Sheet",
});

export const createApp = (dependencies: AppDependencies) => {
  const app = new Hono();

  app.get("/healthz", (context) => context.json({ ok: true }));

  app.get("/", (context) => {
    return context.html(<HomePage appName={dependencies.appName} />);
  });

  return app;
};
