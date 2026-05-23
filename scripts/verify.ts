#!/usr/bin/env bun
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAsync } from "@macavitymadcap/hyper-dank-automation";

export interface Check {
  command: string[];
  env?: Record<string, string>;
  label: string;
}

export function resolveVerificationScreenshotDir(env: NodeJS.ProcessEnv = process.env) {
  return env.VERIFY_SCREENSHOT_DIR ?? join(tmpdir(), "campaign-ledger-verify-screenshots");
}

export function buildVerificationChecks(env: NodeJS.ProcessEnv = process.env): Check[] {
  return [
    { label: "Typecheck", command: ["bun", "run", "typecheck"] },
    { label: "Tests", command: ["bun", "run", "test"] },
    { label: "Accessibility", command: ["bun", "run", "test:a11y"] },
    { label: "MVP smoke", command: ["bun", "run", "smoke:mvp"] },
    {
      label: "Sheet screenshots",
      command: ["bun", "run", "screenshots:sheet"],
      env: { SCREENSHOT_DIR: resolveVerificationScreenshotDir(env) },
    },
  ];
}

export async function runVerification(checks = buildVerificationChecks()) {
  for (const check of checks) {
    console.log(`\n== ${check.label} ==`);

    const exitCode = await runCommand(check);

    if (exitCode !== 0) {
      console.error(`${check.label} failed with exit code ${exitCode}.`);
      process.exit(exitCode);
    }
  }

  console.log("\nVerification complete.");
}

async function runCommand(check: Check) {
  const [executable, ...args] = check.command;
  if (!executable) throw new Error("Cannot run an empty command.");

  const env = { ...process.env, ...check.env };
  delete env.npm_lifecycle_event;

  return runAsync(executable, args, {
    allowFailure: true,
    env,
    stdio: "inherit",
  });
}

if (import.meta.main) {
  if (!process.env.VERIFY_SCREENSHOT_DIR) {
    rmSync(resolveVerificationScreenshotDir(), { force: true, recursive: true });
  }

  await runVerification();
}
