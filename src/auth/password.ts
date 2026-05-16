import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const algorithm = "sha256";
const iterations = 120_000;
const keyLength = 32;

export class PasswordService {
  hashPassword(password: string, salt = randomBytes(16).toString("base64url")) {
    const hash = pbkdf2Sync(password, salt, iterations, keyLength, algorithm).toString("base64url");

    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

  verifyPassword(password: string, passwordHash: string) {
    const [, iterationText, salt, expectedHash] = passwordHash.split("$");
    const parsedIterations = Number(iterationText);

    if (!salt || !expectedHash || !Number.isInteger(parsedIterations)) return false;

    const actual = pbkdf2Sync(password, salt, parsedIterations, keyLength, algorithm);
    const expected = Buffer.from(expectedHash, "base64url");

    return actual.byteLength === expected.byteLength && timingSafeEqual(actual, expected);
  }
}
