import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
  FormValues,
  HttpResponder,
  routeParam,
} from "@macavitymadcap/hyper-dank-transport";
import { Hono, type Context } from "hono";
import { assetStorageRoot, verifyAssetStorageRoot } from "./assets";
import {
  convertCampaignImportContent,
  normaliseGoogleDocsReference,
  prepareGoogleDocsManualImport,
} from "./campaigns/imports";
import {
  AuthService,
  requireCampaignAccess,
  requireRole,
  requireSheetAccess,
  SessionService,
  userHasAccessRole,
} from "./auth";
import { isCampaignWikiPageType, normaliseGoogleDocsMarkdown } from "./campaigns/wiki";
import { isRestType, planRestResourceUpdates } from "./characters/rests";
import { AdminPage } from "./components/pages/Admin";
import {
  CampaignImageDetailPage,
  CampaignImageLibraryPage,
  CampaignImportPage,
  CampaignImportPreviewPage,
  CampaignPage,
  CampaignPlayerPreviewPage,
  CampaignPrepPage,
  CampaignWikiDetailPage,
  GoogleDocsManualImportPage,
  NpcDetailPage,
  NpcListPage,
} from "./components/pages/Campaign";
import { CharactersPage } from "./components/pages/Characters";
import { HomePage } from "./components/pages/Home";
import { InviteAcceptPage } from "./components/pages/InviteAccept";
import { LoginPage } from "./components/pages/Login";
import { LocalPlayPage } from "./components/pages/LocalPlay";
import { LogoutPage } from "./components/pages/Logout";
import { PasswordResetPage } from "./components/pages/PasswordReset";
import { RulesDetailPage, RulesPage } from "./components/pages/Rules";
import { SheetPage } from "./components/pages/Sheet";
import {
  AbilityEditRow,
  AbilityReadRow,
  ArmourEditCard,
  ArmourReadCard,
  DefenceEditCard,
  DefenceReadCard,
  SenseEditCard,
  SenseReadCard,
} from "./components/organisms/CoreTab/CoreTab";
import { SheetHeader, SheetHeaderEdit } from "./components/organisms/SheetHeader";
import {
  ProficiencyEditItem,
  ProficiencyReadItem,
  SkillEditRow,
  SkillReadRow,
} from "./components/organisms/SkillsTrainingTab/SkillsTrainingTab";
import {
  BackgroundEntryEditItem,
  BackgroundEntryReadItem,
  EquipmentEditItem,
  EquipmentReadItem,
  SheetTabPanel,
} from "./components/organisms/SheetTabPanel";
import { SheetTabWorkspace } from "./components/organisms/SheetTabWorkspace";
import { isSheetTabId } from "./components/organisms/SheetTabs";
import type {
  AuthRepository,
  AbilityName,
  AuthUser,
  CampaignContentRepository,
  CampaignContentVisibility,
  CampaignImportProvider,
  CampaignImportSourceFormat,
  CampaignImportTargetType,
  CampaignRepository,
  CharacterBackgroundCategory,
  CharacterProficiency,
  CharacterRepository,
  CreateCharacterInput,
  NotesRepository,
  NpcVisibility,
  RuleSummary,
  RuleEntityType,
  RuleEntityTypeCount,
  RuleSearchFilters,
  RulesRepository,
  UserRole,
  WikiPageType,
} from "./db";
import type { AccountDeliveryConfig } from "./runtime";

export interface AppDependencies {
  accountDelivery?: AccountDeliveryConfig;
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
  const responder = new HttpResponder();
  const accountDelivery = dependencies.accountDelivery ?? { mode: "operator" as const };

  app.get("/healthz", (context) => context.json({ ok: true }));

  app.get("/readyz", async (context) => {
    const checks = {
      assets: false,
      database: false,
    };

    try {
      dependencies.authRepository.countActiveAdmins();
      checks.database = true;
      await verifyAssetStorageRoot();
      checks.assets = true;
    } catch {
      return context.json({ checks, ok: false }, 503);
    }

    return context.json({ checks, ok: true });
  });

  const readSession = (cookieHeader: string | undefined) =>
    dependencies.sessionService.readSession(cookieHeader);

  const defaultRouteForUser = (user: AuthUser) => {
    if (userHasAccessRole(user, "admin")) return "/admin";
    if (userHasAccessRole(user, "game_master")) return "/campaigns/rovnost-shadows";

    return "/characters";
  };

  const absoluteUrl = (context: Context, path: string) =>
    new URL(path, accountDelivery.publicBaseUrl ?? context.req.url).toString();

  const wantsJson = (context: Context) =>
    context.req.header("accept")?.includes("application/json") ?? false;

  const getSheetByRef = (characterRef: string) =>
    dependencies.characterRepository.getSheetBySlug(characterRef) ??
    dependencies.characterRepository.getSheetById(characterRef);

  const campaignViewerRole = (campaignId: string, userId: string): "game_master" | "player" | null =>
    dependencies.campaignRepository
      .listMembers(campaignId)
      .find((member) => member.userId === userId)?.role ?? null;

  const campaignAssetFileStatus = async (asset: { byteSize: number; storageKey: string }) => {
    const file = Bun.file(`${assetStorageRoot()}/${asset.storageKey}`);
    if (!(await file.exists())) return "fallback" as const;
    if (asset.byteSize > 1024 && file.size < 1024) return "fallback" as const;

    return "available" as const;
  };

  const sheetViewerRole = (
    characterId: string,
    session: NonNullable<ReturnType<typeof readSession>>,
  ): UserRole => {
    const access = dependencies.characterRepository.getAccessContext(characterId);
    if (access?.ownerUserId === session.user.id) return "player";

    return access ? campaignViewerRole(access.campaignId, session.user.id) ?? session.user.role : session.user.role;
  };

  const guardResponse = (context: Context, result: ReturnType<typeof requireRole>) => {
    if (result.ok) return null;
    if (result.reason === "unauthenticated") return context.redirect("/login", 303);
    if (result.reason === "not_found") return context.text("Not found", 404);

    return context.text("Forbidden", 403);
  };

  const redirectAfterAction = (context: Context, location: string) =>
    responder.redirectAfterAction(context, location);

  app.get("/", (context) => {
    const session = readSession(context.req.header("cookie"));

    return context.html(<HomePage appName={dependencies.appName} user={session?.user} />);
  });

