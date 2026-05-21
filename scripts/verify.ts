#!/usr/bin/env bun
import { spawn } from "node:child_process";

interface Check {
  command: string[];
  label: string;
}

const checks: Check[] = [
  { label: "Typecheck", command: ["bun", "run", "typecheck"] },
  { label: "Tests", command: ["bun", "run", "test"] },
  { label: "Accessibility", command: ["bun", "run", "test:a11y"] },
  { label: "MVP smoke", command: ["bun", "-e", "import { runMvpSmoke } from './scripts/smoke-mvp'; await runMvpSmoke();"] },
  {
    label: "Sheet screenshots",
    command: ["bun", "-e", "import { captureSheetScreenshots } from './scripts/capture-screenshots'; await captureSheetScreenshots();"],
  },
];

for (const check of checks) {
  console.log(`\n== ${check.label} ==`);

  const exitCode = await runCommand(check.command);

  if (exitCode !== 0) {
    console.error(`${check.label} failed with exit code ${exitCode}.`);
    process.exit(exitCode);
  }
}

console.log("\nVerification complete.");

function runCommand(command: string[]) {
  return new Promise<number>((resolve, reject) => {
    const [executable, ...args] = command;
    if (!executable) {
      reject(new Error("Cannot run an empty command."));
      return;
    }

    const env = { ...process.env };
    delete env.npm_lifecycle_event;
    const child = spawn(executable, args, { env, stdio: "inherit" });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}
