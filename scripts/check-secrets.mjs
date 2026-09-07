import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

const patterns = [
  {
    label: "Private key block",
    regex: /-----BEGIN (RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----/,
  },
  {
    label: "GitHub token",
    regex: /\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  {
    label: "AWS access key",
    regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/,
  },
  {
    label: "OpenAI key",
    regex: /\bsk-[A-Za-z0-9\-_]{20,}\b/,
  },
  {
    label: "Hardcoded AUTH_SECRET",
    regex: /AUTH_SECRET\s*[:=]\s*(?!replace_with_long_random_secret\b|your_auth_secret\b)[^\s"']+/i,
  },
  {
    label: "Hardcoded POSTGRES_PASSWORD",
    regex: /POSTGRES_PASSWORD\s*[:=]\s*(?!\$\{POSTGRES_PASSWORD:-change-me\}|your_db_password\b|-?change-me\b)[^\s"']+/i,
  },
  {
    label: "Hardcoded DATABASE_URL",
    regex: /DATABASE_URL\s*=\s*postgres(?:ql)?:\/\/(?!your_db_user:your_db_password@)[^\s"']+/i,
  },
];

const PLACEHOLDER_VALUE = /^$|change-me|your_|replace_with|^(postgres|localhost|127\.0\.0\.1|\d+)$/i;

const fallbackSecretPattern = {
  label: "Hardcoded fallback for sensitive env var",
  regex: /process\.env\.\w*(?:PASSWORD|SECRET|TOKEN|API_KEY)\w*\s*\?\?\s*["']([^"']*)["']/gi,
};

function scanFallbackSecrets(relPath, text) {
  const findings = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    fallbackSecretPattern.regex.lastIndex = 0;
    let match;
    while ((match = fallbackSecretPattern.regex.exec(line)) !== null) {
      const value = match[1];
      if (!PLACEHOLDER_VALUE.test(value)) {
        findings.push({
          file: relPath,
          line: index + 1,
          rule: fallbackSecretPattern.label,
          value: line.trim().slice(0, 160),
        });
      }
    }
  }

  return findings;
}

const excludedPrefixes = ["node_modules/", ".next/", ".git/", "public/"];
const excludedExactFiles = new Set(["package-lock.json"]);

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !excludedExactFiles.has(file))
    .filter((file) => !excludedPrefixes.some((prefix) => file.startsWith(prefix)));
}

function isLikelyText(content) {
  return !content.includes("\u0000");
}

function scanFile(relPath) {
  const absolutePath = path.join(root, relPath);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
    return [];
  }

  const text = fs.readFileSync(absolutePath, "utf8");
  if (!isLikelyText(text)) {
    return [];
  }

  const findings = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        findings.push({
          file: relPath,
          line: index + 1,
          rule: pattern.label,
          value: line.trim().slice(0, 160),
        });
      }
    }
  }

  return [...findings, ...scanFallbackSecrets(relPath, text)];
}

function main() {
  let stagedFiles = [];
  try {
    stagedFiles = getStagedFiles();
  } catch (error) {
    console.error("Unable to read staged files for secret scan.");
    process.exit(1);
  }

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  const findings = stagedFiles.flatMap(scanFile);

  if (findings.length === 0) {
    console.log("Secret scan passed.");
    process.exit(0);
  }

  console.error("Potential secrets found in staged files:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}] ${finding.value}`);
  }
  console.error("Remove secrets or replace with placeholders before committing.");
  process.exit(1);
}

main();
