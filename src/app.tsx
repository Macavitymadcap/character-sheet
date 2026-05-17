import { Hono, type Context } from "hono";
import { AuthService, requireRole, requireSheetAccess, SessionService } from "./auth";
import { isRestType, planRestResourceUpdates } from "./characters/rests";
import { AdminPage } from "./components/pages/Admin";
import { CampaignPage } from "./components/pages/Campaign";
import { HomePage } from "./components/pages/Home";
import { LoginPage } from "./components/pages/Login";
import { LogoutPage } from "./components/pages/Logout";
import { SheetPage } from "./components/pages/Sheet";
import { SheetHeader } from "./components/organisms/SheetHeader";
import { SheetTabPanel } from "./components/organisms/SheetTabPanel";
import { SheetTabWorkspace } from "./components/organisms/SheetTabWorkspace";
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
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
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
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
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
          backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
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

  app.patch("/sheet/:characterRef/equipment/:equipmentId", async (context) => {
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

    const body = await context.req.parseBody();
    const equipmentId = context.req.param("equipmentId");
    const currentEquipment = dependencies.characterRepository
      .listEquipment(sheet.id)
      .find((candidate) => candidate.id === equipmentId);
    if (!currentEquipment) return context.text("Not found", 404);

    const quantity = parseFormNumber(body.quantity);
    const deltaQuantity = parseFormNumber(body.deltaQuantity);
    const equipped = parseFormBoolean(body.equipped);
    if (quantity === null && deltaQuantity === null && equipped === null) {
      return context.text("Invalid equipment update", 400);
    }

    const nextQuantity =
      quantity ?? (deltaQuantity === null ? undefined : currentEquipment.quantity + deltaQuantity);
    const updated = dependencies.characterRepository.updateEquipmentItem(sheet.id, equipmentId, {
      equipped: equipped ?? undefined,
      quantity: nextQuantity,
    });
    if (!updated) return context.text("Not found", 404);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return context.html(
      <SheetTabPanel
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={updatedSheet}
        tabId="equipment"
      />,
    );
  });

  app.patch("/sheet/:characterRef/notes/:noteId", async (context) => {
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

    const body = await context.req.parseBody();
    const noteBody = parseFormString(body.body);
    if (noteBody === null) return context.text("Invalid note", 400);

    const note = dependencies.notesRepository.updateNoteBody(
      sheet.id,
      context.req.param("noteId"),
      session.user.role,
      noteBody,
    );
    if (!note) return context.text("Not found", 404);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return context.html(
      <SheetTabPanel
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={updatedSheet}
        tabId="notes"
      />,
    );
  });

  app.post("/sheet/:characterRef/conditions", async (context) => {
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

    const body = await context.req.parseBody();
    const label = parseFormText(body.label);
    if (!label) return context.text("Invalid condition", 400);

    dependencies.characterRepository.upsertConditionResource(sheet.id, label);
    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return context.html(
      <SheetHeader
        resources={dependencies.characterRepository.listResources(sheet.id)}
        sheet={updatedSheet}
      />,
    );
  });

  app.post("/sheet/:characterRef/rolls", async (context) => {
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

    const body = await context.req.parseBody();
    const label = parseFormText(body.label);
    if (!label) return context.text("Invalid roll", 400);
    const resultId = parseFormText(body.resultId);

    const baseModifier = parseFormNumber(body.modifier) ?? parseFormNumber(body.baseModifier) ?? 0;
    const proficiencyBonus = parseFormNumber(body.proficiencyBonus) ?? 0;
    const additionalModifier = parseFormNumber(body.additionalModifier) ?? 0;
    const modifier = baseModifier + proficiencyBonus + additionalModifier;
    const mode = parseRollMode(body.mode);
    const first = rollD20();
    const second = mode === "normal" ? null : rollD20();
    const die =
      second === null
        ? first
        : mode === "advantage"
          ? Math.max(first, second)
          : Math.min(first, second);
    const total = die + modifier;
    const rollText = second === null ? String(first) : `${first}, ${second}`;

    return context.html(
      <output id={resultId ?? undefined} class="dice-roll-result">
        {label}: d20 ({rollText}) {formatSignedNumber(modifier)} = {total}
      </output>,
    );
  });

  app.post("/sheet/:characterRef/rests/:restType", async (context) => {
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

    const restType = context.req.param("restType");
    if (!isRestType(restType)) return context.text("Invalid rest", 400);

    const body = await context.req.parseBody();
    const requestedTabId = parseSheetTabId(body.tabId);
    if (body.tabId !== undefined && !requestedTabId) {
      return context.text("Invalid tab", 400);
    }
    const tabId = requestedTabId ?? "actions";

    const resources = dependencies.characterRepository.listResources(sheet.id);
    for (const update of planRestResourceUpdates({ resources, restType })) {
      dependencies.characterRepository.updateResourceCurrent(
        sheet.id,
        update.resourceId,
        update.current,
      );
    }

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    const updatedResources = dependencies.characterRepository.listResources(sheet.id);

    return context.html(
      <SheetTabWorkspace
        activeTab={tabId}
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        header={<SheetHeader resources={updatedResources} sheet={updatedSheet} />}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={updatedResources}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
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

function parseFormBoolean(value: unknown) {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;

  return null;
}

function parseFormText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function parseFormString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function parseSheetTabId(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return null;

  return isSheetTabId(value) ? value : null;
}

function parseRollMode(value: unknown) {
  return value === "advantage" || value === "disadvantage" ? value : "normal";
}

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function formatSignedNumber(value: number) {
  if (value === 0) return "+ 0";
  if (value > 0) return `+ ${value}`;

  return `- ${Math.abs(value)}`;
}
