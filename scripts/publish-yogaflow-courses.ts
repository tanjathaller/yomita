/**
 * Kopiert validierte `data/yogaflow-courses.json` ins ausgecheckte Daten-Repo und committet bei Änderung.
 *
 * GitHub Actions: nach `sync:yogaflow` mit zweitem Checkout (siehe Workflow).
 *
 * Env:
 * - `YOGAFLOW_PUBLISH_STRATEGY`: `none` | `git-data-repo` (Default: `none`)
 * - `YOGAFLOW_DATA_REPO_DIR`: absoluter Pfad zum Root des Daten-Repos (z. B. …/yogaflow-data-repo)
 * - `YOGAFLOW_DATA_REPO_PATH`: Zielpfad relativ zu diesem Root (Default: `yogaflow-courses.json`)
 * - Optional: `SYNC_GIT_AUTHOR_NAME`, `SYNC_GIT_AUTHOR_EMAIL` (wie im Site-Repo-Workflow)
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import yogaflowCoursesFileSchema from "../lib/schemas/yogaflow-courses-file";

const STRATEGY = (process.env.YOGAFLOW_PUBLISH_STRATEGY ?? "none").trim();
const SOURCE = path.join(process.cwd(), "data", "yogaflow-courses.json");
const DATA_REPO_DIR = (process.env.YOGAFLOW_DATA_REPO_DIR ?? "").trim();
const DATA_REPO_REL =
  (process.env.YOGAFLOW_DATA_REPO_PATH ?? "yogaflow-courses.json").trim() ||
  "yogaflow-courses.json";

function runGit(args: string[], cwd: string): void {
  execFileSync("git", args, { cwd, stdio: "inherit", env: process.env });
}

function gitStagedIsEmpty(cwd: string): boolean {
  try {
    execFileSync("git", ["diff", "--staged", "--quiet"], {
      cwd,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  if (!existsSync(SOURCE)) {
    console.error(`Publish: Quelle fehlt: ${SOURCE}`);
    process.exitCode = 1;
    return;
  }

  const raw = readFileSync(SOURCE, "utf-8");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error("Publish: JSON.parse fehlgeschlagen:", e);
    process.exitCode = 1;
    return;
  }

  try {
    yogaflowCoursesFileSchema.parse(json);
  } catch (e) {
    console.error("Publish: Zod-Validierung fehlgeschlagen:", e);
    process.exitCode = 1;
    return;
  }

  if (STRATEGY === "none") {
    console.log(
      "YOGAFLOW_PUBLISH_STRATEGY=none – kein Publish (lokal oder nur Artefakt-Erzeugung).",
    );
    return;
  }

  if (STRATEGY !== "git-data-repo") {
    console.error(
      `Unbekannte YOGAFLOW_PUBLISH_STRATEGY: ${STRATEGY} (erlaubt: none, git-data-repo)`,
    );
    process.exitCode = 1;
    return;
  }

  if (!DATA_REPO_DIR) {
    console.error(
      "YOGAFLOW_DATA_REPO_DIR fehlt – zweites Checkout (Daten-Repo) in CI setzen.",
    );
    process.exitCode = 1;
    return;
  }

  const dest = path.join(DATA_REPO_DIR, DATA_REPO_REL);
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(SOURCE, dest);
  console.log(`Publish: kopiert nach ${dest}`);

  const name =
    process.env.SYNC_GIT_AUTHOR_NAME?.trim() || "github-actions[bot]";
  const email =
    process.env.SYNC_GIT_AUTHOR_EMAIL?.trim() ||
    "41898282+github-actions[bot]@users.noreply.github.com";

  runGit(["config", "user.name", name], DATA_REPO_DIR);
  runGit(["config", "user.email", email], DATA_REPO_DIR);

  runGit(["add", "--", DATA_REPO_REL], DATA_REPO_DIR);

  if (gitStagedIsEmpty(DATA_REPO_DIR)) {
    console.log("Publish: keine Änderung am Ziel – kein Commit.");
    return;
  }

  runGit(["commit", "-m", "chore: sync YogaFlow-Kurse (data repo)"], DATA_REPO_DIR);
  runGit(["push", "origin", "HEAD"], DATA_REPO_DIR);
  console.log("Publish: Commit und Push ins Daten-Repo OK.");
}

main();
