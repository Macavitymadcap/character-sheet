import { describe, expect, test } from "bun:test";
import { requireRole, requireSheetAccess } from "./guards";
import type { CharacterRepository } from "../db";
import type { AuthSession } from "./sessions";

const session = (role: AuthSession["user"]["role"], userId = `user_${role}`): AuthSession => ({
  expiresAt: new Date("2026-05-17T12:00:00.000Z"),
  id: `session_${role}`,
  user: {
    displayName: role,
    email: `${role}@example.local`,
    id: userId,
    role,
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

describe("role guards", () => {
  test("allows matching roles and rejects disallowed roles", () => {
    expect(requireRole(session("admin"), ["admin"]).ok).toBeTrue();
    expect(requireRole(session("game_master"), ["admin"]).ok).toBeFalse();
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
      characterRepository: characterRepository("user_lynott_player"),
      permission: "write",
      session: session("player", "user_lynott_player"),
    });

    expect(result.ok).toBeTrue();
  });

  test("rejects player write access to another user's sheet", () => {
    const result = requireSheetAccess({
      characterId: "character_1",
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: session("player", "user_lynott_player"),
    });

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  test("allows Game Masters to write sheets and keeps admins read-only for sheet state", () => {
    const gm = requireSheetAccess({
      characterId: "character_1",
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: session("game_master"),
    });
    const admin = requireSheetAccess({
      characterId: "character_1",
      characterRepository: characterRepository("other_user"),
      permission: "write",
      session: session("admin"),
    });

    expect(gm.ok).toBeTrue();
    expect(admin).toEqual({ ok: false, reason: "forbidden" });
  });
});
