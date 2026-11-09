import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import path from "path";
import { VERSION_HISTORY } from "./version";

const root = path.resolve(import.meta.dir, "../..");
const packageVersion: string = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
).version;
const cliffConfig = readFileSync(path.join(root, "cliff.toml"), "utf8");

const parse = (version: string) => version.split(".").map(Number);
const isNewer = (a: string, b: string) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return false;
};

describe("version and release notes stay in sync", () => {
  const latest = VERSION_HISTORY[0];

  test("package.json holds a plain semver version", () => {
    expect(packageVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("the in-app version history starts with the package.json version", () => {
    expect(latest.version).toBe(packageVersion);
    expect(latest.features.length).toBeGreaterThan(0);
  });

  test("cliff.toml has release notes for the package.json version", () => {
    expect(cliffConfig).toContain(`## [${packageVersion}] - ${latest.date}`);
  });

  test("the in-app version history is newest first with real dates", () => {
    for (const entry of VERSION_HISTORY) {
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(entry.date))).toBe(false);
    }
    for (let i = 1; i < VERSION_HISTORY.length; i++) {
      const [newer, older] = [VERSION_HISTORY[i - 1], VERSION_HISTORY[i]];
      expect(isNewer(newer.version, older.version)).toBe(true);
      expect(newer.date >= older.date).toBe(true);
    }
  });
});