  app.get("/login", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (session) return context.redirect(defaultRouteForUser(session.user), 303);

    return context.html(<LoginPage appName={dependencies.appName} />);
  });

  app.get("/local/characters", (context) =>
    context.html(<LocalPlayPage appName={dependencies.appName} kind="characters" />),
  );

  app.get("/local/campaigns", (context) =>
    context.html(<LocalPlayPage appName={dependencies.appName} kind="campaigns" />),
  );

  app.get("/rules", (context) => {
    const session = readSession(context.req.header("cookie"));
    const filters = parseRuleFilters(context);
    const accessFilters = ruleAccessFilters(dependencies, session);
    const rulesFilters = { ...filters, ...accessFilters };
    const accessibleRules = dependencies.rulesRepository.listRules(accessFilters).filter(isBrowseableRule);
    const srdCounts = dependencies.rulesRepository.listRuleEntityTypes({ contentCategory: "srd" });
    const srdRules = dependencies.rulesRepository.listRules({ contentCategory: "srd" });
    const importState = createSrdImportState(srdCounts, srdRules);

    return context.html(
      <RulesPage
        appName={dependencies.appName}
        counts={createRuleEntityTypeCounts(accessibleRules)}
        filters={filters}
        importState={importState}
        rules={dependencies.rulesRepository.listRules(rulesFilters).filter(isBrowseableRule)}
        user={session?.user}
      />,
    );
  });

  app.get("/rules/:entityType/:slug", (context) => {
    const session = readSession(context.req.header("cookie"));

    const entityType = parseRuleEntityType(routeParam(context, "entityType"));
    if (!entityType) return context.text("Not found", 404);

    const accessFilters = ruleAccessFilters(dependencies, session);
    const rule = dependencies.rulesRepository.getRuleDetail(entityType, routeParam(context, "slug"), accessFilters);
    if (!rule) return context.text("Not found", 404);
    if (rule.contentCategory === "srd" && !isBrowseableRule(rule)) return context.text("Not found", 404);
    const srdCounts = dependencies.rulesRepository.listRuleEntityTypes({ contentCategory: "srd" });
    const srdRules = dependencies.rulesRepository.listRules({ contentCategory: "srd" });
    const accessibleRules = dependencies.rulesRepository.listRules(accessFilters).filter(isBrowseableRule);

    return context.html(
      <RulesDetailPage
        appName={dependencies.appName}
        counts={createRuleEntityTypeCounts(accessibleRules)}
        filters={parseRuleFilters(context)}
        importState={createSrdImportState(srdCounts, srdRules)}
        rule={rule}
        user={session?.user}
      />,
    );
  });

  app.get("/rules/:entityType", (context) => {
    const entityType = parseRuleEntityType(routeParam(context, "entityType"));
    if (!entityType) return context.text("Not found", 404);

    const query = new URLSearchParams(context.req.query()).toString();

    return context.redirect(`/rules?type=${entityType}${query ? `&${query}` : ""}`, 303);
  });

  app.post("/login", async (context) => {
    const form = await FormValues.from(context);
    const email = form.string("email");
    const password = form.string("password");
    const user = dependencies.authService.verifyCredentials(email, password);

    if (!user) {
      context.status(401);
      return context.html(
        <LoginPage appName={dependencies.appName} error="Invalid username or password." />,
      );
    }

    const session = dependencies.sessionService.createSession(user.id);
    context.header("Set-Cookie", session.cookie);

    return redirectAfterAction(context, defaultRouteForUser(user));
  });

  app.get("/logout", (context) => {
    const session = readSession(context.req.header("cookie"));

    return context.html(<LogoutPage appName={dependencies.appName} user={session?.user} />);
  });

  app.post("/logout", (context) => {
    dependencies.sessionService.logout(context.req.header("cookie"));
    context.header("Set-Cookie", dependencies.sessionService.clearCookie());

    return redirectAfterAction(context, "/");
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
        accountDelivery={accountDelivery}
        handoff={parseAdminHandoff(context, accountDelivery)}
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
      routeParam(context, "campaignSlug"),
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
    const viewerRole = campaignViewerRole(campaign.id, session.user.id);
    if (!viewerRole) return context.text("Forbidden", 403);

    return context.html(
      <CampaignPage
        appName={dependencies.appName}
        campaign={campaign}
        gameMasterDisplayName={
          dependencies.authRepository.findUserById(campaign.gmUserId)?.displayName ??
          campaign.gmUserId
        }
        imageAssets={dependencies.campaignContentRepository.listImageAssetsForCampaign(campaign.id, viewerRole)}
        members={dependencies.campaignRepository.listMembers(campaign.id)}
        ruleSources={dependencies.rulesRepository.listRuleSources({ campaignIds: [campaign.id] })}
        sessions={dependencies.campaignContentRepository.listSessionsForCampaign(campaign.id, viewerRole)}
        user={session.user}
        viewerRole={viewerRole}
        wikiPages={dependencies.campaignContentRepository.listWikiPagesForCampaign(campaign.id, viewerRole)}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/prep", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const npcs = dependencies.campaignContentRepository.listNpcDossiersForCampaign(
      campaign.id,
      "game_master",
    );

    return context.html(
      <CampaignPrepPage
        appName={dependencies.appName}
        campaign={campaign}
        npcCount={npcs.length}
        privateNpcCount={npcs.filter((npc) => npc.visibility === "private").length}
        user={session.user}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/preview/player", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const members = membersWithDisplayNames(dependencies, campaign.id);
    const characters = dependencies.characterRepository.listCharactersForCampaign(campaign.id);
    const previewPlayer = members.find((member) =>
      member.role === "player" && characters.some((character) => character.ownerUserId === member.userId)
    ) ?? members.find((member) => member.role === "player");
    const playerWikiPages = dependencies.campaignContentRepository.listWikiPagesForCampaign(campaign.id, "player");
    const allWikiPages = dependencies.campaignContentRepository.listWikiPagesForCampaign(campaign.id, "game_master");
    const playerSessions = dependencies.campaignContentRepository.listSessionsForCampaign(campaign.id, "player");
    const allSessions = dependencies.campaignContentRepository.listSessionsForCampaign(campaign.id, "game_master");
    const playerImageAssets = dependencies.campaignContentRepository.listImageAssetsForCampaign(campaign.id, "player");
    const allImageAssets = dependencies.campaignContentRepository.listImageAssetsForCampaign(campaign.id, "game_master");
    const playerNpcs = dependencies.campaignContentRepository.listNpcSummariesForCampaign(
      campaign.id,
      "player",
      previewPlayer?.userId,
    );
    const allNpcs = dependencies.campaignContentRepository.listNpcDossiersForCampaign(campaign.id, "game_master");
    const notesByCharacter = characters
      .map((character) => ({
        character,
        notes: dependencies.notesRepository.listNotesForCharacter(character.id, "player"),
      }))
      .filter(({ notes }) => notes.length > 0);
    const allNoteCount = characters.reduce(
      (count, character) => count + dependencies.notesRepository.listNotesForCharacter(character.id, "game_master").length,
      0,
    );
    const playerNoteCount = notesByCharacter.reduce((count, item) => count + item.notes.length, 0);

    return context.html(
      <CampaignPlayerPreviewPage
        appName={dependencies.appName}
        auditItems={[
          {
            hidden: allWikiPages.length - playerWikiPages.length,
            href: `/campaigns/${campaign.slug}#campaign-wiki-heading`,
            label: "Wiki pages",
            visible: playerWikiPages.length,
          },
          {
            hidden: allSessions.length - playerSessions.length,
            href: `/campaigns/${campaign.slug}#campaign-sessions-heading`,
            label: "Sessions",
            visible: playerSessions.length,
          },
          {
            hidden: allNpcs.length - playerNpcs.length,
            href: `/campaigns/${campaign.slug}/npcs`,
            label: "NPCs",
            visible: playerNpcs.length,
          },
          {
            hidden: allImageAssets.length - playerImageAssets.length,
            href: `/campaigns/${campaign.slug}/images`,
            label: "Images",
            visible: playerImageAssets.length,
          },
          {
            hidden: allNoteCount - playerNoteCount,
            href: `/campaigns/${campaign.slug}/characters`,
            label: "Character notes",
            visible: playerNoteCount,
          },
        ]}
        campaign={campaign}
        imageAssets={playerImageAssets}
        notesByCharacter={notesByCharacter}
        npcs={playerNpcs}
        previewDisplayName={previewPlayer?.displayName ?? null}
        sessions={playerSessions}
        user={session.user}
        wikiPages={playerWikiPages}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/npcs", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
    const viewerRole = campaignViewerRole(campaign.id, session.user.id);
    if (!viewerRole) return context.text("Forbidden", 403);

    return context.html(
      <NpcListPage
        appName={dependencies.appName}
        campaign={campaign}
        imageAssets={dependencies.campaignContentRepository.listImageAssetsForCampaign(campaign.id, viewerRole)}
        npcs={viewerRole === "game_master"
          ? dependencies.campaignContentRepository.listNpcDossiersForCampaign(campaign.id, viewerRole)
          : dependencies.campaignContentRepository.listNpcSummariesForCampaign(campaign.id, viewerRole, session.user.id)}
        playerMembers={membersWithDisplayNames(dependencies, campaign.id).filter((member) => member.role === "player")}
        rules={statBlockRulesForCampaign(dependencies, campaign.id)}
        user={session.user}
        viewerRole={viewerRole}
        wikiPages={dependencies.campaignContentRepository.listWikiPagesForCampaign(campaign.id, viewerRole)}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/npcs/:npcSlug", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
    const viewerRole = campaignViewerRole(campaign.id, session.user.id);
    if (!viewerRole) return context.text("Forbidden", 403);

    const npc = viewerRole === "game_master"
      ? dependencies.campaignContentRepository.getNpcDossierBySlug(campaign.id, routeParam(context, "npcSlug"), viewerRole)
      : dependencies.campaignContentRepository.getNpcSummaryBySlug(campaign.id, routeParam(context, "npcSlug"), viewerRole, session.user.id);
    if (!npc) return context.text("Not found", 404);

    return context.html(
      <NpcDetailPage
        appName={dependencies.appName}
        campaign={campaign}
        imageAssets={dependencies.campaignContentRepository.listImageAssetsForCampaign(campaign.id, viewerRole)}
        npc={npc}
        playerMembers={membersWithDisplayNames(dependencies, campaign.id).filter((member) => member.role === "player")}
        rules={statBlockRulesForCampaign(dependencies, campaign.id)}
        user={session.user}
        viewerRole={viewerRole}
        wikiPages={dependencies.campaignContentRepository.listWikiPagesForCampaign(campaign.id, viewerRole)}
      />,
    );
  });

  app.post("/campaigns/:campaignSlug/npcs", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const parsed = parseCampaignNpcForm(await context.req.parseBody({ all: true }));
    if (!parsed.ok) return context.text(parsed.message, 400);

    try {
      const npc = dependencies.campaignContentRepository.createNpcDossier({
        ...parsed.value,
        campaignId: campaign.id,
      });

      return redirectAfterAction(context, `/campaigns/${campaign.slug}/npcs/${npc.slug}`);
    } catch {
      return context.text("Invalid NPC links", 400);
    }
  });

  app.post("/campaigns/:campaignSlug/npcs/:npcId", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const parsed = parseCampaignNpcForm(await context.req.parseBody({ all: true }));
    if (!parsed.ok) return context.text(parsed.message, 400);

    const npc = dependencies.campaignContentRepository.updateNpcDossier(
      campaign.id,
      routeParam(context, "npcId"),
      parsed.value,
    );
    if (!npc) return context.text("Invalid NPC", 400);

    return redirectAfterAction(context, `/campaigns/${campaign.slug}/npcs/${npc.slug}`);
  });

  app.post("/campaigns/:campaignSlug/npcs/:npcId/reveal", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const form = await FormValues.from(context);
    const visibility = parseNpcVisibility(form.string("visibility"));
    if (!visibility) return context.text("Invalid NPC visibility", 400);

    const npc = dependencies.campaignContentRepository.revealNpcDossier(
      campaign.id,
      routeParam(context, "npcId"),
      visibility,
    );
    if (!npc) return context.text("Not found", 404);

    return redirectAfterAction(context, `/campaigns/${campaign.slug}/npcs/${npc.slug}`);
  });

  app.get("/campaigns/:campaignSlug/images", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
    const viewerRole = campaignViewerRole(campaign.id, session.user.id);
    if (!viewerRole) return context.text("Forbidden", 403);

    const assets = await Promise.all(
      dependencies.campaignContentRepository.listImageAssetsForCampaign(campaign.id, viewerRole)
        .map(async (asset) => ({
          ...asset,
          fileStatus: await campaignAssetFileStatus(asset),
          usageCount: viewerRole === "game_master"
            ? dependencies.campaignContentRepository.listImageAssetUsages(campaign.id, campaign.slug, asset.id).length
            : 0,
        })),
    );

    return context.html(
      <CampaignImageLibraryPage
        appName={dependencies.appName}
        campaign={campaign}
        imageAssets={assets}
        user={session.user}
        viewerRole={viewerRole}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/images/:assetId", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
    const viewerRole = campaignViewerRole(campaign.id, session.user.id);
    if (!viewerRole) return context.text("Forbidden", 403);

    const asset = dependencies.campaignContentRepository.getImageAssetById(
      campaign.id,
      routeParam(context, "assetId"),
      viewerRole,
    );
    if (!asset) return context.text("Not found", 404);

    return context.html(
      <CampaignImageDetailPage
        appName={dependencies.appName}
        asset={{
          ...asset,
          fileStatus: await campaignAssetFileStatus(asset),
          usages: viewerRole === "game_master"
            ? dependencies.campaignContentRepository.listImageAssetUsages(campaign.id, campaign.slug, asset.id)
            : [],
        }}
        campaign={campaign}
        user={session.user}
        viewerRole={viewerRole}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/imports", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
      <CampaignImportPage
        appName={dependencies.appName}
        campaign={campaign}
        imports={dependencies.campaignContentRepository.listContentImportsForCampaign(campaign.id)}
        user={session.user}
      />,
    );
  });

  app.get("/campaigns/:campaignSlug/imports/google-docs", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
      <GoogleDocsManualImportPage
        appName={dependencies.appName}
        campaign={campaign}
        user={session.user}
      />,
    );
  });

  app.post("/campaigns/:campaignSlug/imports/preview", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const parsed = parseCampaignImportPreviewForm(await FormValues.from(context));
    if (!parsed.ok) return context.text(parsed.message, 400);
    const preview = convertCampaignImportContent(parsed.value);
    const sourceTitle = parsed.value.sourceTitle || preview.detectedTitle;

    return context.html(
      <CampaignImportPreviewPage
        appName={dependencies.appName}
        campaign={campaign}
        preview={{
          ...parsed.value,
          ...preview,
          sourceTitle,
        }}
        user={session.user}
      />,
    );
  });

  app.post("/campaigns/:campaignSlug/imports/save", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const parsed = parseCampaignImportSaveForm(await FormValues.from(context));
    if (!parsed.ok) return context.text(parsed.message, 400);
    const targetRecordId = saveCampaignImportTarget(
      dependencies.campaignContentRepository,
      campaign.id,
      session.user.id,
      parsed.value,
    );
    dependencies.campaignContentRepository.createContentImport({
      campaignId: campaign.id,
      conversionNotes: parsed.value.conversionNotes,
      convertedMarkdown: parsed.value.convertedMarkdown,
      importedByUserId: session.user.id,
      provider: parsed.value.provider,
      sourceFormat: parsed.value.sourceFormat,
      sourceReference: parsed.value.sourceReference,
      sourceTitle: parsed.value.sourceTitle,
      targetRecordId,
      targetType: parsed.value.targetType,
      visibility: parsed.value.visibility,
    });

    return redirectAfterAction(context, campaignImportRedirect(campaign.slug, parsed.value.targetType, targetRecordId));
  });

  app.get("/campaigns/:campaignSlug/wiki/:wikiSlug", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
    const viewerRole = campaignViewerRole(campaign.id, session.user.id);
    if (!viewerRole) return context.text("Forbidden", 403);

    const page = dependencies.campaignContentRepository.getWikiPageBySlug(
      campaign.id,
      routeParam(context, "wikiSlug"),
      viewerRole,
    );
    if (!page) return context.text("Not found", 404);

    const cover = page.coverImageAssetId
      ? dependencies.campaignContentRepository.getImageAssetById(
          campaign.id,
          page.coverImageAssetId,
          viewerRole,
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
          viewerRole,
        )}
        inlineAssets={dependencies.campaignContentRepository.listImageAssetsForWikiPage(
          campaign.id,
          page.id,
          "inline",
          viewerRole,
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
      routeParam(context, "campaignSlug"),
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
    const viewerRole = campaignViewerRole(campaign.id, session.user.id);
    if (!viewerRole) return context.text("Forbidden", 403);

    const asset = dependencies.campaignContentRepository.getImageAssetById(
      campaign.id,
      routeParam(context, "assetId"),
      viewerRole,
    );
    if (!asset) return context.text("Not found", 404);

    if (await campaignAssetFileStatus(asset) === "fallback") {
      return new Response(missingSeedAssetSvg(asset.title), {
        headers: {
          "Cache-Control": "private, max-age=300",
          "Content-Type": "image/svg+xml",
        },
      });
    }
    const file = Bun.file(`${assetStorageRoot()}/${asset.storageKey}`);

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
      routeParam(context, "campaignSlug"),
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

    return redirectAfterAction(context, `/campaigns/${campaign.slug}`);
  });

  app.post("/campaigns/:campaignSlug/assets", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const asset = dependencies.campaignContentRepository.createImageAsset({
      ...parsed.value,
      campaignId: campaign.id,
    });

    return redirectAfterAction(context, `/campaigns/${campaign.slug}/images/${asset.id}`);
  });

  app.post("/campaigns/:campaignSlug/sessions", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const parsed = parseCampaignSessionForm(await FormValues.from(context));
    if (!parsed.ok) return context.text(parsed.message, 400);

    dependencies.campaignContentRepository.createSession({
      ...parsed.value,
      campaignId: campaign.id,
      createdByUserId: session.user.id,
    });

    return redirectAfterAction(context, `/campaigns/${campaign.slug}`);
  });

  app.post("/campaigns/:campaignSlug/sessions/:sessionId", async (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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

    const parsed = parseCampaignSessionForm(await FormValues.from(context));
    if (!parsed.ok) return context.text(parsed.message, 400);

    const updated = dependencies.campaignContentRepository.updateSession(
      campaign.id,
      routeParam(context, "sessionId"),
      parsed.value,
    );
    if (!updated) return context.text("Not found", 404);

    return redirectAfterAction(context, `/campaigns/${campaign.slug}`);
  });

  app.post("/campaigns/:campaignSlug/sessions/:sessionId/delete", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
      routeParam(context, "sessionId"),
    );
    if (!deleted) return context.text("Not found", 404);

    return redirectAfterAction(context, `/campaigns/${campaign.slug}`);
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

    return redirectAfterAction(context, `/sheet/${sheet.slug}`);
  });

  app.get("/campaigns/:campaignSlug/characters", (context) => {
    const session = readSession(context.req.header("cookie"));
    if (!session) return context.redirect("/login", 303);

    const campaign = dependencies.campaignRepository.getCampaignBySlug(
      routeParam(context, "campaignSlug"),
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
      routeParam(context, "campaignSlug"),
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
      routeParam(context, "campaignSlug"),
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

    const form = await FormValues.from(context);
    const ownerUserId = parseFormText(form.string("ownerUserId"));
    const owner = ownerUserId
      ? dependencies.campaignRepository
          .listMembers(campaign.id)
          .find((member) => member.userId === ownerUserId && member.role === "player")
      : null;
    if (!owner) return context.text("Invalid owner", 400);

    const input = await parseCharacterCreateForm(context, {
      form,
      campaignId: campaign.id,
      ownerUserId: owner.userId,
    });
    if (!input.ok) return context.text(input.message, 400);

    const sheet = dependencies.characterRepository.createCharacter(input.value);

    return redirectAfterAction(context, `/sheet/${sheet.slug}`);
  });

  app.post("/admin/invites", async (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;
    if (!session) return context.redirect("/login", 303);

    const form = await FormValues.from(context);
    const email = form.string("email");
    const role = form.string("role");
    if (!email.trim()) return context.text("Invalid username", 400);
    if (!isUserRole(role)) return context.text("Invalid role", 400);

    const invite = dependencies.authService.createInvite({
      createdByUserId: session.user.id,
      email,
      role,
    });

    const inviteUrl = absoluteUrl(context, `/invites/${invite.token}`);
    if (wantsJson(context)) {
      return context.json(
        {
          email: invite.email,
          id: invite.id,
          inviteUrl,
          role: invite.role,
          token: invite.token,
        },
        201,
      );
    }

    return redirectAfterAction(
      context,
      `/admin?handoff=invite&url=${encodeURIComponent(inviteUrl)}&email=${encodeURIComponent(invite.email)}&role=${invite.role}&expires=${encodeURIComponent(invite.expiresAt.toISOString())}`,
    );
  });

  app.post("/admin/users/:userId/status", async (context) => {
    const session = readSession(context.req.header("cookie"));
    const guard = requireRole(session, ["admin"]);
    const guarded = guardResponse(context, guard);
    if (guarded) return guarded;

    const form = await FormValues.from(context);
    const status = form.string("status");
    if (status !== "active" && status !== "disabled") return context.text("Invalid status", 400);

    const targetUser = dependencies.authRepository.findUserById(routeParam(context, "userId"));
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

    return redirectAfterAction(context, "/admin");
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

    const resetUrl = absoluteUrl(context, `/password-reset/${reset.token}`);
    const targetUser = dependencies.authRepository.findUserById(reset.userId);
    if (wantsJson(context)) {
      return context.json(
        {
          id: reset.id,
          resetUrl,
          token: reset.token,
          userId: reset.userId,
        },
        201,
      );
    }

    return context.redirect(
      `/admin?handoff=password_reset&url=${encodeURIComponent(resetUrl)}&user=${encodeURIComponent(targetUser?.displayName ?? reset.userId)}&expires=${encodeURIComponent(reset.expiresAt.toISOString())}`,
      303,
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
    const passwordConfirmation = String(body.passwordConfirmation ?? "");
    if (!displayName.trim() || !password) return context.text("Missing fields", 400);
    if (password !== passwordConfirmation) {
      const invite = dependencies.authService.readInvite(context.req.param("token"));
      if (!invite) return context.text("Not found", 404);
      context.status(400);
      return context.html(
        <InviteAcceptPage
          appName={dependencies.appName}
          email={invite.email}
          error="Passwords do not match."
          role={invite.role}
          token={context.req.param("token")}
        />,
      );
    }

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
    const passwordConfirmation = String(body.passwordConfirmation ?? "");
    if (!password) return context.text("Missing password", 400);
    if (password !== passwordConfirmation) {
      const reset = dependencies.authService.readPasswordResetToken(context.req.param("token"));
      if (!reset) return context.text("Not found", 404);
      context.status(400);
      return context.html(
        <PasswordResetPage
          appName={dependencies.appName}
          error="Passwords do not match."
          token={context.req.param("token")}
        />,
      );
    }

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
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, sheetViewerRole(sheet.id, session))}
        resources={dependencies.characterRepository.listResources(sheet.id)}
        ruleLinks={dependencies.rulesRepository.listRuleLinksForCharacter(sheet.id)}
        sheet={sheet}
        user={session.user}
      />,
    );
  });

  app.get("/sheet/:characterRef/summary", (context) => {
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

    return context.html(
      <SheetHeader
        resources={dependencies.characterRepository.listResources(sheet.id)}
        sheet={sheet}
      />,
    );
  });

  app.get("/sheet/:characterRef/summary/edit", (context) => {
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

    return context.html(<SheetHeaderEdit sheet={sheet} />);
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
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, sheetViewerRole(sheet.id, session))}
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
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, sheetViewerRole(sheet.id, session))}
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

  app.get("/sheet/:characterRef/abilities/:ability", (context) => {
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

    const abilityName = context.req.param("ability");
    if (!isAbilityName(abilityName)) return context.text("Not found", 404);
    const ability = sheet.abilities.find((candidate) => candidate.ability === abilityName);
    if (!ability) return context.text("Not found", 404);

    return context.html(<AbilityReadRow ability={ability} sheet={sheet} />);
  });

  app.get("/sheet/:characterRef/abilities/:ability/edit", (context) => {
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

    const abilityName = context.req.param("ability");
    if (!isAbilityName(abilityName)) return context.text("Not found", 404);
    const ability = sheet.abilities.find((candidate) => candidate.ability === abilityName);
    if (!ability) return context.text("Not found", 404);

    return context.html(<AbilityEditRow ability={ability} sheet={sheet} />);
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

    const updatedAbility = updatedSheet.abilities.find((candidate) => candidate.ability === ability);
    if (!updatedAbility) return context.text("Not found", 404);

    return context.html(<AbilityReadRow ability={updatedAbility} sheet={updatedSheet} />);
  });

  app.get("/sheet/:characterRef/skills/:skill", (context) => {
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

    const skill = sheet.skills.find((candidate) => candidate.skill === context.req.param("skill"));
    if (!skill) return context.text("Not found", 404);

    return context.html(<SkillReadRow sheet={sheet} skill={skill} />);
  });

  app.get("/sheet/:characterRef/skills/:skill/edit", (context) => {
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

    const skill = sheet.skills.find((candidate) => candidate.skill === context.req.param("skill"));
    if (!skill) return context.text("Not found", 404);

    return context.html(<SkillEditRow sheet={sheet} skill={skill} />);
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

    const updatedSkill = updatedSheet.skills.find((candidate) => candidate.skill === context.req.param("skill"));
    if (!updatedSkill) return context.text("Not found", 404);

    return context.html(<SkillReadRow sheet={updatedSheet} skill={updatedSkill} />);
  });

  app.get("/sheet/:characterRef/senses/:senseId", (context) => {
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

    const sense = sheet.senses.find((candidate) => candidate.id === context.req.param("senseId"));
    if (!sense) return context.text("Not found", 404);

    return context.html(<SenseReadCard sense={sense} sheet={sheet} />);
  });

  app.get("/sheet/:characterRef/senses/:senseId/edit", (context) => {
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

    const sense = sheet.senses.find((candidate) => candidate.id === context.req.param("senseId"));
    if (!sense) return context.text("Not found", 404);

    return context.html(<SenseEditCard sense={sense} sheet={sheet} />);
  });

  app.patch("/sheet/:characterRef/senses/:senseId", async (context) => {
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
    const value = parseFormText(body.value);
    if (!label || !value) return context.text("Invalid sense", 400);

    const sense = dependencies.characterRepository.updateSense(
      sheet.id,
      context.req.param("senseId"),
      { label, value },
    );
    if (!sense) return context.text("Not found", 404);

    return context.html(<SenseReadCard sense={sense} sheet={sheet} />);
  });

  app.get("/sheet/:characterRef/armour/:sourceId", (context) => {
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

    const source = sheet.armourClassBreakdown.find((candidate) => candidate.id === context.req.param("sourceId"));
    if (!source) return context.text("Not found", 404);

    return context.html(<ArmourReadCard sheet={sheet} source={source} />);
  });

  app.get("/sheet/:characterRef/armour/:sourceId/edit", (context) => {
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

    const source = sheet.armourClassBreakdown.find((candidate) => candidate.id === context.req.param("sourceId"));
    if (!source) return context.text("Not found", 404);

    return context.html(<ArmourEditCard sheet={sheet} source={source} />);
  });

  app.patch("/sheet/:characterRef/armour/:sourceId", async (context) => {
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
    const value = parseFormNumber(body.value);
    if (!label || value === null) return context.text("Invalid armour", 400);

    const updatedSheet = dependencies.characterRepository.updateArmourClassSource(
      sheet.id,
      context.req.param("sourceId"),
      { label, notes: parseFormString(body.notes) ?? "", value },
    );
    if (!updatedSheet) return context.text("Not found", 404);

    const source = updatedSheet.armourClassBreakdown.find((candidate) => candidate.id === context.req.param("sourceId"));
    if (!source) return context.text("Not found", 404);

    return context.html(<ArmourReadCard sheet={updatedSheet} source={source} />);
  });

  app.get("/sheet/:characterRef/defences/:defenceId", (context) => {
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

    const defence = sheet.defences.find((candidate) => candidate.id === context.req.param("defenceId"));
    if (!defence) return context.text("Not found", 404);

    return context.html(<DefenceReadCard defence={defence} sheet={sheet} />);
  });

  app.get("/sheet/:characterRef/defences/:defenceId/edit", (context) => {
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

    const defence = sheet.defences.find((candidate) => candidate.id === context.req.param("defenceId"));
    if (!defence) return context.text("Not found", 404);

    return context.html(<DefenceEditCard defence={defence} sheet={sheet} />);
  });

  app.patch("/sheet/:characterRef/defences/:defenceId", async (context) => {
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
    const detail = parseFormText(body.detail);
    if (!label || !detail) return context.text("Invalid defence", 400);

    const defence = dependencies.characterRepository.updateDefence(
      sheet.id,
      context.req.param("defenceId"),
      { detail, label },
    );
    if (!defence) return context.text("Not found", 404);

    return context.html(<DefenceReadCard defence={defence} sheet={sheet} />);
  });

  app.get("/sheet/:characterRef/proficiencies/:proficiencyId", (context) => {
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

    const proficiency = sheet.proficiencies.find((candidate) => candidate.id === context.req.param("proficiencyId"));
    if (!proficiency) return context.text("Not found", 404);

    return context.html(
      <ProficiencyReadItem
        isTool={proficiency.category === "tool"}
        proficiency={proficiency}
        sheet={sheet}
      />,
    );
  });

  app.get("/sheet/:characterRef/proficiencies/:proficiencyId/edit", (context) => {
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

    const proficiency = sheet.proficiencies.find((candidate) => candidate.id === context.req.param("proficiencyId"));
    if (!proficiency) return context.text("Not found", 404);

    return context.html(<ProficiencyEditItem proficiency={proficiency} sheet={sheet} />);
  });

  app.patch("/sheet/:characterRef/proficiencies/:proficiencyId", async (context) => {
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
    const name = parseFormText(body.name);
    if (!name) return context.text("Invalid sheet row", 400);

    const proficiency = dependencies.characterRepository.updateProficiency(
      sheet.id,
      context.req.param("proficiencyId"),
      { detail: parseFormString(body.detail) ?? "", name },
    );
    if (!proficiency) return context.text("Not found", 404);

    return context.html(
      <ProficiencyReadItem
        isTool={proficiency.category === "tool"}
        proficiency={proficiency}
        sheet={sheet}
      />,
    );
  });

  app.post("/sheet/:characterRef/proficiencies", async (context) => {
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
    const name = parseFormText(body.name);
    const category = parseProficiencyCategory(body.category);
    if (!name || !category) return context.text("Invalid proficiency", 400);

    dependencies.characterRepository.addProficiency(sheet.id, {
      category,
      detail: parseFormString(body.detail) ?? "",
      name,
    });
    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, sheetViewerRole(updatedSheet.id, session), "skills");
  });

  app.get("/sheet/:characterRef/background/:entryId", (context) => {
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

    const entry = dependencies.characterRepository
      .listBackgroundEntries(sheet.id)
      .find((candidate) => candidate.id === context.req.param("entryId"));
    if (!entry) return context.text("Not found", 404);

    return context.html(<BackgroundEntryReadItem characterSlug={sheet.slug} entry={entry} />);
  });

  app.get("/sheet/:characterRef/background/:entryId/edit", (context) => {
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

    const entry = dependencies.characterRepository
      .listBackgroundEntries(sheet.id)
      .find((candidate) => candidate.id === context.req.param("entryId"));
    if (!entry) return context.text("Not found", 404);

    return context.html(<BackgroundEntryEditItem characterSlug={sheet.slug} entry={entry} />);
  });

  app.patch("/sheet/:characterRef/background/:entryId", async (context) => {
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
    if (!title) return context.text("Invalid sheet update", 400);

    const updated = dependencies.characterRepository.updateBackgroundEntry(
      sheet.id,
      context.req.param("entryId"),
      { body: parseFormString(body.body) ?? "", title },
    );
    if (!updated) return context.text("Not found", 404);

    const entry = dependencies.characterRepository
      .listBackgroundEntries(sheet.id)
      .find((candidate) => candidate.id === context.req.param("entryId"));
    if (!entry) return context.text("Not found", 404);

    return context.html(<BackgroundEntryReadItem characterSlug={sheet.slug} entry={entry} />);
  });

  app.post("/sheet/:characterRef/background", async (context) => {
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
    const category = parseBackgroundCategory(body.category);
    if (!title || !category) return context.text("Invalid background entry", 400);

    dependencies.characterRepository.addBackgroundEntry(sheet.id, {
      body: parseFormString(body.body) ?? "",
      category,
      title,
    });
    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, sheetViewerRole(updatedSheet.id, session), "background");
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
          notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, sheetViewerRole(sheet.id, session))}
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

  app.get("/sheet/:characterRef/equipment/:equipmentId", (context) => {
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

    const item = dependencies.characterRepository
      .listEquipment(sheet.id)
      .find((candidate) => candidate.id === context.req.param("equipmentId"));
    if (!item) return context.text("Not found", 404);

    return context.html(<EquipmentReadItem characterSlug={sheet.slug} item={item} />);
  });

  app.get("/sheet/:characterRef/equipment/:equipmentId/edit", (context) => {
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

    const item = dependencies.characterRepository
      .listEquipment(sheet.id)
      .find((candidate) => candidate.id === context.req.param("equipmentId"));
    if (!item) return context.text("Not found", 404);

    return context.html(<EquipmentEditItem characterSlug={sheet.slug} item={item} />);
  });

  app.post("/sheet/:characterRef/equipment", async (context) => {
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
    const name = parseFormText(body.name);
    const category = parseFormText(body.category);
    const quantity = parseFormNumber(body.quantity);
    if (!name || !category || quantity === null || quantity < 0) {
      return context.text("Invalid equipment", 400);
    }

    dependencies.characterRepository.addEquipmentItem(sheet.id, {
      category,
      equipped: parseFormBoolean(body.equipped) ?? false,
      name,
      notes: parseFormString(body.notes) ?? "",
      quantity,
    });
    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, sheetViewerRole(updatedSheet.id, session), "equipment");
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

    const item = dependencies.characterRepository
      .listEquipment(sheet.id)
      .find((candidate) => candidate.id === equipmentId);
    if (!item) return context.text("Not found", 404);

    return context.html(<EquipmentReadItem characterSlug={sheet.slug} item={item} />);
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
    const viewerRole = sheetViewerRole(sheet.id, session);

    const note = dependencies.notesRepository.updateNote(
      sheet.id,
      context.req.param("noteId"),
      viewerRole,
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
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, viewerRole)}
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
    const viewerRole = sheetViewerRole(sheet.id, session);
    if (viewerRole === "player" && visibility === "game_master") {
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

    return renderSheetTabPanel(context, dependencies, updatedSheet, viewerRole, "notes");
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
      sheetViewerRole(sheet.id, session),
    );
    if (!deleted) return context.text("Not found", 404);

    const updatedSheet = dependencies.characterRepository.getSheetById(sheet.id);
    if (!updatedSheet) return context.text("Not found", 404);

    return renderSheetTabPanel(context, dependencies, updatedSheet, sheetViewerRole(updatedSheet.id, session), "notes");
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

    return renderSheetTabPanel(context, dependencies, updatedSheet, sheetViewerRole(updatedSheet.id, session), "background");
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
        notes={dependencies.notesRepository.listNotesForCharacter(sheet.id, sheetViewerRole(sheet.id, session))}
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

