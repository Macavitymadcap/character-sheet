import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { Hono, type Context } from "hono";
import { AuthService, requireCampaignAccess, requireRole, requireSheetAccess, SessionService } from "./auth";
import { isCampaignWikiPageType, normaliseGoogleDocsMarkdown } from "./campaigns/wiki";
import { isRestType, planRestResourceUpdates } from "./characters/rests";
import { AdminPage } from "./components/pages/Admin";
import { CampaignPage, CampaignWikiDetailPage } from "./components/pages/Campaign";
import { CharactersPage } from "./components/pages/Characters";
import { HomePage } from "./components/pages/Home";
import { InviteAcceptPage } from "./components/pages/InviteAccept";
import { LoginPage } from "./components/pages/Login";
import { LogoutPage } from "./components/pages/Logout";
import { PasswordResetPage } from "./components/pages/PasswordReset";
import { RulesDetailPage, RulesPage } from "./components/pages/Rules";
import { SheetPage } from "./components/pages/Sheet";
import { SheetHeader } from "./components/organisms/SheetHeader";
import { SheetTabPanel } from "./components/organisms/SheetTabPanel";
import { SheetTabWorkspace } from "./components/organisms/SheetTabWorkspace";
import { isSheetTabId } from "./components/organisms/SheetTabs";
import type {
  AuthRepository,
  AbilityName,
  CampaignContentRepository,
  CampaignContentVisibility,
  CampaignRepository,
  CharacterRepository,
  CreateCharacterInput,
  NotesRepository,
  RuleEntityType,
  RuleSearchFilters,
  RulesRepository,
  UserRole,
  WikiPageType,
} from "./db";

export interface AppDependencies {
  appName: string;
  authRepository: AuthRepository;
  authService: AuthService;
  campaignContentRepository: CampaignContentRepository;
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

    return "/characters";
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

