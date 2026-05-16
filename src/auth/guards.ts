import type { CharacterRepository, UserRole } from "../db";
import type { AuthSession } from "./sessions";

type GuardReason = "forbidden" | "not_found" | "unauthenticated";
type GuardResult = { ok: true } | { ok: false; reason: GuardReason };
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
  characterId,
  characterRepository,
  permission,
  session,
}: {
  characterId: string;
  characterRepository: Pick<CharacterRepository, "getAccessContext">;
  permission: SheetPermission;
  session: AuthSession | null;
}): GuardResult {
  if (!session) return { ok: false, reason: "unauthenticated" };

  const character = characterRepository.getAccessContext(characterId);
  if (!character) return { ok: false, reason: "not_found" };

  if (session.user.role === "game_master") return { ok: true };
  if (session.user.role === "admin") {
    return permission === "read" ? { ok: true } : { ok: false, reason: "forbidden" };
  }
  if (character.ownerUserId === session.user.id) return { ok: true };

  return { ok: false, reason: "forbidden" };
}