function parseAdminHandoff(context: Context, accountDelivery: AccountDeliveryConfig) {
  const type = context.req.query("handoff");
  const url = parseFormString(context.req.query("url"));
  const expires = parseFormString(context.req.query("expires"));
  if (!url || !expires) return undefined;

  const requestUrl = new URL(context.req.url);
  let handoffUrl: URL;
  try {
    handoffUrl = new URL(url, requestUrl);
  } catch {
    return undefined;
  }
  const allowedOrigins = new Set([requestUrl.origin]);
  if (accountDelivery.publicBaseUrl) allowedOrigins.add(new URL(accountDelivery.publicBaseUrl).origin);
  if (!allowedOrigins.has(handoffUrl.origin)) return undefined;

  const expiresAt = new Date(expires);
  if (Number.isNaN(expiresAt.getTime())) return undefined;

  if (type === "invite") {
    if (!handoffUrl.pathname.startsWith("/invites/")) return undefined;
    const email = parseFormString(context.req.query("email"));
    const role = parseFormString(context.req.query("role"));
    if (!email || !role || !isUserRole(role)) return undefined;

    return {
      email,
      expiresAt,
      role,
      type,
      url: handoffUrl.toString(),
    } as const;
  }

  if (type === "password_reset") {
    if (!handoffUrl.pathname.startsWith("/password-reset/")) return undefined;
    const userDisplayName = parseFormString(context.req.query("user"));
    if (!userDisplayName) return undefined;

    return {
      expiresAt,
      type,
      url: handoffUrl.toString(),
      userDisplayName,
    } as const;
  }

  return undefined;
}

