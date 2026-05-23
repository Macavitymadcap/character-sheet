import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import {
  buildVerificationChecks,
  resolveVerificationScreenshotDir,
} from "./verify";

describe("verification script", () => {
  test("keeps Campaign Ledger verification gates visible and ordered", () => {
    expect(buildVerificationChecks({}).map((check) => ({
      command: check.command,
      label: check.label,
    }))).toEqual([
      { command: ["bun", "run", "typecheck"], label: "Typecheck" },
      { command: ["bun", "run", "test"], label: "Tests" },
      { command: ["bun", "run", "test:a11y"], label: "Accessibility" },
      { command: ["bun", "run", "smoke:mvp"], label: "MVP smoke" },
      { command: ["bun", "run", "screenshots:sheet"], label: "Sheet screenshots" },
    ]);
  });

  test("routes routine screenshots to a temporary directory", () => {
    const expected = join(tmpdir(), "campaign-ledger-verify-screenshots");
    const checks = buildVerificationChecks({});

    expect(resolveVerificationScreenshotDir({})).toBe(expected);
    expect(checks.at(-1)?.env).toEqual({ SCREENSHOT_DIR: expected });
  });

  test("allows explicit screenshot output override for local debugging", () => {
    const checks = buildVerificationChecks({ VERIFY_SCREENSHOT_DIR: "docs/pr-screenshots" });

    expect(resolveVerificationScreenshotDir({ VERIFY_SCREENSHOT_DIR: "docs/pr-screenshots" }))
      .toBe("docs/pr-screenshots");
    expect(checks.at(-1)?.env).toEqual({ SCREENSHOT_DIR: "docs/pr-screenshots" });
  });
});
