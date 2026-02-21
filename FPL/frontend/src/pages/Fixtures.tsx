// src/pages/Fixtures.tsx
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import API from "@/lib/api";
import PremierLeagueTable from "@/components/fpl/PremierLeagueTable";

type Fixture = {
  id: number;
  gw: number;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  kickoff?: string;
  status: 'FT' | 'upcoming' | 'live';
  homeScore: number | null;
  awayScore: number | null;
  time: string;
  dateSection: string;
};

// ... (keep the existing teamNames and venues objects)
const teamNames: Record<string, string> = {
  ARS: 'Arsenal', AVL: 'Aston Villa', BOU: 'Bournemouth', BRE: 'Brentford', BHA: 'Brighton & Hove Albion',
  BUR: 'Burnley', CHE: 'Chelsea', CRY: 'Crystal Palace', EVE: 'Everton', FUL: 'Fulham',
  LIV: 'Liverpool', LUT: 'Luton Town', MCI: 'Manchester City', MUN: 'Manchester United', NEW: 'Newcastle United',
  NFO: 'Nottingham Forest', SHU: 'Sheffield United', TOT: 'Tottenham Hotspur', WHU: 'West Ham United', WOL: 'Wolverhampton Wanderers'
};

const venues: Record<string, string> = {
  ARS: 'Emirates Stadium', AVL: 'Villa Park', BOU: 'Vitality Stadium', BRE: 'Brentford Community Stadium',
  BHA: 'Amex Stadium', BUR: 'Turf Moor', CHE: 'Stamford Bridge', CRY: 'Selhurst Park',
  EVE: 'Goodison Park', FUL: 'Craven Cottage', LIV: 'Anfield', LUT: 'Kenilworth Road',
  MCI: 'Etihad Stadium', MUN: 'Old Trafford', NEW: 'St. James\' Park', NFO: 'The City Ground',
  SHU: 'Bramall Lane', TOT: 'Tottenham Hotspur Stadium', WHU: 'London Stadium', WOL: 'Molineux Stadium'
};


