// src/pages/PickTeam.tsx
import { useMemo, useState, useEffect } from "react";
import SidebarLeft from "@/components/fpl/SidebarLeft";
import HeroTabs from "@/components/fpl/HeroTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Pitch from "@/components/fpl/Pitch";
import PlayerCard from "@/components/fpl/PlayerCard";
import PlayerSheet from "@/components/fpl/PlayerSheet";
import API, { type TeamPlayer, type TeamSquad, type GameweekInfo } from "@/lib/api";

// formations map: [GKP, DEF, MID, FWD]
const FORMATIONS: Record<string, [number, number, number, number]> = {
  "3-4-3": [1, 3, 4, 3],
  "4-4-2": [1, 4, 4, 2],
  "4-3-3": [1, 4, 3, 3],
};

// Helper function to format deadline time
function formatDeadline(deadlineTime: string, currentTime: Date = new Date()): string {
  try {
    const deadline = new Date(deadlineTime);
    const diffMs = deadline.getTime() - currentTime.getTime();
    
    if (diffMs <= 0) {
      return "Deadline passed";
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  } catch (error) {
    return "—";
  }
}

export default function PickTeam() {
  const [formation] = useState<keyof typeof FORMATIONS>("3-4-3");
  const [squad, setSquad] = useState<TeamSquad | null>(null);
  const [gameweekInfo, setGameweekInfo] = useState<GameweekInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // PlayerSheet state
  const [selectedPlayer, setSelectedPlayer] = useState<TeamPlayer | null>(null);
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);

  // For demo purposes, using a sample user ID. In a real app, this would come from auth
  const USER_ID = 123456; // Replace with actual user ID from authentication

  // PlayerSheet handlers
  const handlePlayerClick = (player: TeamPlayer) => {
    setSelectedPlayer(player);
    setIsPlayerSheetOpen(true);
  };

  const handleClosePlayerSheet = () => {
    setIsPlayerSheetOpen(false);
    setSelectedPlayer(null);
  };

  const handleMakeCaptain = (playerId: number) => {
    // TODO: Implement captain selection API call
    console.log('Make captain:', playerId);
  };

  const handleMakeViceCaptain = (playerId: number) => {
    // TODO: Implement vice captain selection API call  
    console.log('Make vice captain:', playerId);
  };

  const handleSubstitute = (playerId: number) => {
    // TODO: Implement substitute functionality
    console.log('Substitute player:', playerId);
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const response = await API.team(USER_ID);
        setSquad(response.squad);
        setGameweekInfo(response.gameweekInfo);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch team data:", err);
        setError("Failed to load team data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  // Update the current time every minute to keep deadline countdown live
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Flatten the squad into a single list for convenience
  const allPlayers = useMemo<TeamPlayer[]>(
    () => squad ? [...squad.GKP, ...squad.DEF, ...squad.MID, ...squad.FWD] : [],
    [squad]
  );

  const [gNeed, dNeed, mNeed, fNeed] = FORMATIONS[formation];

  // Filter players by starting position (position 1-11 are starters, 12-15 are bench)
  const starters = useMemo(() => {
    if (!squad) return [];
    const starterPlayers = allPlayers.filter((p) => p.position && p.position <= 11);
    
    // Sort by position to maintain formation order
    return starterPlayers.sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [allPlayers, squad]);

  // bench players (positions 12-15)
  const bench = useMemo(() => {
    if (!squad) return [];
    return allPlayers
      .filter((p) => p.position && p.position > 11)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [allPlayers, squad]);

  // rows for the pitch based on actual formation logic
  const gkpRow = starters.filter((p) => p.pos === "GKP");
  const defRow = starters.filter((p) => p.pos === "DEF");
  const midRow = starters.filter((p) => p.pos === "MID");
  const fwdRow = starters.filter((p) => p.pos === "FWD");

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-white text-xl">Loading your team...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-4 self-start">
          <SidebarLeft />
        </aside>

        {/* CENTER */}
        <main className="lg:col-span-9 space-y-6 flex flex-col items-center">
          <div className="w-full max-w-[1000px]">
            <HeroTabs 
              title="Pick Team" 
              gameweekLabel={gameweekInfo?.name || "—"} 
              deadlineLabel={gameweekInfo?.deadlineTime ? formatDeadline(gameweekInfo.deadlineTime, currentTime) : "—"} 
            />
          </div>

          {/* Pitch */}
          <section className="w-full max-w-[1000px] rounded-2xl overflow-visible bg-card border border-white/10">
            <div className="px-2 sm:px-4 pb-5">
              <Pitch variant="half" className="pt-2">
                <div className="max-w-[980px] mx-auto space-y-4 md:space-y-5">
                  {/* GK */}
                  <div className="flex justify-center gap-8 md:gap-10">
                    {gkpRow.map((p) => (
                      <PlayerCard
                        key={p.id}
                        kitCandidates={p.kitCandidates}
                        name={p.name}
                        opponent={p.nextFixture}
                        status={p.status}
                        liveMatch={p.liveMatch}
                        onClick={() => handlePlayerClick(p)}
                      />
                    ))}
                  </div>

                  {/* DEF */}
                  <div className="flex justify-center gap-8 md:gap-10">
                    {defRow.map((p) => (
                      <PlayerCard
                        key={p.id}
                        kitCandidates={p.kitCandidates}
                        name={p.name}
                        opponent={p.nextFixture}
                        status={p.status}
                        liveMatch={p.liveMatch}
                        onClick={() => handlePlayerClick(p)}
                      />
                    ))}
                  </div>

                  {/* MID */}
                  <div className="flex justify-center gap-8 md:gap-10">
                    {midRow.map((p) => (
                      <PlayerCard
                        key={p.id}
                        kitCandidates={p.kitCandidates}
                        name={p.name}
                        opponent={p.nextFixture}
                        status={p.status}
                        liveMatch={p.liveMatch}
                        onClick={() => handlePlayerClick(p)}
                      />
                    ))}
                  </div>

                  {/* FWD */}
                  <div className="flex justify-center gap-8 md:gap-10">
                    {fwdRow.map((p) => (
                      <PlayerCard
                        key={p.id}
                        kitCandidates={p.kitCandidates}
                        name={p.name}
                        opponent={p.nextFixture}
                        status={p.status}
                        liveMatch={p.liveMatch}
                        onClick={() => handlePlayerClick(p)}
                      />
                    ))}
                  </div>
                </div>
              </Pitch>

              {/* Bench */}
              <div className="relative w-full -mt-12">
                <div
                  className="mx-auto w-[70%] max-w-[720px] rounded-t-xl px-10 py-5 shadow-lg"
                  style={{ background: "linear-gradient(180deg, #2a9c5d 0%, #210724 100%)" }}
                >
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <BenchSlot label="GKP" p={bench[0]} onPlayerClick={handlePlayerClick} />
                    <BenchSlot label="1. DEF" p={bench[1]} onPlayerClick={handlePlayerClick} />
                    <BenchSlot label="2. DEF" p={bench[2]} onPlayerClick={handlePlayerClick} />
                    <BenchSlot label="3. FWD" p={bench[3]} onPlayerClick={handlePlayerClick} />
                  </div>
                </div>

                <div className="mx-auto w-[70%] max-w-[720px] bg-background text-center py-3 rounded-b-xl">
                  <span className="text-white font-bold">Substitutes</span>
                </div>
              </div>

              {/* Save */}
              <div className="mx-auto max-w-[980px] mt-6">
                <div className="text-center">
                  <button className="inline-flex items-center rounded-lg bg-accent text-black font-semibold px-5 py-2 shadow hover:brightness-95">
                    Save Your Team
                  </button>
                </div>
                <p className="mt-3 text-xs text-white/80 text-center">
                  Team data loaded from Fantasy Premier League API
                </p>
              </div>
            </div>
          </section>

          {/* Extras (static placeholders) */}
          <section className="w-full max-w-[1000px] grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Team news</CardTitle>
              </CardHeader>
              <CardContent className="text-white/90">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 h-24" />
                  <div className="rounded-lg bg-white/5 h-24" />
                  <div className="rounded-lg bg-white/5 h-24" />
                  <div className="rounded-lg bg-white/5 h-24" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Fixtures</CardTitle>
              </CardHeader>
              <CardContent className="text-white/90">
                <div className="space-y-3">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="rounded-lg bg-white/5 h-12" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      {/* PlayerSheet */}
      <PlayerSheet
        open={isPlayerSheetOpen}
        onOpenChange={handleClosePlayerSheet}
        player={selectedPlayer}
        onMakeCaptain={handleMakeCaptain}
        onMakeViceCaptain={handleMakeViceCaptain}
        onSubstitute={handleSubstitute}
      />
    </div>
  );
}

/** Small bench cell with label + card or placeholder */
function BenchSlot({ label, p, onPlayerClick }: { label: string; p?: TeamPlayer; onPlayerClick?: (player: TeamPlayer) => void }) {
  return (
    <div>
      <div className="text-xs font-bold text-white/90 mb-1">{label}</div>
      {p ? (
        <PlayerCard
          kitCandidates={p.kitCandidates}
          name={p.name}
          opponent={p.nextFixture}
          status={p.status}
          liveMatch={p.liveMatch}
          onClick={() => onPlayerClick?.(p)}
        />
      ) : (
        <div className="h-[157px] w-[114px] mx-auto rounded-xl bg-white/20 border border-white/20" />
      )}
    </div>
  );
}
