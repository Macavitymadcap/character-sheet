import { Hono } from "hono";
import { HomePage } from "./components/pages/Home";
import type {
  AuthRepository,
  CampaignRepository,
  CharacterRepository,
  NotesRepository,
  RulesRepository,
} from "./db";

export interface AppDependencies {
  appName: string;
  authRepository: AuthRepository;
  campaignRepository: CampaignRepository;
  characterRepository: CharacterRepository;
  notesRepository: NotesRepository;
  rulesRepository: RulesRepository;
}

export const createApp = (dependencies: AppDependencies) => {
  const app = new Hono();

  app.get("/healthz", (context) => context.json({ ok: true }));

  app.get("/", (context) => {
    return context.html(<HomePage appName={dependencies.appName} />);
  });

  return app;
};
