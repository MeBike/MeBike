import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const mobileDir = path.join(rootDir, "apps/mobile");

const allowedThemeColorImports = new Set([
  "apps/mobile/constants/BikeColors.ts",
  "apps/mobile/tamagui.config.ts",
  "apps/mobile/theme/metrics.ts",
]);

const checks = [
  {
    code: "legacy-theme-import",
    message: "Do not import from @theme/colors or @/theme/colors in feature code.",
    test(file, content) {
      if (!/from\s+["'](@theme\/colors|@\/theme\/colors)["']/.test(content)) {
        return null;
      }

      return allowedThemeColorImports.has(file)
        ? null
        : [{ line: 1, snippet: "theme color import" }];
    },
  },
  {
    code: "spacing-alias",
    message: "Use $space tokens or spaceScale/spacingRules, not spacing.* aliases.",
    pattern: /\bspacing\.[A-Za-z]\w*/g,
  },
  {
    code: "fractional-space-token",
    message: "Fractional Tamagui tokens are not allowed.",
    pattern: /\$\d+\.\d+/g,
  },
  {
    code: "legacy-theme-token",
    message: "Use semantic theme roles instead of deprecated legacy tokens.",
    pattern: /\$(brandPrimary|brandSecondary|brandAccent|backgroundStrong|surface\b|textMuted|textOnBrand|divider|success\b|warning\b|error\b|info\b)/g,
  },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".expo", "dist", "coverage"].includes(entry.name)) {
        return [];
      }

      return walk(fullPath);
    }

    return fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")
      ? [fullPath]
      : [];
  }));

  return files.flat();
}

function locateLine(content, index) {
  return content.slice(0, index).split("\n").length;
}

function collectMatches(content, pattern) {
  const matches = [];
  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? 0;
    matches.push({
      line: locateLine(content, index),
      snippet: match[0],
    });
  }

  return matches;
}

async function main() {
  const files = await walk(mobileDir);
  const violations = [];

  for (const filePath of files) {
    const relativeFile = path.relative(rootDir, filePath).replaceAll("\\", "/");
    const content = await readFile(filePath, "utf8");

    for (const check of checks) {
      const matches = check.test
        ? check.test(relativeFile, content)
        : collectMatches(content, check.pattern);

      if (!matches || matches.length === 0) {
        continue;
      }

      for (const match of matches) {
        violations.push(`${relativeFile}:${match.line} [${check.code}] ${check.message} Found: ${match.snippet}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("Design system guard failed:\n");
    console.error(violations.join("\n"));
    process.exit(1);
  }

  console.log("Design system guard passed.");
}

await main();