async function parseCharacterCreateForm(
  context: Context,
  options: {
    form?: FormValues;
    campaignId: string;
    ownerUserId: string;
  },
): Promise<{ ok: true; value: CreateCharacterInput } | { ok: false; message: string }> {
  const form = options.form ?? await FormValues.from(context);
  const name = parseFormText(form.string("name"));
  const species = parseFormText(form.string("species"));
  const className = parseFormText(form.string("className"));
  const background = parseFormText(form.string("background"));
  const level = parseFormNumber(form.string("level"));
  const hitPointMax = parseFormNumber(form.string("hitPointMax"));
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
      subclassName: parseFormString(form.optionalString("subclassName")) || null,
    },
  };
}

function ruleAccessFilters(dependencies: AppDependencies, session: { user: AuthUser } | null) {
  if (!session) return { contentCategory: "srd" as const };

  const campaignIds = ["campaign_rovnost_shadows"].filter((campaignId) =>
    dependencies.campaignRepository.listMembers(campaignId).some((member) => member.userId === session.user.id),
  );

  return campaignIds.length ? { campaignIds } : {};
}

function membersWithDisplayNames(dependencies: AppDependencies, campaignId: string) {
  return dependencies.campaignRepository.listMembers(campaignId).map((member) => ({
    ...member,
    displayName: dependencies.authRepository.findUserById(member.userId)?.displayName ?? member.userId,
  }));
}