export default function Fixtures() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedGameweek, setSelectedGameweek] = useState<number>(1);
  const [currentGameweek, setCurrentGameweek] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for live matches
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Calculate live match time
  const getLiveMatchTime = (kickoffTime: string): string => {
    const kickoff = new Date(kickoffTime);
    const now = currentTime;
    const diffInMinutes = Math.floor((now.getTime() - kickoff.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 0) return "0'";
    if (diffInMinutes > 120) return "120'+"; // Handle extra time
    if (diffInMinutes > 90) return `90+${diffInMinutes - 90}'`;
    
    return `${diffInMinutes}'`;
  };


  // Initialize with current gameweek on first load
  useEffect(() => {
    const initializeGameweek = async () => {
      try {
        const gameweekResponse = await API.currentGameweek();
        const currentGW = gameweekResponse.id;
        setCurrentGameweek(currentGW);
        setSelectedGameweek(currentGW);
      } catch (error) {
        console.error("Failed to fetch current gameweek:", error);
      }
    };
    
    initializeGameweek();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Fetch real fixtures data for the selected gameweek
        const fixturesResponse = await API.fixtures(selectedGameweek);
        
        if (!mounted) return;

        // Transform API response to our component format
        const transformedFixtures: Fixture[] = fixturesResponse.fixtures.map((apiFixture, index) => {
          // Format kickoff time
          const kickoffDate = new Date(apiFixture.kickoffTime);
          const time = kickoffDate.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          // Determine status
          let status: 'FT' | 'upcoming' | 'live' = 'upcoming';
          
          // Enhanced live match detection
          const now = new Date();
          const matchStarted = kickoffDate <= now;
          const matchDuration = (now.getTime() - kickoffDate.getTime()) / (1000 * 60); // minutes
          
          // Priority order: finished > started > time-based detection
          if (apiFixture.finished || (apiFixture.status && apiFixture.status.toLowerCase() === 'ft')) {
            status = 'FT';
          } else if (matchDuration > 150) {
            // If more than 2.5 hours have passed since kickoff, assume match is finished
            status = 'FT';
          } else if (apiFixture.started && !apiFixture.finished) {
            status = 'live';
          } else if (matchStarted && matchDuration >= 0 && matchDuration < 150) {
            // Only assume live if match has started recently and has active scores
            if (apiFixture.homeScore !== null && apiFixture.awayScore !== null) {
              status = 'live';
            }
          }
          
          // Debug logging for live matches
          if (status === 'live' || (apiFixture.homeScore !== null && apiFixture.awayScore !== null)) {
            console.log(`🔴 Live/Active match detected:`, {
              teams: `${apiFixture.homeTeam.name} vs ${apiFixture.awayTeam.name}`,
              status,
              started: apiFixture.started,
              finished: apiFixture.finished,
              kickoff: kickoffDate.toISOString(),
              now: now.toISOString(),
              matchDuration: matchDuration.toFixed(1) + ' minutes',
              scores: `${apiFixture.homeScore}-${apiFixture.awayScore}`
            });
          }

          return {
            id: apiFixture.id,
            gw: apiFixture.gameweek,
            homeTeam: apiFixture.homeTeam.name,
            awayTeam: apiFixture.awayTeam.name,
            homeShort: apiFixture.homeTeam.shortName,
            awayShort: apiFixture.awayTeam.shortName,
            kickoff: apiFixture.kickoffTime,
            status,
            homeScore: apiFixture.homeScore,
            awayScore: apiFixture.awayScore,
            time,
            dateSection: getDateSection(selectedGameweek, fixturesResponse.currentGameweek, index, kickoffDate)
          };
        });

        setFixtures(transformedFixtures);
        setCurrentGameweek(fixturesResponse.currentGameweek);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load fixtures");
        setFixtures([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedGameweek]);

  // Helper function to determine date section based on actual kickoff dates
  const getDateSection = (selectedGW: number, currentGW: number, index: number, kickoffDate: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDate = new Date(kickoffDate.getFullYear(), kickoffDate.getMonth(), kickoffDate.getDate());
    
    const diffTime = matchDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // For past gameweeks, group by actual match dates
    if (selectedGW < currentGW) {
      return matchDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
    
    // For current/future gameweeks, use relative dates when appropriate
    if (diffDays < -1) {
      return matchDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      // Format future dates
      return matchDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-white/20 rounded mb-6" />
            <div className="h-12 w-64 bg-white/20 rounded mb-8" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/10 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Matches</h1>
          <p className="text-destructive">Couldn't load fixtures: {err}</p>
        </div>
      </div>
    );
  }

  // Group fixtures by date section
  const fixturesByDate = fixtures.reduce((acc, fixture) => {
    if (!acc[fixture.dateSection]) {
      acc[fixture.dateSection] = [];
    }
    acc[fixture.dateSection].push(fixture);
    return acc;
  }, {} as Record<string, Fixture[]>);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Matchweek Navigation */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          <button 
            onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-semibold">Matchweek {selectedGameweek}</div>
          </div>
          
          <button 
            onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area: Flex container for side-by-side layout */}
        <div className="flex flex-col lg:flex-row lg:gap-8 max-w-7xl mx-auto">

          {/* Fixtures Section (60% width on large screens) */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white/5 rounded-lg">
              {Object.entries(fixturesByDate).map(([dateSection, dayFixtures], index) => (
                <div key={dateSection} className="p-4">
                  {/* Date Section Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-white/90">{dateSection}</h2>
                  </div>

                  {/* Fixtures List */}
                  <div className="space-y-0">
                    {dayFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="flex items-center justify-between py-3 px-2 hover:bg-white/5 transition-colors rounded-md"
                      >
                        {/* Status/Time */}
                        <div className="w-16 text-center">
                          {fixture.status === 'FT' ? (
                            <span className="text-xs font-semibold text-white bg-muted px-2 py-1 rounded">
                              FT
                            </span>
                          ) : fixture.status === 'live' && fixture.kickoff ? (
                            <span className="text-sm font-semibold text-destructive bg-red-600/20 px-2 py-1 rounded animate-pulse">
                              {getLiveMatchTime(fixture.kickoff)}
                            </span>
                          ) : (
                            <span className="text-sm text-white/70">{fixture.time}</span>
                          )}
                        </div>

                        {/* Home Team */}
                        <div className="flex items-center justify-end flex-1 pr-4">
                          <span className="text-white font-medium mr-3">{fixture.homeTeam}</span>
                          <img 
                            src={`/logos/${fixture.homeShort}.png`} 
                            alt={fixture.homeTeam}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Score */}
                        <div className="mx-4 text-center min-w-[70px]">
                          {fixture.status === 'FT' && fixture.homeScore !== null && fixture.awayScore !== null ? (
                            <div className="text-xl font-bold text-white">
                              {fixture.homeScore} - {fixture.awayScore}
                            </div>
                          ) : fixture.status === 'live' && fixture.homeScore !== null && fixture.awayScore !== null ? (
                            <div className="text-lg font-bold text-destructive">
                              {fixture.homeScore} - {fixture.awayScore}
                            </div>
                          ) : (
                            <div className="text-md text-white/50">-</div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center flex-1 pl-4">
                          <img 
                            src={`/logos/${fixture.awayShort}.png`} 
                            alt={fixture.awayTeam}
                            className="w-6 h-6 object-contain mr-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-white font-medium">{fixture.awayTeam}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {!fixtures.length && (
                <div className="text-center py-12 text-white/70">
                  No fixtures available for this matchweek.
                </div>
              )}
            </div>
          </div>

          {/* Premier League Table Section (40% width on large screens) */}
          <div className="w-full lg:w-2/5 mt-8 lg:mt-0">
              <PremierLeagueTable showTitle={false} />
          </div>
          
        </div>
      </div>
    </div>
  );
}