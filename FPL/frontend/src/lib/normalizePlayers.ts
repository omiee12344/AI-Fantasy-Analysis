// src/lib/normalizePlayers.ts
import { kitPathCandidates, opponentLabel, toTeamCode, Pos } from "@/lib/kits";

export type PlayerStatus = "available" | "yellow" | "red";

export type NormalizedPlayer = {
  id: string | number;
  name: string;            // full name; UI shows last name only
  pos: Pos;                // GKP | DEF | MID | FWD
  team: string;            // team code (e.g., CHE)
  nextFixture: string;     // "WHU (A)"
  status: PlayerStatus;
  kitCandidates: string[]; // list of candidate shirt URLs
};

/** Convert backend payload to a clean shape the UI expects. */
export function coercePlayers(raw: any): NormalizedPlayer[] {
  const arr: any[] = Array.isArray(raw) ? raw : raw?.players || raw?.data || [];
  return arr
    .map((p: any, idx: number) => {
      const name =
        p.name ??
        p.web_name ??
        p.player_name ??
        ((`${p.first_name ?? ""} ${p.second_name ?? ""}`).trim() || `Player ${idx + 1}`);

      // position
      const posRaw = String(p.position ?? p.position_short ?? p.element_type ?? p.pos ?? "").toUpperCase();
      const posMap: Record<string, Pos> = {
        "1": "GKP", "2": "DEF", "3": "MID", "4": "FWD",
        "GK": "GKP", "GKP": "GKP", "DEF": "DEF", "MID": "MID", "FWD": "FWD", "FW": "FWD",
      };
      const pos: Pos =
        posMap[posRaw] ?? (["GKP", "DEF", "MID", "FWD"].includes(posRaw) ? (posRaw as Pos) : "MID");

      // team code
      const team = toTeamCode(
        p.team_short_name ?? p.team_short ?? p.team ?? p.team_name ?? ""
      );

      // opponent label
      const opp = p.next_fixture_short ?? p.next_opponent_short ?? p.opponent_short ?? p.opp ?? p.next_opponent ?? "";
      const ha  = p.next_fixture_ha ?? p.h_a ?? p.home_away ?? p.hA ?? "";
      const nextFixture = opponentLabel(opp, ha);

      // status
      const s = String(p.injury_status ?? p.news ?? p.status ?? "").toLowerCase();
      const status: PlayerStatus =
        s.includes("inj") || s.includes("red")
          ? "red"
          : s.includes("doubt") || s.includes("yellow")
          ? "yellow"
          : "available";

      return {
        id: p.id ?? p.code ?? idx,
        name,
        pos,
        team,
        nextFixture,
        status,
        kitCandidates: p.kitCandidates ?? kitPathCandidates(team, pos),
      } as NormalizedPlayer;
    })
    .filter(Boolean);
}
