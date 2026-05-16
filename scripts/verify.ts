#!/usr/bin/env bun

interface Check {
  command: string[];
  label: string;
}

const checks: Check[] = [
  { label: "Typecheck", command: ["bun", "run", "typecheck"] },
  { label: "Tests", command: ["bun", "run", "test"] },
  { label: "Accessibility", command: ["bun", "run", "test:a11y"] },
];

for (const check of checks) {
  console.log(`\n== ${check.label} ==`);

  const child = Bun.spawn(check.command, {
    stderr: "inherit",
    stdout: "inherit",
  });
  const exitCode = await child.exited;

  if (exitCode !== 0) {
    console.error(`${check.label} failed with exit code ${exitCode}.`);
    process.exit(exitCode);
  }
}

console.log("\nVerification complete.");
