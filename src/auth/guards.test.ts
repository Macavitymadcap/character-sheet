import { describe, expect, test } from "bun:test";
import {
  requireCampaignAccess,
  requireCampaignContentAccess,
  requireRole,
  requireSheetAccess,
} from "./guards";
import type { CampaignRepository, CharacterRepository } from "../db";
import type { AuthSession } from "./sessions";

const session = (role: AuthSession["user"]["role"], userId = `user_${role}`): AuthSession => ({
  expiresAt: new Date("2026-05-17T12:00:00.000Z"),
  id: `session_${role}`,
  user: {
    capabilities: role === "admin" ? ["admin"] : [],
    campaignRoles: role === "game_master" ? ["game_master"] : role === "player" ? ["player"] : [],
    displayName: role,
    email: `${role}@example.local`,
    id: userId,
    role,
    status: "active",
  },
});

const combinedSession = (
  userId: string,
  campaignRoles: AuthSession["user"]["campaignRoles"],
): AuthSession => ({
  expiresAt: new Date("2026-05-17T12:00:00.000Z"),
  id: `session_${userId}`,
  user: {
    capabilities: ["admin"],
    campaignRoles,
    displayName: userId,
    email: `${userId}@example.local`,
    id: userId,
    role: "admin",
    status: "active",
  },
});

const characterRepository = (ownerUserId: string): Pick<CharacterRepository, "getAccessContext"> => ({
  getAccessContext: () => ({
    campaignId: "campaign_1",
    id: "character_1",
    ownerUserId,
  }),
});

const campaignRepository = (
  members: ReturnType<CampaignRepository["listMembers"]>,
): Pick<CampaignRepository, "getCampaignById" | "listMembers"> => ({
  getCampaignById: (campaignId: string) =>
    campaignId === "campaign_1"
      ? {
          gmUserId: "user_game_master",
          id: "campaign_1",
          name: "Campaign",
          slug: "campaign",
        }
      : null,
  listMembers: () => members,
});

describe("role guards", () => {
  test("allows matching roles and rejects disallowed roles", () => {
    expect(requireRole(session("admin"), ["admin"]).ok).toBeTrue();
    expect(requireRole(session("game_master"), ["admin"]).ok).toBeFalse();
  });

  test("allows admin capability alongside campaign roles", () => {
    const adminPlayer = combinedSession("user_admin_player", ["player"]);
    const adminGameMaster = combinedSession("user_admin_gm", ["game_master"]);

    expect(requireRole(adminPlayer, ["admin"]).ok).toBeTrue();
    expect(requireRole(adminPlayer, ["player"]).ok).toBeTrue();
    expect(requireRole(adminGameMaster, ["admin"]).ok).toBeTrue();
    expect(requireRole(adminGameMaster, ["game_master"]).ok).toBeTrue();
  });

  test("requires authentication before role checks", () => {
    const result = requireRole(null, ["admin"]);

    expect(result).toEqual({ ok: false, reason: "unauthenticated" });
  });
});