function statBlockRulesForCampaign(dependencies: AppDependencies, campaignId: string): RuleSummary[] {
  return dependencies.rulesRepository.listRules({
    campaignIds: [campaignId],
    entityType: "stat_block",
  });
}

function createSrdImportState(counts: RuleEntityTypeCount[], rules: RuleSummary[]) {
  const totalRules = counts.reduce((total, count) => total + count.count, 0);
  const searchableRules = rules.filter(isBrowseableRule).length;

  return {
    categories: counts.length,
    command: "bun run import:rules:srd",
    searchableRules,
    sourcePath: "docs/rules/srd-5.1",
    status: totalRules === 0 ? "empty" : searchableRules >= 100 ? "ready" : "partial",
    totalRules,
  } as const;
}

function createRuleEntityTypeCounts(rules: RuleSummary[]): RuleEntityTypeCount[] {
  const counts = new Map<RuleEntityType, number>();
  for (const rule of rules) {
    counts.set(rule.entityType, (counts.get(rule.entityType) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([entityType, count]) => ({ count, entityType }))
    .sort((left, right) => left.entityType.localeCompare(right.entityType));
}

function isBrowseableRule(rule: RuleSummary) {
  return rule.contentCategory !== "srd" || rule.description.trim() !== "" || rule.tags.length > 0;
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
    "stat_block",
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

  return renderSheetTabPanel(
    context,
    dependencies,
    updatedSheet,
    sheetViewerRoleForDependencies(dependencies, updatedSheet.id, session),
    tabId,
  );
}

function sheetViewerRoleForDependencies(
  dependencies: AppDependencies,
  characterId: string,
  session: NonNullable<ReturnType<SessionService["readSession"]>>,
): UserRole {
  const access = dependencies.characterRepository.getAccessContext(characterId);
  if (access?.ownerUserId === session.user.id) return "player";
  const membership = access
    ? dependencies.campaignRepository
        .listMembers(access.campaignId)
        .find((member) => member.userId === session.user.id)
    : null;

  return membership?.role ?? session.user.role;
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

function parseBackgroundCategory(value: unknown): CharacterBackgroundCategory | null {
  const categories: CharacterBackgroundCategory[] = [
    "backstory",
    "bond",
    "false_identity",
    "flaw",
    "ideal",
    "npc",
    "personality",
    "rank",
  ];

  return typeof value === "string" && categories.includes(value as CharacterBackgroundCategory)
    ? value as CharacterBackgroundCategory
    : null;
}

function parseProficiencyCategory(value: unknown): CharacterProficiency["category"] | null {
  const categories: Array<CharacterProficiency["category"]> = ["armour", "language", "tool", "weapon"];

  return typeof value === "string" && categories.includes(value as CharacterProficiency["category"])
    ? value as CharacterProficiency["category"]
    : null;
}

function parseNpcVisibility(value: unknown): NpcVisibility | null {
  if (value === "public" || value === "private" || value === "selected") return value;
  if (value === "player") return "public";
  if (value === "game_master") return "private";

  return null;
}

function parseCampaignSessionForm(
  form: FormValues,
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
  const title = parseFormText(form.string("title"));
  const sessionDate = parseFormString(form.optionalString("sessionDate"));
  const summary = parseFormString(form.optionalString("summary"));
  const textBody = parseFormString(form.optionalString("body"));
  const visibility = parseNoteVisibility(form.string("visibility"));
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

function parseCampaignNpcForm(
  body: Awaited<ReturnType<Context["req"]["parseBody"]>>,
): {
  ok: true;
  value: {
    gmNotes: string;
    hooks: string;
    motivations: string;
    name: string;
    portraitImageAssetId: string | null;
    publicSummary: string;
    publicWikiPageId: string | null;
    revealNotes: string;
    rulesEntityId: string | null;
    sceneNotes: string;
    secrets: string;
    selectedPlayerIds: string[];
    visibility: NpcVisibility;
  };
} | { ok: false; message: string } {
  const name = parseFormText(body.name);
  const publicSummary = parseFormText(body.publicSummary);
  const visibility = parseNpcVisibility(body.visibility);
  if (!name || !publicSummary || !visibility) {
    return { ok: false, message: "Invalid NPC" };
  }

  return {
    ok: true,
    value: {
      gmNotes: parseFormString(body.gmNotes) ?? "",
      hooks: parseFormString(body.hooks) ?? "",
      motivations: parseFormString(body.motivations) ?? "",
      name,
      portraitImageAssetId: parseFormString(body.portraitImageAssetId) || null,
      publicSummary,
      publicWikiPageId: parseFormString(body.publicWikiPageId) || null,
      revealNotes: parseFormString(body.revealNotes) ?? "",
      rulesEntityId: parseFormString(body.rulesEntityId) || null,
      sceneNotes: parseFormString(body.sceneNotes) ?? "",
      secrets: parseFormString(body.secrets) ?? "",
      selectedPlayerIds: parseFormStringArray(body.selectedPlayerIds),
      visibility,
    },
  };
}

function parseFormStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => parseFormString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }
  const single = parseFormString(value);

  return single ? [single] : [];
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

function parseCampaignImportPreviewForm(
  form: FormValues,
): {
  ok: true;
  value: {
    content: string;
    provider: CampaignImportProvider;
    sourceFormat: CampaignImportSourceFormat;
    sourceReference: string | null;
    sourceTitle: string;
    targetType: CampaignImportTargetType;
    visibility: CampaignContentVisibility;
  };
} | { ok: false; message: string } {
  const content = form.string("content")?.trim();
  const provider = parseCampaignImportProvider(form.optionalString("provider") ?? "manual");
  const sourceTitle = form.string("sourceTitle")?.trim();
  const sourceFormat = parseCampaignImportSourceFormat(form.string("sourceFormat"));
  const targetType = parseCampaignImportTargetType(form.string("targetType"));
  const visibility = parseNoteVisibility(form.string("visibility"));
  if (!content || !provider || !sourceFormat || !targetType || !visibility) {
    return { ok: false, message: "Invalid import preview" };
  }
  if (provider === "google_docs_manual") {
    try {
      const prepared = prepareGoogleDocsManualImport({
        documentReference: form.optionalString("sourceReference") ?? "",
        documentTitle: sourceTitle ?? "",
        exportedContent: content,
        sourceFormat,
      });

      return {
        ok: true,
        value: {
          content: prepared.content,
          provider: prepared.provider,
          sourceFormat: prepared.sourceFormat,
          sourceReference: prepared.sourceReference,
          sourceTitle: prepared.sourceTitle,
          targetType,
          visibility,
        },
      };
    } catch {
      return { ok: false, message: "Invalid Google Docs import" };
    }
  }

  return {
    ok: true,
    value: {
      content,
      provider,
      sourceFormat,
      sourceReference: form.optionalString("sourceReference")?.trim() || null,
      sourceTitle: sourceTitle || "",
      targetType,
      visibility,
    },
  };
}

function parseCampaignImportSaveForm(
  form: FormValues,
): {
  ok: true;
  value: {
    conversionNotes: string;
    convertedMarkdown: string;
    provider: CampaignImportProvider;
    sourceFormat: CampaignImportSourceFormat;
    sourceReference: string | null;
    sourceTitle: string;
    targetType: CampaignImportTargetType;
    title: string;
    visibility: CampaignContentVisibility;
  };
} | { ok: false; message: string } {
  const title = form.string("title")?.trim();
  const convertedMarkdown = form.string("convertedMarkdown")?.trim();
  const provider = parseCampaignImportProvider(form.string("provider"));
  const sourceFormat = parseCampaignImportSourceFormat(form.string("sourceFormat"));
  const sourceTitle = form.string("sourceTitle")?.trim();
  const targetType = parseCampaignImportTargetType(form.string("targetType"));
  const visibility = parseNoteVisibility(form.string("visibility"));
  if (!title || !convertedMarkdown || !provider || !sourceFormat || !sourceTitle || !targetType || !visibility) {
    return { ok: false, message: "Invalid import save" };
  }
  const sourceReference = form.optionalString("sourceReference")?.trim() || null;
  const normalisedSourceReference = provider === "google_docs_manual" && sourceReference
    ? normaliseGoogleDocsReference(sourceReference)
    : sourceReference;
  if (provider === "google_docs_manual" && !normalisedSourceReference) {
    return { ok: false, message: "Invalid Google Docs import" };
  }
  const cleaned = convertCampaignImportContent({
    content: convertedMarkdown,
    sourceFormat: "markdown",
    sourceTitle,
  });
  const conversionNotes = [
    form.optionalString("conversionNotes")?.trim(),
    ...cleaned.warnings,
  ].filter(Boolean).join("\n");

  return {
    ok: true,
    value: {
      conversionNotes,
      convertedMarkdown: cleaned.convertedMarkdown,
      provider,
      sourceFormat,
      sourceReference: normalisedSourceReference,
      sourceTitle,
      targetType,
      title,
      visibility,
    },
  };
}

function saveCampaignImportTarget(
  repository: CampaignContentRepository,
  campaignId: string,
  userId: string,
  input: {
    convertedMarkdown: string;
    sourceReference: string | null;
    sourceTitle: string;
    targetType: CampaignImportTargetType;
    title: string;
    visibility: CampaignContentVisibility;
  },
) {
  if (input.targetType === "draft") return null;
  if (input.targetType === "wiki") {
    return repository.createWikiPage({
      bodyMarkdown: input.convertedMarkdown,
      campaignId,
      coverImageAssetId: null,
      pageType: "lore",
      sourcePath: input.sourceReference,
      sourceTitle: input.sourceTitle,
      tags: ["imported"],
      title: input.title,
      visibility: input.visibility,
    }).id;
  }
  if (input.targetType === "session") {
    return repository.createSession({
      body: input.convertedMarkdown,
      campaignId,
      createdByUserId: userId,
      sessionDate: null,
      summary: campaignImportSummary(input.convertedMarkdown),
      title: input.title,
      visibility: input.visibility,
    }).id;
  }
  const npc = repository.createNpcDossier({
    campaignId,
    gmNotes: input.visibility === "game_master" ? input.convertedMarkdown : "",
    hooks: "",
    motivations: "",
    name: input.title,
    portraitImageAssetId: null,
    publicSummary: campaignImportSummary(input.convertedMarkdown),
    publicWikiPageId: null,
    revealNotes: "",
    rulesEntityId: null,
    sceneNotes: "",
    secrets: "",
    selectedPlayerIds: [],
    visibility: input.visibility === "player" ? "public" : "private",
  });

  return npc.id;
}

function campaignImportRedirect(campaignSlug: string, targetType: CampaignImportTargetType, targetRecordId: string | null) {
  if (targetType === "draft" || !targetRecordId) return `/campaigns/${campaignSlug}/imports`;
  if (targetType === "npc") return `/campaigns/${campaignSlug}/npcs`;

  return `/campaigns/${campaignSlug}`;
}

function campaignImportSummary(markdown: string) {
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220) || "Imported campaign writing.";
}

function parseCampaignImportProvider(value: unknown): CampaignImportProvider | null {
  return value === "manual" || value === "google_docs_manual" ? value : null;
}

function parseCampaignImportSourceFormat(value: unknown): CampaignImportSourceFormat | null {
  return value === "html" || value === "markdown" ? value : null;
}

function parseCampaignImportTargetType(value: unknown): CampaignImportTargetType | null {
  return value === "draft" || value === "npc" || value === "session" || value === "wiki" ? value : null;
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
  const caption = parseFormString(body.caption) ?? "";
  const visibility = parseNoteVisibility(body.visibility);
  const image = body.image;
  if (!title || !altText || !visibility || !(image instanceof File)) {
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