  app.get("/rules", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const filters = parseRuleFilters(context);

    return context.html(
      <RulesPage
        appName={dependencies.appName}
        counts={dependencies.rulesRepository.listRuleEntityTypes()}
        filters={filters}
        rules={dependencies.rulesRepository.listRules(filters)}
        user={session.user}
      />,
    );
  });

  app.get("/rules/:entityType/:slug", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const entityType = parseRuleEntityType(context.req.param("entityType"));
    if (!entityType) return context.text("Not found", 404);

    const rule = dependencies.rulesRepository.getRuleDetail(entityType, context.req.param("slug"));
    if (!rule) return context.text("Not found", 404);

    return context.html(
      <RulesDetailPage
        appName={dependencies.appName}
        counts={dependencies.rulesRepository.listRuleEntityTypes()}
        filters={parseRuleFilters(context)}
        rule={rule}
        user={session.user}
      />,
    );
  });

  app.get("/rules/:entityType", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const entityType = parseRuleEntityType(context.req.param("entityType"));
    if (!entityType) return context.text("Not found", 404);

    const query = new URLSearchParams(context.req.query()).toString();

    return context.redirect(`/rules?type=${entityType}${query ? `&${query}` : ""}`, 303);
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

    return context.html(
      <AdminPage
        appName={dependencies.appName}
        invites={dependencies.authRepository.listInvites()}
        resetTokens={dependencies.authRepository.listPasswordResetTokens()}
        users={dependencies.authRepository.listUserSummaries()}
        user={session.user}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "read",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    return context.html(
      <CampaignPage
        appName={dependencies.appName}
        campaign={campaign}
        gameMasterDisplayName={
          dependencies.authRepository.findUserById(campaign.gmUserId)?.displayName ??
          campaign.gmUserId
        }
        imageAssets={dependencies.campaignContentRepository.listImageAssetsForCampaign(campaign.id, session.user.role)}
        members={dependencies.campaignRepository.listMembers(campaign.id)}
        sessions={dependencies.campaignContentRepository.listSessionsForCampaign(campaign.id, session.user.role)}
        user={session.user}
        wikiPages={dependencies.campaignContentRepository.listWikiPagesForCampaign(campaign.id, session.user.role)}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/wiki/:wikiSlug", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "read",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const page = dependencies.campaignContentRepository.getWikiPageBySlug(
      campaign.id,
      context.req.param("wikiSlug"),
      session.user.role,
    );
    if (!page) return context.text("Not found", 404);

    const cover = page.coverImageAssetId
      ? dependencies.campaignContentRepository.getImageAssetById(
          campaign.id,
          page.coverImageAssetId,
          session.user.role,
        )
      : null;

    return context.html(
      <CampaignWikiDetailPage
        appName={dependencies.appName}
        campaign={campaign}
        cover={cover}
        galleryAssets={dependencies.campaignContentRepository.listImageAssetsForWikiPage(
          campaign.id,
          page.id,
          "gallery",
          session.user.role,
        )}
        inlineAssets={dependencies.campaignContentRepository.listImageAssetsForWikiPage(
          campaign.id,
          page.id,
          "inline",
          session.user.role,
        )}
        page={page}
        user={session.user}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/assets/:assetId", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "read",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const asset = dependencies.campaignContentRepository.getImageAssetById(
      campaign.id,
      context.req.param("assetId"),
      session.user.role,
    );
    if (!asset) return context.text("Not found", 404);

    const file = Bun.file(`${assetStorageRoot()}/${asset.storageKey}`);
    if (!(await file.exists())) {
      return new Response(missingSeedAssetSvg(asset.title), {
        headers: {
          "Cache-Control": "private, max-age=300",
          "Content-Type": "image/svg+xml",
        },
      });
    }

    return new Response(file, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": asset.mimeType,
      },
    });
  });

  app.post("/campaigns/:campaignSlug/wiki", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const parsed = parseCampaignWikiForm(await context.req.parseBody());
    if (!parsed.ok) return context.text(parsed.message, 400);

    dependencies.campaignContentRepository.createWikiPage({
      ...parsed.value,
      campaignId: campaign.id,
    });

    return context.redirect(`/campaigns/${campaign.slug}`, 303);
  });

  app.post("/campaigns/:campaignSlug/assets", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const parsed = await parseCampaignAssetForm(await context.req.parseBody(), campaign.slug);
    if (!parsed.ok) return context.text(parsed.message, 400);

    dependencies.campaignContentRepository.createImageAsset({
      ...parsed.value,
      campaignId: campaign.id,
    });

    return context.redirect(`/campaigns/${campaign.slug}`, 303);
  });

  app.post("/campaigns/:campaignSlug/sessions", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const parsed = parseCampaignSessionForm(body);
    if (!parsed.ok) return context.text(parsed.message, 400);

    dependencies.campaignContentRepository.createSession({
      ...parsed.value,
      campaignId: campaign.id,
      createdByUserId: session.user.id,
    });

    return context.redirect(`/campaigns/${campaign.slug}`, 303);
  });

  app.post("/campaigns/:campaignSlug/sessions/:sessionId", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const parsed = parseCampaignSessionForm(body);
    if (!parsed.ok) return context.text(parsed.message, 400);

    const updated = dependencies.campaignContentRepository.updateSession(
      campaign.id,
      context.req.param("sessionId"),
      parsed.value,
    );
    if (!updated) return context.text("Not found", 404);

    return context.redirect(`/campaigns/${campaign.slug}`, 303);
  });

  app.post("/campaigns/:campaignSlug/sessions/:sessionId/delete", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const deleted = dependencies.campaignContentRepository.deleteSession(
      campaign.id,
      context.req.param("sessionId"),
    );
    if (!deleted) return context.text("Not found", 404);

    return context.redirect(`/campaigns/${campaign.slug}`, 303);
  });

  app.get("/characters", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["player"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    return context.html(
      <CharactersPage
        appName={dependencies.appName}
        characters={dependencies.characterRepository.listCharactersForPlayer(session.user.id)}
        mode="player"
        showCreateForm={false}
        user={session.user}
      />,
    );
  });

  app.get("/characters/new", (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["player"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    return context.html(
      <CharactersPage
        appName={dependencies.appName}
        characters={dependencies.characterRepository.listCharactersForPlayer(session.user.id)}
        mode="player"
        user={session.user}
      />,
    );
  });

  app.post("/characters", async (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["player"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository
      .listMembers("campaign_rovnost_shadows")
      .find((member) => member.userId === session.user.id)
      ? dependencies.campaignRepository.getCampaignById("campaign_rovnost_shadows")
      : null;
    if (!campaign) return context.text("Forbidden", 403);

    const input = await parseCharacterCreateForm(context, {
      campaignId: campaign.id,
      ownerUserId: session.user.id,
    });
    if (!input.ok) return context.text(input.message, 400);

    const sheet = dependencies.characterRepository.createCharacter(input.value);

    return context.redirect(`/sheet/${sheet.slug}`, 303);
  });

  app.get("/campaigns/:campaignSlug/characters", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    return context.html(
      <CharactersPage
        appName={dependencies.appName}
        campaign={campaign}
        characters={dependencies.characterRepository.listCharactersForCampaign(campaign.id)}
        members={membersWithDisplayNames(dependencies, campaign.id)}
        mode="game_master"
        showCreateForm={false}
        user={session.user}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/characters/new", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    return context.html(
      <CharactersPage
        appName={dependencies.appName}
        campaign={campaign}
        characters={dependencies.characterRepository.listCharactersForCampaign(campaign.id)}
        members={membersWithDisplayNames(dependencies, campaign.id)}
        mode="game_master"
        user={session.user}
      />,
    );
  });

  app.post("/campaigns/:campaignSlug/characters", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      context.req.param("campaignSlug"),
    );
    if (!campaign) return context.text("Not found", 404);

    const guard = requireCampaignAccess({
      campaignId: campaign.id,
      campaignRepository: dependencies.campaignRepository,
      permission: "manage",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const ownerUserId = parseFormText(body.ownerUserId);
    const owner = ownerUserId
      ? dependencies.campaignRepository
          .listMembers(campaign.id)
          .find((member) => member.userId === ownerUserId && member.role === "player")
      : null;
    if (!owner) return context.text("Invalid owner", 400);

    const input = await parseCharacterCreateForm(context, {
      body,
      campaignId: campaign.id,
      ownerUserId: owner.userId,
    });
    if (!input.ok) return context.text(input.message, 400);

    const sheet = dependencies.characterRepository.createCharacter(input.value);

    return context.redirect(`/sheet/${sheet.slug}`, 303);
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

  app.post("/admin/users/:userId/status", async (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const status = String(body.status ?? "");
    if (status !== "active" && status !== "disabled") return context.text("Invalid status", 400);

    const targetUser = dependencies.authRepository.findUserById(context.req.param("userId"));
    if (!targetUser) return context.text("Not found", 404);
    if (targetUser.id === session?.user.id && status === "disabled") {
      return context.text("Cannot disable your own account", 400);
    }
    if (
      targetUser.role === "admin" &&
      targetUser.status === "active" &&
      status === "disabled" &&
      dependencies.authRepository.countActiveAdmins() <= 1
    ) {
      return context.text("Cannot disable the last active admin", 400);
    }

    dependencies.authRepository.updateUserStatus(targetUser.id, status);

    return context.redirect("/admin", 303);
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

  app.get("/invites/:token", (context) => {
    const invite = dependencies.authService.readInvite(context.req.param("token"));
    if (!invite) return context.text("Not found", 404);

    return context.html(
      <InviteAcceptPage
        appName={dependencies.appName}
        email={invite.email}
        role={invite.role}
        token={context.req.param("token")}
      />,
    );
  });

  app.post("/invites/:token", async (context) => {
    const body = await context.req.parseBody();
    const displayName = String(body.displayName ?? "");
    const password = String(body.password ?? "");
    if (!displayName.trim() || !password) return context.text("Missing fields", 400);

    try {
      dependencies.authService.acceptInvite({ displayName, password, token: context.req.param("token") });
    } catch (error) {
      return context.text(error instanceof Error ? error.message : "Unable to accept invite", 400);
    }

    return context.redirect("/login", 303);
  });

  app.get("/password-reset/:token", (context) => {
    const reset = dependencies.authService.readPasswordResetToken(context.req.param("token"));
    if (!reset) return context.text("Not found", 404);

    return context.html(
      <PasswordResetPage appName={dependencies.appName} token={context.req.param("token")} />,
    );
  });

  app.post("/password-reset/:token", async (context) => {
    const body = await context.req.parseBody();
    const password = String(body.password ?? "");
    if (!password) return context.text("Missing password", 400);

    try {
      dependencies.authService.usePasswordResetToken({ password, token: context.req.param("token") });
    } catch (error) {
      return context.text(error instanceof Error ? error.message : "Unable to reset password", 400);
    }

    return context.redirect("/login", 303);
  });

  app.get("/sheet/:characterRef", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const characterRef = context.req.param("characterRef");
    const sheet = getSheetByRef(characterRef);
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
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
        campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={sheet}
        user={session.user}
      />,
    );
  });

  app.get("/sheet/:characterRef/:tabId", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const characterRef = context.req.param("characterRef");
    const sheet = getSheetByRef(characterRef);
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "read",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const tabId = context.req.param("tabId");
    if (!isSheetTabId(tabId)) return context.text("Not found", 404);
    if (characterRef !== sheet.slug) return context.redirect(`/sheet/${sheet.slug}/${tabId}`, 303);

    return context.html(
      <SheetPage
        activeTab={tabId}
        appName={dependencies.appName}
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
        campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
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
      campaignRepository: dependencies.campaignRepository,
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
        campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={sheet}
        tabId={tabId}
      />,
    );
  });

  app.patch("/sheet/:characterRef/summary", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const summary = parseSheetSummaryForm(body, sheet);
    if (!summary.ok) return context.text(summary.message, 400);

    const updatedSheet = dependencies.characterRepository.updateSheetSummary(sheet.id, summary.value);
    if (!updatedSheet) return context.text("Not found", 404);

    return context.html(
      <SheetHeader
        resources={dependencies.characterRepository.listResources(sheet.id)}
        sheet={updatedSheet}
      />,
    );
  });

  app.patch("/sheet/:characterRef/abilities/:ability", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);
    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const ability = context.req.param("ability");
    if (!isAbilityName(ability)) return context.text("Not found", 404);

    const body = await context.req.parseBody();
    const score = parseFormNumber(body.score);
    const saveProficient = parseFormBoolean(body.saveProficient) ?? false;
    if (score === null || score < 1 || score > 30) return context.text("Invalid ability", 400);

    const updatedSheet = dependencies.characterRepository.updateAbility(sheet.id, ability, {
      saveProficient,
      score,
    });
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, session.user.role, "core");
  });

  app.patch("/sheet/:characterRef/skills/:skill", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);
    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const proficiencyLevel = parseFormNumber(body.proficiencyLevel);
    if (proficiencyLevel === null || proficiencyLevel < 0 || proficiencyLevel > 2) {
      return context.text("Invalid skill", 400);
    }

    const updatedSheet = dependencies.characterRepository.updateSkill(
      sheet.id,
      context.req.param("skill"),
      { proficiencyLevel },
    );
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, session.user.role, "skills");
  });

  app.patch("/sheet/:characterRef/senses/:senseId", async (context) => {
    const result = await updateSheetRow(context, dependencies, "core", async (sheet, body) => {
      const label = parseFormText(body.label);
      const value = parseFormText(body.value);
      if (!label || !value) return false;

      return dependencies.characterRepository.updateSense(
        sheet.id,
        context.req.param("senseId"),
        { label, value },
      );
    });

    return result;
  });

  app.patch("/sheet/:characterRef/armour/:sourceId", async (context) => {
    const result = await updateSheetRow(context, dependencies, "core", async (sheet, body) => {
      const label = parseFormText(body.label);
      const value = parseFormNumber(body.value);
      if (!label || value === null) return false;

      return dependencies.characterRepository.updateArmourClassSource(
        sheet.id,
        context.req.param("sourceId"),
        { label, notes: parseFormString(body.notes) ?? "", value },
      );
    });

    return result;
  });

  app.patch("/sheet/:characterRef/defences/:defenceId", async (context) => {
    const result = await updateSheetRow(context, dependencies, "core", async (sheet, body) => {
      const label = parseFormText(body.label);
      const detail = parseFormText(body.detail);
      if (!label || !detail) return false;

      return dependencies.characterRepository.updateDefence(
        sheet.id,
        context.req.param("defenceId"),
        { detail, label },
      );
    });

    return result;
  });

  app.patch("/sheet/:characterRef/proficiencies/:proficiencyId", async (context) => {
    const result = await updateSheetRow(context, dependencies, "skills", async (sheet, body) => {
      const name = parseFormText(body.name);
      if (!name) return false;

      return dependencies.characterRepository.updateProficiency(
        sheet.id,
        context.req.param("proficiencyId"),
        { detail: parseFormString(body.detail) ?? "", name },
      );
    });

    return result;
  });

  app.patch("/sheet/:characterRef/background/:entryId", async (context) => {
    const result = await updateSheetRow(context, dependencies, "background", async (sheet, body) => {
      const title = parseFormText(body.title);
      if (!title) return false;

      return dependencies.characterRepository.updateBackgroundEntry(
        sheet.id,
        context.req.param("entryId"),
        { body: parseFormString(body.body) ?? "", title },
      );
    });

    return result;
  });

  app.patch("/sheet/:characterRef/resources/:resourceId", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
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
          campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
          equipment={dependencies.characterRepository.listEquipment(sheet.id)}
          factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
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
      campaignRepository: dependencies.campaignRepository,
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
    const name = parseFormString(body.name);
    const category = parseFormString(body.category);
    const notes = parseFormString(body.notes);
    if (
      quantity === null &&
      deltaQuantity === null &&
      equipped === null &&
      name === null &&
      category === null &&
      notes === null
    ) {
      return context.text("Invalid equipment update", 400);
    }
    if ((name !== null && !name) || (category !== null && !category)) {
      return context.text("Invalid equipment update", 400);
    }

    const nextQuantity =
      quantity ?? (deltaQuantity === null ? undefined : currentEquipment.quantity + deltaQuantity);
    const updated = dependencies.characterRepository.updateEquipmentItem(sheet.id, equipmentId, {
      category: category ?? undefined,
      equipped: equipped ?? undefined,
      name: name ?? undefined,
      notes: notes ?? undefined,
      quantity: nextQuantity,
    });
    if (!updated) return context.text("Not found", 404);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return context.html(
      <SheetTabPanel
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
        campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
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
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const noteBody = parseFormString(body.body);
    const noteTitle = parseFormText(body.title);
    if (noteBody === null || !noteTitle) return context.text("Invalid note", 400);

    const note = dependencies.notesRepository.updateNote(
      sheet.id,
      context.req.param("noteId"),
      session.user.role,
      { body: noteBody, title: noteTitle },
    );
    if (!note) return context.text("Not found", 404);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return context.html(
      <SheetTabPanel
        backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
        campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, session.user.role)}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={updatedSheet}
        tabId="notes"
      />,
    );
  });

  app.post("/sheet/:characterRef/notes", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const title = parseFormText(body.title);
    const noteBody = parseFormString(body.body);
    const visibility = parseNoteVisibility(body.visibility);
    if (!title || noteBody === null || !visibility) return context.text("Invalid note", 400);
    if (session.user.role === "player" && visibility === "game_master") {
      return context.text("Forbidden", 403);
    }

    dependencies.notesRepository.createNote({
      authorUserId: session.user.id,
      body: noteBody,
      characterId: sheet.id,
      title,
      visibility,
    });

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, session.user.role, "notes");
  });

  app.post("/sheet/:characterRef/notes/:noteId/delete", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const deleted = dependencies.notesRepository.deleteNote(
      sheet.id,
      context.req.param("noteId"),
      session.user.role,
    );
    if (!deleted) return context.text("Not found", 404);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, session.user.role, "notes");
  });

  app.patch("/sheet/:characterRef/faction", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
      characterId: sheet.id,
      characterRepository: dependencies.characterRepository,
      permission: "write",
      session,
    });
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const body = await context.req.parseBody();
    const factionId = parseFormString(body.factionId) || null;
    const connectionNote = parseFormString(body.connectionNote) ?? "";
    if (factionId && !campaignFactionsForSheet(dependencies, sheet.id).some((faction) => faction.id === factionId)) {
      return context.text("Invalid faction", 400);
    }

    const choice = dependencies.campaignContentRepository.updateCharacterFactionChoice(
      sheet.id,
      factionId,
      connectionNote,
    );
    if (factionId && !choice) return context.text("Invalid faction", 400);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, session.user.role, "background");
  });

  app.post("/sheet/:characterRef/conditions", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const sheet = getSheetByRef(context.req.param("characterRef"));
    if (!sheet) return context.text("Not found", 404);

    const guard = requireSheetAccess({
      campaignRepository: dependencies.campaignRepository,
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
      campaignRepository: dependencies.campaignRepository,
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
      campaignRepository: dependencies.campaignRepository,
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
        campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
        equipment={dependencies.characterRepository.listEquipment(sheet.id)}
        factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
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

async function parseCharacterCreateForm(
  context: Context,
  options: {
    body?: Awaited<ReturnType<Context["req"]["parseBody"]>>;
    campaignId: string;
    ownerUserId: string;
  },
): Promise<{ ok: true; value: CreateCharacterInput } | { ok: false; message: string }> {
  const body = options.body ?? await context.req.parseBody();
  const name = parseFormText(body.name);
  const species = parseFormText(body.species);
  const className = parseFormText(body.className);
  const background = parseFormText(body.background);
  const level = parseFormNumber(body.level);
  const hitPointMax = parseFormNumber(body.hitPointMax);
  if (!name || !species || !className || !background || level === null || hitPointMax === null) {
    return { ok: false, message: "Missing character fields" };
  }
  if (level < 1 || hitPointMax < 1) {
    return { ok: false, message: "Invalid character values" };
  }

  return {
    ok: true,
    value: {
      background,
      campaignId: options.campaignId,
      className,
      hitPointMax,
      level,
      name,
      ownerUserId: options.ownerUserId,
      species,
      subclassName: parseFormString(body.subclassName) || null,
    },
  };
}

function membersWithDisplayNames(dependencies: AppDependencies, campaignId: string) {
  return dependencies.campaignRepository.listMembers(campaignId).map((member) => ({
    ...member,
    displayName: dependencies.authRepository.findUserById(member.userId)?.displayName ?? member.userId,
  }));
}

function campaignFactionsForSheet(dependencies: AppDependencies, characterId: string) {
  const access = dependencies.characterRepository.getAccessContext(characterId);
  if (!access) return [];

  return dependencies.campaignContentRepository.listFactionsForCampaign(access.campaignId);
}

function parseRuleFilters(context: Context): RuleSearchFilters {
  const entityType = parseRuleEntityType(context.req.query("type") ?? "");
  const level = Number(context.req.query("level") ?? NaN);
  const equipmentCategory = parseFormString(context.req.query("equipment"));
  const query = parseFormString(context.req.query("q"));
  const spellLevel = Number.isInteger(level) && (!entityType || entityType === "spell")
    ? level
    : undefined;
  const normalisedEquipmentCategory = equipmentCategory && (!entityType || entityType === "equipment")
    ? equipmentCategory
    : "";

  return {
    ...(entityType ? { entityType } : {}),
    ...(normalisedEquipmentCategory ? { equipmentCategory: normalisedEquipmentCategory } : {}),
    ...(spellLevel !== undefined ? { spellLevel } : {}),
    ...(query ? { query } : {}),
  };
}

function parseRuleEntityType(value: string): RuleEntityType | null {
  const supported: RuleEntityType[] = [
    "action",
    "background",
    "class",
    "class_feature",
    "condition",
    "core_rule",
    "equipment",
    "feat",
    "infusion",
    "proficiency",
    "sense",
    "species",
    "species_trait",
    "subclass",
    "subclass_feature",
    "spell",
  ];

  return supported.includes(value as RuleEntityType) ? value as RuleEntityType : null;
}

function renderSheetTabPanel(
  context: Context,
  dependencies: AppDependencies,
  sheet: NonNullable<ReturnType<CharacterRepository["getSheetById"]>>,
  viewerRole: UserRole,
  tabId: Parameters<typeof SheetTabPanel>[0]["tabId"],
) {
  return context.html(
    <SheetTabPanel
      backgroundEntries={dependencies.characterRepository.listBackgroundEntries(sheet.id)}
      campaignFactions={campaignFactionsForSheet(dependencies, sheet.id)}
      equipment={dependencies.characterRepository.listEquipment(sheet.id)}
      factionChoice={dependencies.campaignContentRepository.getCharacterFactionChoice(sheet.id)}
      notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, viewerRole)}
      resources={dependencies.characterRepository.listResources(sheet.id)}
      ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
      sheet={sheet}
      tabId={tabId}
    />,
  );
}

async function updateSheetRow(
  context: Context,
  dependencies: AppDependencies,
  tabId: Parameters<typeof SheetTabPanel>[0]["tabId"],
  update: (
    sheet: NonNullable<ReturnType<CharacterRepository["getSheetById"]>>,
    body: Awaited<ReturnType<Context["req"]["parseBody"]>>,
  ) => unknown,
) {
  const session = dependencies.sessionService.readSession(context.req.header("cookie"));
  if (!session) return context.redirect("/login", 303);

  const characterRef = context.req.param("characterRef");
  if (!characterRef) return context.text("Not found", 404);

  const sheet =
    dependencies.characterRepository.getSheetBySlug(characterRef) ??
    dependencies.characterRepository.getSheetById(characterRef);
  if (!sheet) return context.text("Not found", 404);

  const guard = requireSheetAccess({
    campaignRepository: dependencies.campaignRepository,
    characterId: sheet.id,
    characterRepository: dependencies.characterRepository,
    permission: "write",
    session,
  });
  if (!guard.ok) {
    if (guard.reason === "unauthenticated") return context.redirect("/login", 303);
    if (guard.reason === "not_found") return context.text("Not found", 404);

    return context.text("Forbidden", 403);
  }

  const body = await context.req.parseBody();
  const updated = await update(sheet, body);
  if (updated === false) return context.text("Invalid sheet update", 400);

  const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
  if (!updated || !updatedSheet) return context.text("Not found", 404);

  return renderSheetTabPanel(context, dependencies, updatedSheet, session.user.role, tabId);
}

function parseSheetSummaryForm(
  body: Awaited<ReturnType<Context["req"]["parseBody"]>>,
  sheet: NonNullable<ReturnType<CharacterRepository["getSheetById"]>>,
) {
  const name = parseFormText(body.name);
  const species = parseFormText(body.species);
  const background = parseFormText(body.background);
  const className = parseFormText(body.className);
  const level = parseFormNumber(body.level);
  const hitPointMax = parseFormNumber(body.hitPointMax);
  const initiative = parseFormNumber(body.initiative);
  const speedFeet = parseFormNumber(body.speedFeet);
  const proficiencyBonus = parseFormNumber(body.proficiencyBonus);

  if (
    !name ||
    !species ||
    !background ||
    !className ||
    level === null ||
    hitPointMax === null ||
    initiative === null ||
    speedFeet === null ||
    proficiencyBonus === null
  ) {
    return { ok: false as const, message: "Missing sheet fields" };
  }
  if (level < 1 || hitPointMax < 1 || speedFeet < 0 || proficiencyBonus < 0) {
    return { ok: false as const, message: "Invalid sheet values" };
  }

  return {
    ok: true as const,
    value: {
      background,
      className,
      hitPointMax,
      initiative,
      level,
      name,
      proficiencyBonus,
      speedFeet,
      species,
      subclassName: parseFormString(body.subclassName) ?? sheet.classes[0]?.subclassName ?? null,
    },
  };
}

function isAbilityName(value: string): value is AbilityName {
  return (
    value === "charisma" ||
    value === "constitution" ||
    value === "dexterity" ||
    value === "intelligence" ||
    value === "strength" ||
    value === "wisdom"
  );
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

function parseNoteVisibility(value: unknown) {
  return value === "player" || value === "game_master" ? value : null;
}

function parseCampaignSessionForm(
  body: Awaited<ReturnType<Context["req"]["parseBody"]>>,
): {
  ok: true;
  value: {
    body: string;
    sessionDate: string | null;
    summary: string;
    title: string;
    visibility: CampaignContentVisibility;
  };
} | { ok: false; message: string } {
  const title = parseFormText(body.title);
  const sessionDate = parseFormString(body.sessionDate);
  const summary = parseFormString(body.summary);
  const textBody = parseFormString(body.body);
  const visibility = parseNoteVisibility(body.visibility);
  if (!title || summary === null || textBody === null || !visibility) {
    return { ok: false, message: "Invalid session" };
  }

  return {
    ok: true,
    value: {
      body: textBody,
      sessionDate: sessionDate || null,
      summary,
      title,
      visibility,
    },
  };
}

function parseCampaignWikiForm(
  body: Awaited<ReturnType<Context["req"]["parseBody"]>>,
): {
  ok: true;
  value: {
    bodyMarkdown: string;
    coverImageAssetId: string | null;
    pageType: WikiPageType;
    sourcePath: string | null;
    sourceTitle: string | null;
    tags: string[];
    title: string;
    visibility: CampaignContentVisibility;
  };
} | { ok: false; message: string } {
  const title = parseFormText(body.title);
  const bodyMarkdown = parseFormText(body.bodyMarkdown);
  const pageType = parseCampaignWikiPageType(body.pageType);
  const visibility = parseNoteVisibility(body.visibility);
  if (!title || !bodyMarkdown || !pageType || !visibility) {
    return { ok: false, message: "Invalid wiki page" };
  }

  return {
    ok: true,
    value: {
      bodyMarkdown: normaliseGoogleDocsMarkdown(bodyMarkdown),
      coverImageAssetId: parseFormString(body.coverImageAssetId) || null,
      pageType,
      sourcePath: null,
      sourceTitle: parseFormString(body.sourceTitle) || null,
      tags: parseTags(body.tags),
      title,
      visibility,
    },
  };
}

async function parseCampaignAssetForm(
  body: Awaited<ReturnType<Context["req"]["parseBody"]>>,
  campaignSlug: string,
): Promise<{
  ok: true;
  value: {
    altText: string;
    byteSize: number;
    caption: string;
    height: number | null;
    mimeType: string;
    storageKey: string;
    title: string;
    visibility: CampaignContentVisibility;
    width: number | null;
  };
} | { ok: false; message: string }> {
  const title = parseFormText(body.title);
  const altText = parseFormText(body.altText);
  const caption = parseFormString(body.caption);
  const visibility = parseNoteVisibility(body.visibility);
  const image = body.image;
  if (!title || !altText || caption === null || !visibility || !(image instanceof File)) {
    return { ok: false, message: "Invalid image asset" };
  }
  const extension = imageExtensionForMimeType(image.type);
  if (!extension) return { ok: false, message: "Unsupported image type" };

  const bytes = new Uint8Array(await image.arrayBuffer());
  const storageKey = `campaigns/${campaignSlug}/${crypto.randomUUID()}.${extension}`;
  const storagePath = `${assetStorageRoot()}/${storageKey}`;
  await mkdir(dirname(storagePath), { recursive: true });
  await Bun.write(storagePath, bytes);

  return {
    ok: true,
    value: {
      altText,
      byteSize: bytes.byteLength,
      caption,
      height: parsePositiveInteger(body.height),
      mimeType: image.type,
      storageKey,
      title,
      visibility,
      width: parsePositiveInteger(body.width),
    },
  };
}

function parseCampaignWikiPageType(value: unknown) {
  return isCampaignWikiPageType(value) ? value : null;
}

function parseTags(value: unknown) {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parsePositiveInteger(value: unknown) {
  const parsed = parseFormNumber(value);

  return parsed && parsed > 0 ? Math.trunc(parsed) : null;
}

function imageExtensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";

  return null;
}

function assetStorageRoot() {
  return process.env.CHARACTER_SHEET_ASSET_ROOT || "data/assets";
}

function missingSeedAssetSvg(title: string) {
  const safeTitle = escapeSvgText(title);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-label="${safeTitle}">
  <rect width="960" height="540" fill="#f5f1e8"/>
  <rect x="32" y="32" width="896" height="476" rx="18" fill="none" stroke="#8f6f3f" stroke-width="6"/>
  <text x="480" y="250" fill="#3b3126" font-family="Georgia, serif" font-size="42" font-weight="700" text-anchor="middle">${safeTitle}</text>
  <text x="480" y="310" fill="#6d5a43" font-family="system-ui, sans-serif" font-size="24" text-anchor="middle">Seeded campaign image unavailable locally</text>
</svg>`;
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
