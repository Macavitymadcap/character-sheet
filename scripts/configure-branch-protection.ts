#!/usr/bin/env bun

interface GitHubRepo {
  name: string;
  owner: string;
}

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();
const args = process.argv.slice(2);
const bootstrap = args.includes("--bootstrap");
const positionalArgs = args.filter((arg) => arg !== "--bootstrap");
const repoArg = positionalArgs[0]?.includes("/") ? positionalArgs.shift() : undefined;
const repo = repoArg ? parseGitHubRepo(repoArg) : getGitHubRepo();
const branches = positionalArgs.length > 0 ? positionalArgs : ["main", "sheet-0001"];
const configFile = bootstrap
  ? ".github/branch-protection-bootstrap.json"
  : ".github/branch-protection.json";
const config = await Bun.file(configFile).text();
const token = getGitHubToken();

if (!token) {
  throw new Error(
    "Set GITHUB_TOKEN or GH_TOKEN, or authenticate git for github.com before configuring branch protection.",
  );
}

for (const branch of branches) {
  await githubRequest(`/repos/${repo.owner}/${repo.name}/branches/${branch}/protection`, {
    method: "PUT",
    body: config,
  });

  console.log(`Configured branch protection for ${repo.owner}/${repo.name}:${branch}`);
}

function parseGitHubRepo(repo: string): GitHubRepo {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`Expected OWNER/REPO, received: ${repo}`);

  return { owner, name };
}

function getGitHubRepo(): GitHubRepo {
  const remote = runGit(["remote", "get-url", "origin"]);
  const sshMatch = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  const httpsMatch = remote.match(/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  const match = sshMatch ?? httpsMatch;
  if (!match?.[1] || !match[2]) throw new Error(`Could not parse GitHub remote: ${remote}`);

  return {
    name: match[2],
    owner: match[1],
  };
}

function getGitHubToken() {
  if (Bun.env.GITHUB_TOKEN) return Bun.env.GITHUB_TOKEN;
  if (Bun.env.GH_TOKEN) return Bun.env.GH_TOKEN;

  const credential = runGit(["credential", "fill"], "protocol=https\nhost=github.com\n\n");

  return (
    credential
      .split("\n")
      .find((line) => line.startsWith("password="))
      ?.replace("password=", "") ?? ""
  );
}

function runGit(args: string[], input?: string) {
  const result = Bun.spawnSync(["git", ...args], {
    stdin: input ? textEncoder.encode(input) : undefined,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    const stderr = textDecoder.decode(result.stderr);
    throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
  }

  return textDecoder.decode(result.stdout).trim();
}

async function githubRequest(endpoint: string, init: RequestInit) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed for ${repo.owner}/${repo.name}: ${response.status} ${await response.text()}`,
    );
  }
}
