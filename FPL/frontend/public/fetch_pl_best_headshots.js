// save as fetch_pl_best_headshots.js
// Usage:
//   node fetch_pl_best_headshots.js
//   SIZES="450x600,250x250" node fetch_pl_best_headshots.js
//   OUT=./public/players node fetch_pl_best_headshots.js

import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import pLimit from "p-limit";
import { stringify as csvStringify } from "csv-stringify/sync";

const BOOT_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";

// Try the LARGEST first. You can override via env SIZES="450x600,250x250"
const SIZE_ORDER = (process.env.SIZES || "1200x1200,450x600,250x250,110x140,40x40")
  .split(",")
  .map((s) => s.trim());

const OUT_ROOT = process.env.OUT || path.join(process.cwd(), "pl_images");

// Be nice to CDN
const CONCURRENCY = Number(process.env.CONCURRENCY || 10);
const USER_AGENT = "FPL-Best-Headshots/1.0 (+your-app)";

// Season subpaths (highest → lowest likelihood).
// Example user found: https://resources.premierleague.com/premierleague25/photos/players/450x600/118748.png
const SEASON_CANDIDATES = [
  "premierleague26", // 2025/26 (if live)
  "premierleague25", // 2024/25
  "premierleague24", // 2023/24
];

// Legacy path (works for 40/110/250 with "p{photoId}.png")
const LEGACY_BASE = "https://resources.premierleague.com/premierleague/photos/players";
const LEGACY_SIZES = new Set(["40x40", "110x140", "250x250"]); // legacy doesn't host 450x600/1200x1200

function sanitize(s) {
  return String(s || "").replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function buildSeasonUrls(photoId, size) {
  return SEASON_CANDIDATES.map(
    (season) =>
      `https://resources.premierleague.com/${season}/photos/players/${size}/${photoId}.png`
  );
}

function buildLegacyUrl(photoId, size) {
  // legacy uses a prefixed "p{photoId}.png"
  return `${LEGACY_BASE}/${size}/p${photoId}.png`;
}

async function fetchJson(url) {
  const { data } = await axios.get(url, {
    timeout: 20000,
    headers: { "User-Agent": USER_AGENT },
  });
  return data;
}

async function fetchBinary(url) {
  return axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: { "User-Agent": USER_AGENT },
    validateStatus: (s) => s >= 200 && s < 500, // treat 4xx as a miss we can handle
  });
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  console.log("Fetching FPL bootstrap-static…");
  const boot = await fetchJson(BOOT_URL);
  const players = boot.elements || [];
  const teamsById = new Map(
    (boot.teams || []).map((t) => [t.id, { name: t.name, code: t.code }])
  );

  const limit = pLimit(CONCURRENCY);
  const mapping = [];
  let saved = 0;
  let missed = 0;

  for (const size of SIZE_ORDER) {
    await ensureDir(path.join(OUT_ROOT, size));
  }

  await Promise.all(
    players.map((el) =>
      limit(async () => {
        const photoId = String(el.photo || "").replace(".jpg", ""); // e.g., "118748"
        const playerId = el.id;
        const name = `${el.first_name} ${el.second_name}`.trim();
        const web = sanitize(el.web_name || el.second_name || playerId);
        const team = teamsById.get(el.team) || { name: "Unknown", code: 0 };

        let chosenUrl = null;
        let chosenSize = null;
        let chosenData = null;
        let usedSeason = null;

        // Try each size from largest to smallest
        for (const size of SIZE_ORDER) {
          // 1) season-scoped URLs for that size
          const seasonUrls = buildSeasonUrls(photoId, size);
          for (const url of seasonUrls) {
            try {
              const res = await fetchBinary(url);
              if (res.status === 200 && res.data?.byteLength > 800) {
                chosenUrl = url;
                chosenSize = size;
                chosenData = res.data;
                usedSeason = url.split("/")[3]; // e.g. "premierleague25"
                break;
              }
            } catch (_) {}
          }
          if (chosenUrl) break;

          // 2) legacy URL for that size (only if supported)
          if (LEGACY_SIZES.has(size)) {
            const legacyUrl = buildLegacyUrl(photoId, size);
            try {
              const res = await fetchBinary(legacyUrl);
              if (res.status === 200 && res.data?.byteLength > 800) {
                chosenUrl = legacyUrl;
                chosenSize = size;
                chosenData = res.data;
                usedSeason = "premierleague-legacy";
                break;
              }
            } catch (_) {}
          }

          // else: try next, smaller size
        }

        let filename = null;
        if (chosenUrl && chosenData) {
          filename = `${playerId}-${web}.png`;
          const outDir = path.join(OUT_ROOT, chosenSize);
          await ensureDir(outDir);
          await fs.writeFile(path.join(outDir, filename), Buffer.from(chosenData));
          saved++;
        } else {
          missed++;
        }

        mapping.push({
          player_id: playerId,
          code: el.code,
          name,
          web_name: el.web_name,
          position: el.element_type, // 1=GKP,2=DEF,3=MID,4=FWD
          team_id: el.team,
          team_name: team.name,
          team_code: team.code,
          photo_id: photoId,
          selected_size: chosenSize,
          filename: filename,
          url_used: chosenUrl,
          season_path: usedSeason,
          found: Boolean(chosenUrl),
        });
      })
    )
  );

  // Write mapping outputs
  const jsonPath = path.join(OUT_ROOT, `players_map_best.json`);
  const csvPath = path.join(OUT_ROOT, `players_map_best.csv`);
  await fs.writeFile(jsonPath, JSON.stringify(mapping, null, 2), "utf-8");

  const csv = csvStringify(mapping, {
    header: true,
    columns: [
      "player_id",
      "code",
      "name",
      "web_name",
      "position",
      "team_id",
      "team_name",
      "team_code",
      "photo_id",
      "selected_size",
      "filename",
      "url_used",
      "season_path",
      "found",
    ],
  });
  await fs.writeFile(csvPath, csv, "utf-8");

  console.log(`Done. Saved ${saved} images, missed ${missed}.`);
  console.log(`Mapping files:\n  ${jsonPath}\n  ${csvPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
