// src/lib/kits.ts
export type Pos = "GKP" | "DEF" | "MID" | "FWD";

/** Long names → official PL 3-letter codes */
const TEAM_NAME_TO_CODE: Record<string, string> = {
  "arsenal":"ARS","aston villa":"AVL","bournemouth":"BOU","brentford":"BRE",
  "brighton":"BHA","brighton & hove albion":"BHA","chelsea":"CHE","crystal palace":"CRY",
  "everton":"EVE","fulham":"FUL","ipswich":"IPS","leicester":"LEI","liverpool":"LIV",
  "manchester city":"MCI","man city":"MCI","manchester united":"MUN","man united":"MUN",
  "newcastle":"NEW","nottingham forest":"NFO","southampton":"SOU","tottenham":"TOT","spurs":"TOT",
  "west ham":"WHU","wolverhampton":"WOL","wolves":"WOL","sheffield united":"SHU","burnley":"BUR","leeds":"LEE",
};

/** Your folder uses a few alternate codes—list them here. */
const FILE_CODE_ALIASES: Record<string, string[]> = {
  BHA: ["BRI"],  // Brighton
  NFO: ["NOT"],  // Nottingham Forest
  LUT: ["LDU"],  // Luton
};

export function toTeamCode(input?: string): string {
  if (!input) return "";
  const s = input.trim();
  if (/^[A-Za-z]{2,4}$/.test(s)) return s.toUpperCase(); // already code-like
  return TEAM_NAME_TO_CODE[s.toLowerCase()] ?? s.toUpperCase();
}

/** Official + your alias codes to try for a file match. */
function candidateCodes(official: string): string[] {
  const aliases = FILE_CODE_ALIASES[official] ?? [];
  return [official, ...aliases];
}

/** Candidate URLs under /public/Kits/... (tries .webp then .png). */
export function kitPathCandidates(team: string, pos: Pos): string[] {
  const official = toTeamCode(team);
  const codes = candidateCodes(official);
  const role = pos === "GKP" ? "GK" : "PLAYER";
  const suffix = pos === "GKP" ? "_GK" : "";

  const urls: string[] = [];
  for (const code of codes) {
    urls.push(`/Kits/${role}/${code}${suffix}.webp`);
    urls.push(`/Kits/${role}/${code}${suffix}.png`);
  }
  return urls;
}

/** "WHU (A)" style opponent label. */
export function opponentLabel(opp?: string, ha?: string): string {
  const code = toTeamCode(opp || "");
  const H = (ha || "").toUpperCase() === "H" ? "H" : "A";
  return code ? `${code} (${H})` : "";
}
