import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { AuthRepository, AuthUser, StoredSession } from "../db";

export const sessionCookieName = "character_sheet_session";

export interface AuthSession {
  expiresAt: Date;
  id: string;
  user: AuthUser;
}

interface SessionServiceDependencies {
  authRepository: AuthRepository;
  now?: () => Date;
  secret: string;
  ttlMs?: number;
}

interface CreateSessionOptions {
  expiresAt?: Date;
}

export class SessionService {
  private readonly now: () => Date;
  private readonly ttlMs: number;

  constructor(private readonly dependencies: SessionServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
    this.ttlMs = dependencies.ttlMs ?? 1000 * 60 * 60 * 8;
  }

  createSession(userId: string, options: CreateSessionOptions = {}) {
    const expiresAt = options.expiresAt ?? new Date(this.now().getTime() + this.ttlMs);
    const session = this.dependencies.authRepository.createSession({
      expiresAt,
      id: randomUUID(),
      userId,
    });

    return {
      cookie: this.createCookie(session),
      session,
    };
  }

  readSession(cookieHeader: string | null | undefined): AuthSession | null {
    const sessionId = this.readSignedSessionId(cookieHeader);
    if (!sessionId) return null;

    const session = this.dependencies.authRepository.findSessionById(sessionId);
    if (!session || session.expiresAt <= this.now()) {
      if (session) this.dependencies.authRepository.deleteSession(session.id);
      return null;
    }

    const user = this.dependencies.authRepository.findUserById(session.userId);
    if (!user || user.status !== "active") return null;

    return {
      expiresAt: session.expiresAt,
      id: session.id,
      user,
    };
  }

  logout(cookieHeader: string | null | undefined) {
    const sessionId = this.readSignedSessionId(cookieHeader);
    if (sessionId) this.dependencies.authRepository.deleteSession(sessionId);
  }

  clearCookie() {
    return `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
  }

  private createCookie(session: StoredSession) {
    const value = this.sign(session.id);

    return `${sessionCookieName}=${value}; HttpOnly; Path=/; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}`;
  }

  private readSignedSessionId(cookieHeader: string | null | undefined) {
    const cookie = parseCookies(cookieHeader)[sessionCookieName];
    if (!cookie) return null;

    const [sessionId, signature] = cookie.split(".");
    if (!sessionId || !signature) return null;

    const expectedSignature = this.signature(sessionId);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (actual.byteLength !== expected.byteLength || !timingSafeEqual(actual, expected)) return null;

    return sessionId;
  }

  private sign(sessionId: string) {
    return `${sessionId}.${this.signature(sessionId)}`;
  }

  private signature(sessionId: string) {
    return createHmac("sha256", this.dependencies.secret).update(sessionId).digest("base64url");
  }
}

function parseCookies(cookieHeader: string | null | undefined) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) continue;
    cookies[rawName] = rawValue.join("=");
  }

  return cookies;
}
