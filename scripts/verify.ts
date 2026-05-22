#!/usr/bin/env bun
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Check {
  command: string[];
  env?: Record<string, string>;
  label: string;
}

const configuredVerificationScreenshotDir = process.env.VERIFY_SCREENSHOT_DIR;
const verificationScreenshotDir = configuredVerificationScreenshotDir
  ?? join(tmpdir(), "campaign-ledger-verify-screenshots");

const checks: Check[] = [
  { label: "Typecheck", command: ["bun", "run", "typecheck"] },
  { label: "Tests", command: ["bun", "run", "test"] },
  { label: "Accessibility", command: ["bun", "run", "test:a11y"] },
  { label: "MVP smoke", command: ["bun", "run", "smoke:mvp"] },
  {
    label: "Sheet screenshots",
    command: ["bun", "run", "screenshots:sheet"],
    env: { SCREENSHOT_DIR: verificationScreenshotDir },
  },
];

if (!configuredVerificationScreenshotDir) {
  rmSync(verificationScreenshotDir, { force: true, recursive: true });
}

for (const check of checks) {
  console.log(`\n== ${check.label} ==`);

  const exitCode = await runCommand(check);

  if (exitCode !== 0) {
    console.error(`${check.label} failed with exit code ${exitCode}.`);
    process.exit(exitCode);
  }
}

console.log("\nVerification complete.");

function runCommand(check: Check) {
  return new Promise<number>((resolve, reject) => {
    const { command } = check;
    const [executable, ...args] = command;
    if (!executable) {
      reject(new Error("Cannot run an empty command."));
      return;
    }

    const env = { ...process.env, ...check.env };
    delete env.npm_lifecycle_event;
    const child = spawn(executable, args, { env, stdio: "inherit" });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}
