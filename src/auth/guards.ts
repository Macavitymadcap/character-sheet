import type {
  CampaignContentVisibility,
  CampaignRepository,
  CharacterRepository,
  UserRole,
} from "../db";
import type { AuthSession } from "./sessions";

type GuardReason = "forbidden" | "not_found" | "unauthenticated";
type GuardResult = { ok: true } | { ok: false; reason: GuardReason };
type CampaignPermission = "manage" | "read";
type SheetPermission = "read" | "write";

export function requireRole(
  session: AuthSession | null,
  allowedRoles: UserRole[],
): GuardResult {
  if (!session) return { ok: false, reason: "unauthenticated" };
  if (!allowedRoles.includes(session.user.role)) return { ok: false, reason: "forbidden" };

  return { ok: true };
}

export function requireSheetAccess({
  campaignRepository,
  characterId,
  characterRepository,
  permission,
  session,
}: {
  campaignRepository: Pick<CampaignRepository, "getCampaignById" | "listMembers">;
  characterId: string;
  characterRepository: Pick<CharacterRepository, "getAccessContext">;
  permission: SheetPermission;
  session: AuthSession | null;
}): GuardResult {
  if (!session) return { ok: false, reason: "unauthenticated" };

  const character = characterRepository.getAccessContext(characterId);
  if (!character) return { ok: false, reason: "not_found" };

  if (character.ownerUserId === session.user.id) return { ok: true };

  const campaignAccess = requireCampaignAccess({
    campaignId: character.campaignId,
    campaignRepository,
    permission: permission === "write" ? "manage" : "read",
    session,
  });
  if (!campaignAccess.ok) return campaignAccess;
  if (session.user.role === "game_master") return { ok: true };

  return { ok: false, reason: "forbidden" };
}

export function requireCampaignAccess({
  campaignId,
  campaignRepository,
  permission,
  session,
}: {
  campaignId: string;
  campaignRepository: Pick<CampaignRepository, "getCampaignById" | "listMembers">;
  permission: CampaignPermission;
  session: AuthSession | null;
}): GuardResult {
  if (!session) return { ok: false, reason: "unauthenticated" };

  const campaign = campaignRepository.getCampaignById(campaignId);
  if (!campaign) return { ok: false, reason: "not_found" };

  if (session.user.role === "admin") {
    return permission === "read" ? { ok: true } : { ok: false, reason: "forbidden" };
  }

  const membership = campaignRepository
    .listMembers(campaignId)
    .find((member) => member.userId === session.user.id);
  if (!membership) return { ok: false, reason: "forbidden" };
  if (permission === "read") return { ok: true };

  return membership.role === "game_master" ? { ok: true } : { ok: false, reason: "forbidden" };
}

export function requireCampaignContentAccess({
  campaignId,
  campaignRepository,
  session,
  visibility,
}: {
  campaignId: string;
  campaignRepository: Pick<CampaignRepository, "getCampaignById" | "listMembers">;
  session: AuthSession | null;
  visibility: CampaignContentVisibility;
}): GuardResult {
  const access = requireCampaignAccess({
    campaignId,
    campaignRepository,
    permission: visibility === "game_master" ? "manage" : "read",
    session,
  });
  if (!access.ok) return access;

  if (visibility === "player") return { ok: true };

  return session?.user.role === "game_master" ? { ok: true } : { ok: false, reason: "forbidden" };
}
