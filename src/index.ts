import { createApp, createRuntimeDependencies } from "./app";

const port = Number(Bun.env.PORT ?? 3000);
const hostname = Bun.env.HOST ?? "0.0.0.0";
const app = createApp(createRuntimeDependencies());

export default {
  fetch: app.fetch,
  hostname,
  port,
};
