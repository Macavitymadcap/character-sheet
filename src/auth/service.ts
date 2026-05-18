import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  AuthRepository,
  AuthUser,
  LocalInvite,
  PasswordResetToken,
  UserRole,
} from "../db";
import type { PasswordService } from "./password";

interface AuthServiceDependencies {
  authRepository: AuthRepository;
  now?: () => Date;
  passwordService: PasswordService;
}

interface CreateInviteInput {
  createdByUserId: string;
  email: string;
  role: UserRole;
}

interface CreatePasswordResetInput {
  createdByUserId: string;
  userId: string;
}

interface AcceptInviteInput {
  displayName: string;
  password: string;
  token: string;
}

interface UsePasswordResetTokenInput {
  password: string;
  token: string;
}

export interface LocalInviteWithToken extends LocalInvite {
  token: string;
}

export interface PasswordResetTokenWithToken extends PasswordResetToken {
  token: string;
}

export class AuthService {
  private readonly now: () => Date;

  constructor(private readonly dependencies: AuthServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  verifyCredentials(email: string, password: string): AuthUser | null {
    const user = this.dependencies.authRepository.findUserWithPasswordByEmail(email);
    if (!user || user.status !== "active") return null;

    const verified = this.dependencies.passwordService.verifyPassword(password, user.passwordHash);
    if (!verified) return null;

    return {
      displayName: user.displayName,
      email: user.email,
      id: user.id,
      role: user.role,
      status: user.status,
    };
  }

  createInvite(input: CreateInviteInput): LocalInviteWithToken {
    const token = createToken();
    const invite: LocalInvite = {
      acceptedAt: null,
      createdByUserId: input.createdByUserId,
      email: input.email,
      expiresAt: addDays(this.now(), 7),
      id: randomUUID(),
      role: input.role,
      tokenHash: hashToken(token),
    };

    return {
      ...this.dependencies.authRepository.createInvite(invite),
      token,
    };
  }

  readInvite(token: string): LocalInvite | null {
    const invite = this.dependencies.authRepository.findInviteByTokenHash(hashToken(token));
    if (!invite || invite.expiresAt <= this.now()) return null;
    if (invite.acceptedAt) return null;

    return invite;
  }

  acceptInvite(input: AcceptInviteInput): AuthUser {
    const invite = this.dependencies.authRepository.findInviteByTokenHash(hashToken(input.token));
    if (!invite || invite.expiresAt <= this.now() || invite.acceptedAt) {
      throw new Error("Invite is invalid or expired.");
    }

    const existing = this.dependencies.authRepository.findUserByEmail(invite.email);
    if (existing) throw new Error("Email already exists.");

    const userId = randomUUID();
    const passwordHash = this.dependencies.passwordService.hashPassword(
      input.password,
      `invite-${invite.id}`,
    );
    const user = this.dependencies.authRepository.createUser({
      displayName: input.displayName,
      email: invite.email,
      id: userId,
      passwordHash,
      role: invite.role,
      status: "active",
    });

    this.dependencies.authRepository.acceptInvite(invite.id, this.now());

    return user;
  }

  createPasswordResetToken(input: CreatePasswordResetInput): PasswordResetTokenWithToken {
    const user = this.dependencies.authRepository.findUserById(input.userId);
    if (!user) throw new Error(`Cannot create password reset token for missing user: ${input.userId}`);

    const token = createToken();
    const reset: PasswordResetToken = {
      createdByUserId: input.createdByUserId,
      expiresAt: addDays(this.now(), 1),
      id: randomUUID(),
      tokenHash: hashToken(token),
      usedAt: null,
      userId: input.userId,
    };

    return {
      ...this.dependencies.authRepository.createPasswordResetToken(reset),
      token,
    };
  }

  readPasswordResetToken(token: string): PasswordResetToken | null {
    const reset = this.dependencies.authRepository.findPasswordResetTokenByTokenHash(hashToken(token));
    if (!reset || reset.expiresAt <= this.now()) return null;
    if (reset.usedAt) return null;

    return reset;
  }

  usePasswordResetToken(input: UsePasswordResetTokenInput): AuthUser {
    const reset = this.dependencies.authRepository.findPasswordResetTokenByTokenHash(hashToken(input.token));
    if (!reset || reset.expiresAt <= this.now() || reset.usedAt) {
      throw new Error("Password reset token is invalid or expired.");
    }

    const user = this.dependencies.authRepository.findUserById(reset.userId);
    if (!user) throw new Error("Password reset user is missing.");
    if (user.status !== "active") throw new Error("User is disabled.");

    const passwordHash = this.dependencies.passwordService.hashPassword(
      input.password,
      `reset-${reset.id}`,
    );
    this.dependencies.authRepository.updateUserPasswordHash(user.id, passwordHash);
    this.dependencies.authRepository.usePasswordResetToken(reset.id, this.now());

    return user;
  }
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function createToken() {
  return randomBytes(32).toString("base64url");
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
