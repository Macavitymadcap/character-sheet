import { Hono, type Context } from "hono";
import { AuthService, requireRole, requireSheetAccess, SessionService } from "./auth";
import { AdminPage } from "./components/pages/Admin";
import { CampaignPage } from "./components/pages/Campaign";
import { HomePage } from "./components/pages/Home";
import { LoginPage } from "./components/pages/Login";
import { LogoutPage } from "./components/pages/Logout";
import { SheetPage } from "./components/pages/Sheet";
import { SheetHeader } from "./components/organisms/SheetHeader";
import { SheetTabPanel } from "./components/organisms/SheetTabPanel";
import { isSheetTabId } from "./components/organisms/SheetTabs";
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

  const defaultRouteForRole = (role: UserRole) => {
    if (role === "admin") return "/admin";
    if (role === "game_master") return "/campaigns/rovnost-shadows";

    return "/sheet/lynott";
  };

  const getSheetByRef = (characterRef: string) =>
    dependencies.characterRepository.getSheetBySlug(characterRef) ??
    dependencies.characterRepository.getSheetById(characterRef);

  const guardResponse = (context: Context, result: ReturnType<typeof requireRole>) => {
    if (result.ok) return null;
    if (result.reason === "unauthenticated") return context.redirect("/login", 303);
    if (result.reason === "not_found") return context.text("Not found", 404);

    return context.text("Forbidden", 403);
  };

  app.get("/", (context) => {
    const session = readSession(context.req.header("cookie"));

    return context.html(<HomePage appName={dependencies.appName} user={session?.user} />);
  });

  app.get("/login", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (session) return context.redirect(defaultRouteForRole(session.user.role), 303);

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

    return context.redirect(defaultRouteForRole(user.role), 303);
  });

  app.get("/logout", (context) => {
    const session = readSession(context.req.header("cookie"));

    return context.html(<LogoutPage appName={dependencies.appName} user={session?.user} />);
  });

  app.post("/logout", (context) => {
    dependencies.sessionService.logout(context.req.header("cookie"));
    context.header("Set-Cookie", dependencies.sessionService.clearCookie());

    return context.redirect("/", 303);
  });

  app.get("/admin", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    return context.html(<AdminPage appName={dependencies.appName} user={session.user} />);
  });

  app.get("/campaigns/:campaignSlug", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["game_master"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    return context.html(
      <CampaignPage
        appName={dependencies.appName}
        campaign={campaign}
        members={dependencies.campaignRepository.listMembers(campaign.id)}
        user={session.user}
      />,
    );
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

  app.get("/sheet/:characterRef", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const characterRef = context.req.param("characterRef");
    const sheet = getSheetByRef(characterRef);
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "read",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    if (characterRef !== sheet.slug) return context.redirect(`/sheet/${sheet.slug}`, 303);

    return context.html(
      <SheetPage
        activeTab="core"
        appName={dependencies.appName}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={sheet}
        user={session.user}
      />,
    );
  });

  app.get("/sheet/:characterRef/tabs/:tabId", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "read",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const tabId = context.req.param("tabId");
    if (!isSheetTabId(tabId)) return context.text("Not found", 404);

    return context.html(
      <SheetTabPanel
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={sheet}
        tabId={tabId}
      />,
    );
  });

  app.patch("/sheet/:characterRef/resources/:resourceId", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const resourceId = context.req.param("resourceId");
    const resource = dependencies.characterRepository
      .listResources(sheet.id)
      .find((candidate) => candidate.id === resourceId);
    if (!resource) return context.text("Not found", 404);

    const body = await context.req.parseBody();
    const current = parseFormNumber(body.current);
    const delta = parseFormNumber(body.delta);
    const tabId = parseSheetTabId(body.tabId);
    if (body.tabId !== undefined && !tabId) return context.text("Invalid tab", 400);
    if (current === null && delta === null) return context.text("Invalid resource update", 400);

    const nextCurrent = current ?? resource.current + Number(delta);
    const updated = dependencies.characterRepository.updateResourceCurrent(
      sheet.id,
      resourceId,
      nextCurrent,
    );
    if (!updated) return context.text("Not found", 404);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    const updatedResources = dependencies.characterRepository.listResources(sheet.id);

    if (tabId) {
      return context.html(
        <SheetTabPanel
          equipment={dependencies.characterRepository.listEquipment(sheet.id)}
          notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
          resources={updatedResources}
          ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
          sheet={updatedSheet}
          tabId={tabId}
        />,
      );
    }

    return context.html(
      <SheetHeader
        resources={updatedResources}
        sheet={updatedSheet}
      />,
    );
  });

  return app;
};

function isUserRole(role: string): role is UserRole {
  return role === "admin" || role === "game_master" || role === "player";
}

function parseFormNumber(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSheetTabId(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return null;

  return isSheetTabId(value) ? value : null;
}