describe("sheet access guards", () => {
  test("allows player access to their own sheet", () => {
    const result = requireSheetAccess({
      characterId: "character_1",
      campaignRepository: campaignRepository([
        { campaignId: "campaign_1", role: "player", userId: "user_lynott_player" },
      ]),
      characterRepository: characterRepository("user_lynott_player"),
      permission: "write",
      session: session("player", "user_lynott_player"),
    });

    expect(result.ok).toBeTrue();
  });

  test("rejects player write access to another user's sheet", () => {
    const result = requireSheetAccess({
      characterId: "character_1",
      campaignRepository: campaignRepository([
        { campaignId: "campaign_1", role: "player", userId: "user_lynott_player" },
      ]),
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: session("player", "user_lynott_player"),
    });

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  test("allows Game Masters to write sheets and keeps admins read-only for sheet state", () => {
    const gm = requireSheetAccess({
      characterId: "character_1",
      campaignRepository: campaignRepository([
        { campaignId: "campaign_1", role: "game_master", userId: "user_game_master" },
      ]),
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: session("game_master", "user_game_master"),
    });
    const admin = requireSheetAccess({
      characterId: "character_1",
      campaignRepository: campaignRepository([]),
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: session("admin"),
    });

    expect(gm.ok).toBeTrue();
    expect(admin).toEqual({ ok: false, reason: "forbidden" });
  });

  test("uses campaign membership, not admin capability, for combined sheet access", () => {
    const adminPlayer = requireSheetAccess({
      characterId: "character_1",
      campaignRepository: campaignRepository([
        { campaignId: "campaign_1", role: "player", userId: "user_admin_player" },
      ]),
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: combinedSession("user_admin_player", ["player"]),
    });
    const adminGameMaster = requireSheetAccess({
      characterId: "character_1",
      campaignRepository: campaignRepository([
        { campaignId: "campaign_1", role: "game_master", userId: "user_admin_gm" },
      ]),
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: combinedSession("user_admin_gm", ["game_master"]),
    });

    expect(adminPlayer).toEqual({ ok: false, reason: "forbidden" });
    expect(adminGameMaster.ok).toBeTrue();
  });

  test("rejects Game Masters who do not belong to the character campaign", () => {
    const result = requireSheetAccess({
      campaignRepository: campaignRepository([]),
      characterId: "character_1",
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: session("game_master", "user_game_master"),
    });

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });
});

describe("campaign access guards", () => {
  const members = [
    { campaignId: "campaign_1", role: "game_master" as const, userId: "user_game_master" },
    { campaignId: "campaign_1", role: "player" as const, userId: "user_player" },
  ];

  test("allows campaign members by permission level", () => {
    const campaigns = campaignRepository(members);

    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        permission: "read",
        session: session("player", "user_player"),
      }).ok,
    ).toBeTrue();
    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        permission: "manage",
        session: session("game_master", "user_game_master"),
      }).ok,
    ).toBeTrue();
    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        permission: "manage",
        session: session("player", "user_player"),
      }),
    ).toEqual({ ok: false, reason: "forbidden" });
  });

  test("keeps non-members and unauthenticated users out", () => {
    const campaigns = campaignRepository(members);

    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        permission: "read",
        session: null,
      }),
    ).toEqual({ ok: false, reason: "unauthenticated" });
    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        permission: "read",
        session: session("player", "user_elsewhere"),
      }),
    ).toEqual({ ok: false, reason: "forbidden" });
  });

  test("does not let admin capability bypass campaign membership", () => {
    const campaigns = campaignRepository(members);

    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        permission: "read",
        session: session("admin", "user_site_admin"),
      }),
    ).toEqual({ ok: false, reason: "forbidden" });
    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        permission: "read",
        session: combinedSession("user_admin_player", ["player"]),
      }).ok,
    ).toBeFalse();
    expect(
      requireCampaignAccess({
        campaignId: "campaign_1",
        campaignRepository: campaignRepository([]),
        permission: "manage",
        session: session("admin", "user_site_admin"),
      }),
    ).toEqual({ ok: false, reason: "forbidden" });
  });

  test("filters player-visible and Game-Master-only campaign content", () => {
    const campaigns = campaignRepository(members);

    expect(
      requireCampaignContentAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        session: session("player", "user_player"),
        visibility: "player",
      }).ok,
    ).toBeTrue();
    expect(
      requireCampaignContentAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        session: session("player", "user_player"),
        visibility: "game_master",
      }),
    ).toEqual({ ok: false, reason: "forbidden" });
    expect(
      requireCampaignContentAccess({
        campaignId: "campaign_1",
        campaignRepository: campaigns,
        session: session("game_master", "user_game_master"),
        visibility: "game_master",
      }).ok,
    ).toBeTrue();
  });
});
