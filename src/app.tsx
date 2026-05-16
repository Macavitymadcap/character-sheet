import { Hono, type Context } from "hono";
import { AuthService, requireRole, requireSheetAccess, SessionService } from "./auth";
import { AdminPage } from "./components/pages/Admin";
import { HomePage } from "./components/pages/Home";
import { LoginPage } from "./components/pages/Login";
import type {
  AuthRepository,
  CampaignRepository,
  CharacterRepository,
  NotesRepository,
  RulesRepository,
  UserRole,
} from "./db";

export interface AppDependencies {
  appName: string;
  authRepository: AuthRepository;
  authService: AuthService;
  campaignRepository: CampaignRepository;
  characterRepository: CharacterRepository;
  notesRepository: NotesRepository;
  rulesRepository: RulesRepository;
  sessionService: SessionService;
}

export const createApp = (dependencies: AppDependencies) => {
  const app = new Hono();

  app.get("/healthz", (context) => context.json({ ok: true }));

  const readSession = (cookieHeader: string | undefined) =>
    dependencies.sessionService.readSession(cookieHeader);

  const guardResponse = (context: Context, result: ReturnType<typeof requireRole>) => {
    if (result.ok) return null;
    if (result.reason === "unauthenticated") return context.redirect("/login", 303);
    if (result.reason === "not_found") return context.text("Not found", 404);

    return context.text("Forbidden", 403);
  };

  app.get("/", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    return context.html(<HomePage appName={dependencies.appName} user={session.user} />);
  });

  app.get("/login", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (session) return context.redirect("/", 303);

    return context.html(<LoginPage appName={dependencies.appName} />);
  });

  app.post("/login", async (context) => {
    const body = await context.req.parseBody();
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");
    const user = dependencies.authService.verifyCredentials(email, password);

    if (!user) {
      context.status(401);
      return context.html(
        <LoginPage appName={dependencies.appName} error="Invalid email or password." />,
      );
    }

    const session = dependencies.sessionService.createSession(user.id);
    context.header("Set-Cookie", session.cookie);

    return context.redirect("/", 303);
  });

  app.post("/logout", (context) => {
    dependencies.sessionService.logout(context.req.header("cookie"));
    context.header("Set-Cookie", dependencies.sessionService.clearCookie());

    return context.redirect("/login", 303);
  });

  app.get("/admin", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    return context.html(<AdminPage appName={dependencies.appName} user={session.user} />);
  });

  app.post("/admin/invites", async (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    const body = await context.req.parseBody();
    const email = String(body.email ?? "");
    const role = String(body.role ?? "");
    if (!isUserRole(role)) return context.text("Invalid role", 400);

    const invite = dependencies.authService.createInvite({
      createdByUserId: session.user.id,
      email,
      role,
    });

    return context.json(
      {
        email: invite.email,
        id: invite.id,
        role: invite.role,
        token: invite.token,
      },
      201,
    );
  });

  app.get("/admin/invites/:token", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const invite = dependencies.authService.readInvite(context.req.param("token"));
    if (!invite) return context.text("Not found", 404);

    return context.json({
      email: invite.email,
      id: invite.id,
      role: invite.role,
    });
  });

  app.post("/admin/users/:userId/password-reset", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    const reset = dependencies.authService.createPasswordResetToken({
      createdByUserId: session.user.id,
      userId: context.req.param("userId"),
    });

    return context.json(
      {
        id: reset.id,
        token: reset.token,
        userId: reset.userId,
      },
      201,
    );
  });

  app.get("/admin/password-reset-tokens/:token", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const reset = dependencies.authService.readPasswordResetToken(context.req.param("token"));
    if (!reset) return context.text("Not found", 404);

    return context.json({
      id: reset.id,
      userId: reset.userId,
    });
  });

  app.patch("/sheet/:characterId/resources/:resourceId", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireSheetAccess({
      characterId: context.req.param("characterId"),
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    return context.body(null, 204);
  });

  return app;
};

function isUserRole(role: string): role is UserRole {
  return role === "admin" || role === "game_master" || role === "player";
}
