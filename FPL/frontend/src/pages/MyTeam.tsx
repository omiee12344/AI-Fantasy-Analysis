import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import SidebarLeft from "@/components/fpl/SidebarLeft";
import AIOverviewSidebar from "@/components/fpl/AIOverviewSidebar";
import HeroTabs from "@/components/fpl/HeroTabs";
import Pitch from "@/components/fpl/Pitch";
import PlayerCard from "@/components/fpl/PlayerCard";
import PlayerSelectionSidebar from "@/components/fpl/PlayerSelectionSidebar";
import PlayerSheet from "@/components/fpl/PlayerSheet";
import { SubstitutionIndicator } from "@/components/fpl/SubstitutionIndicator";
import SubstitutionSelectionSidebar from "@/components/fpl/SubstitutionSelectionSidebar";
import { Badge } from "@/components/ui/badge";
import API, { type LivePlayer, type Pos, type TeamPlayer } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
// import { useTeamPersistence } from "@/hooks/useTeamPersistence"; // Removed - using direct API calls
import { setTeamSaveBeforeLogout } from "@/hooks/useLogoutWithTeamSave";
import { useGameweekManager } from "@/hooks/useGameweekManager";
import { usePointsCalculation } from "@/hooks/usePointsCalculation";
// import { firebaseTeamService, SavedTeamData } from "@/lib/firebase-team-service"; // Removed - using direct API calls
import { 
  simulateGameweekResult, 
  type SubstitutionPlayer 
} from "@/lib/substitutions";
import {
  validateFPLFormation,
  validateSubstitution,
  canSubstitutePositions,
  countPlayersByPosition,
  getFormationDisplayName,
  canAddToBench,
  getAvailableBenchSlots,
  type FPLValidationResult
} from "@/lib/formation-validator";

// Dynamic formation - no longer using fixed formations

// Player slot type for building team
type PlayerSlot = {
  id: string;
  position: Pos;
  player?: LivePlayer & { 
    opponent?: string; 
    liveMatch?: any;
    fixtures?: any[];
    played_minutes?: number;
    is_captain?: boolean;
    is_vice_captain?: boolean;
  };
};

// FPL Rules Constants
const BUDGET_LIMIT = 100.0; // £100M
const MAX_PLAYERS_PER_TEAM = 3;
const SQUAD_SIZE = 15; // 11 starting + 4 bench

export default function MyTeam() {
  const { user, updateProfile } = useAuth();
  const [startingXI, setStartingXI] = useState<PlayerSlot[]>([]);
  const [bench, setBench] = useState<PlayerSlot[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [viceCaptainId, setViceCaptainId] = useState<number | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isSubstitutionSelectionOpen, setIsSubstitutionSelectionOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PlayerSlot | null>(null);
  const [allPlayers, setAllPlayers] = useState<LivePlayer[]>([]);
  const [opponentsMap, setOpponentsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [hasRestoredTeam, setHasRestoredTeam] = useState(false);

  // Use the new comprehensive gameweek management system
  const { 
    gameweekData: comprehensiveGameweekData, 
    displayData, 
    currentFixtures, 
    loading: gameweekLoading, 
    error: gameweekError,
    refreshGameweek: refreshComprehensiveGameweek
  } = useGameweekManager();

  // Create compatibility layer for old gameweekData format
  const gameweekData = comprehensiveGameweekData ? {
    id: comprehensiveGameweekData.currentGameweek.id,
    name: comprehensiveGameweekData.currentGameweek.name,
    deadline_time: comprehensiveGameweekData.currentGameweek.deadline_time,
    deadline_time_epoch: comprehensiveGameweekData.currentGameweek.deadline_time_epoch,
    finished: comprehensiveGameweekData.completion.isComplete,
    is_current: true,
    is_next: false,
    teams: comprehensiveGameweekData.teams
  } : null;
  
  // PlayerSheet state
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<TeamPlayer | null>(null);
  const [transferSlot, setTransferSlot] = useState<PlayerSlot | null>(null);

  // Initialize empty slots (starting XI will be dynamic, bench is fixed)
  useEffect(() => {
    const benchSlots: PlayerSlot[] = [];

    // Create bench slots (1 GKP, 3 flexible outfield slots)
    benchSlots.push({ id: "BENCH-GKP", position: "GKP" });
    benchSlots.push({ id: "BENCH-1", position: "DEF" }); // Flexible outfield slots
    benchSlots.push({ id: "BENCH-2", position: "MID" });
    benchSlots.push({ id: "BENCH-3", position: "FWD" });

    setBench(benchSlots);

    // Initialize with a flexible formation (4-4-2) that matches common FPL setups
    const initialStartingXI: PlayerSlot[] = [
      { id: "XI-GKP-1", position: "GKP" },
      // Defenders (4)
      { id: "XI-DEF-1", position: "DEF" },
      { id: "XI-DEF-2", position: "DEF" },
      { id: "XI-DEF-3", position: "DEF" },
      { id: "XI-DEF-4", position: "DEF" },
      // Midfielders (4)
      { id: "XI-MID-1", position: "MID" },
      { id: "XI-MID-2", position: "MID" },
      { id: "XI-MID-3", position: "MID" },
      { id: "XI-MID-4", position: "MID" },
      // Forwards (2)
      { id: "XI-FWD-1", position: "FWD" },
      { id: "XI-FWD-2", position: "FWD" },
    ];

    setStartingXI(initialStartingXI);
  }, []);


  // Function to manually restore team from localStorage
  const manualRestoreTeam = () => {
    try {
      const backupData = localStorage.getItem('fpl-myteam-backup');
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        console.log('🔧 Manually restoring team from localStorage:', parsedBackup);
        
        // Force restore the team data
        if (parsedBackup.startingXI && Array.isArray(parsedBackup.startingXI)) {
          // Restore starting XI
          const restoredStartingXI = startingXI.map(slot => {
            const savedPlayer = parsedBackup.startingXI.find((p: any) => p.slotId === slot.id);
            if (savedPlayer) {
              const player = allPlayers.find((p: any) => p.id === savedPlayer.id);
              if (player) {
                return { ...slot, player };
              }
            }
            return slot;
          });
          setStartingXI(restoredStartingXI);
        }
        
        if (parsedBackup.bench && Array.isArray(parsedBackup.bench)) {
          // Restore bench
          const restoredBench = bench.map(slot => {
            const savedPlayer = parsedBackup.bench.find((p: any) => p.slotId === slot.id);
            if (savedPlayer) {
              const player = allPlayers.find((p: any) => p.id === savedPlayer.id);
              if (player) {
                return { ...slot, player };
              }
            }
            return slot;
          });
          setBench(restoredBench);
        }
        
        if (parsedBackup.captainId) setCaptainId(parsedBackup.captainId);
        if (parsedBackup.viceCaptainId) setViceCaptainId(parsedBackup.viceCaptainId);
        
        toast.success('Team restored from backup!');
      } else {
        toast.error('No backup team found');
      }
    } catch (error) {
      console.error('Failed to restore team manually:', error);
      toast.error('Failed to restore team');
    }
  };

  // Function to manually refresh all data
  const refreshGameweekData = async () => {
    try {
      // Refresh gameweek data using the comprehensive system
      await refreshComprehensiveGameweek();
      
      // Refresh players and opponents data to stay synchronized
      const [playersResponse, opponentsResponse] = await Promise.all([
        API.players(),
        API.opponentsMap()
      ]);
      
      setAllPlayers(playersResponse.players);
      setOpponentsMap(opponentsResponse.map || {});
      
      toast.success(`Data refreshed successfully`);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Fetch players and opponents data on component mount
  useEffect(() => {
    const fetchBasicData = async () => {
      try {
        setLoading(true);
        const [playersResponse, opponentsResponse] = await Promise.all([
          API.players(),
          API.opponentsMap()
        ]);
        
        setAllPlayers(playersResponse.players);
        setOpponentsMap(opponentsResponse.map || {});
      } catch (error) {
        console.error("Failed to fetch basic data:", error);
        toast.error("Failed to load player data");
      } finally {
        setLoading(false);
      }
    };

    fetchBasicData();
  }, []);



  // Helper functions for fixture status checking
  const areAllFixturesFinished = (fixtures: typeof currentFixtures): boolean => {
    return fixtures.length > 0 && fixtures.every(fixture => fixture.finished);
  };

  const haveAnyFixturesStarted = (fixtures: typeof currentFixtures): boolean => {
    return fixtures.some(fixture => fixture.started);
  };

  // Note: Gameweek transition monitoring is now handled by useGameweekManager hook
  // This eliminates redundant API calls and prevents ERR_INSUFFICIENT_RESOURCES errors

  // Update opponent data for existing players when opponentsMap changes OR team is restored
  useEffect(() => {
    if (Object.keys(opponentsMap).length > 0) {
      console.log('🔄 Updating opponent data for existing players with new opponentsMap:', opponentsMap);
      console.log('🔄 Team restoration state:', { hasRestoredTeam, startingXICount: startingXI.filter(s => s.player).length, benchCount: bench.filter(s => s.player).length });
      
      // Update starting XI players with new opponent data
      setStartingXI(prev => prev.map(slot => {
        if (slot.player) {
          const newOpponent = opponentsMap[slot.player.team];
          if (newOpponent) {
            console.log(`📍 Updated ${slot.player.name} opponent: ${slot.player.opponent || 'undefined'} → ${newOpponent}`);
            return {
              ...slot,
              player: {
                ...slot.player,
                opponent: newOpponent
              }
            };
          }
        }
        return slot;
      }));

      // Update bench players with new opponent data
      setBench(prev => prev.map(slot => {
        if (slot.player) {
          const newOpponent = opponentsMap[slot.player.team];
          if (newOpponent) {
            console.log(`📍 Updated ${slot.player.name} opponent: ${slot.player.opponent || 'undefined'} → ${newOpponent}`);
            return {
              ...slot,
              player: {
                ...slot.player,
                opponent: newOpponent
              }
            };
          }
        }
        return slot;
      }));
    }
  }, [opponentsMap]);

  // Handle captain selection
  const handleSetCaptain = (playerId: number) => {
    if (captainId === playerId) {
      // Remove captain if clicking on current captain
      setCaptainId(null);
    } else {
      // Set new captain, move old captain to vice-captain if needed
      if (viceCaptainId === playerId) {
        setViceCaptainId(captainId);
      }
      setCaptainId(playerId);
    }
    
    // Auto-save the team after captain change
    // Auto-save removed - using direct API calls for fresh data
  };

  const handleSetViceCaptain = (playerId: number) => {
    if (viceCaptainId === playerId) {
      // Remove vice-captain if clicking on current vice-captain
      setViceCaptainId(null);
    } else if (captainId === playerId) {
      // Can't set captain as vice-captain
      toast.error("Player is already captain");
    } else {
      setViceCaptainId(playerId);
    }
    
    // Auto-save the team after vice-captain change
    // Auto-save removed - using direct API calls for fresh data
  };

  // Handle slot click - either player selection for empty slot or player sheet for filled slot
  const handleSlotClick = (slot: PlayerSlot, event?: React.MouseEvent) => {
    if (slot.player) {
      // Check for modifier keys for captain selection
      if (event?.ctrlKey || event?.metaKey) {
        handleSetCaptain(slot.player.id);
        return;
      }
      if (event?.shiftKey) {
        handleSetViceCaptain(slot.player.id);
        return;
      }

      // Show player sheet for filled slots
      const teamPlayer: TeamPlayer = {
        id: slot.player.id,
        name: slot.player.name,
        pos: slot.player.pos,
        team: slot.player.team,
        nextFixture: slot.player.opponent || "—",
        status: slot.player.status as "available" | "yellow" | "red",
        kitCandidates: [`/Kits/PLAYER/${slot.player.team}.webp`],
        liveMatch: slot.player.liveMatch || null,
        is_captain: slot.player.id === captainId,
        is_vice_captain: slot.player.id === viceCaptainId
      };
      setSelectedPlayer(teamPlayer);
      setTransferSlot(slot);
      setIsPlayerSheetOpen(true);
    } else {
      // Show player selection for empty slots
      setSelectedSlot(slot);
      setIsPlayerSelectionOpen(true);
    }
  };

  // Team validation functions
  const getAllSelectedPlayers = () => {
    const teamPlayers = startingXI.map(slot => slot.player).filter((player): player is NonNullable<typeof player> => Boolean(player));
    const benchPlayers = bench.map(slot => slot.player).filter((player): player is NonNullable<typeof player> => Boolean(player));
    return [...teamPlayers, ...benchPlayers];
  };

  // Points calculation functions
  const calculateCurrentGameweekPoints = () => {
    // Calculate points from both starting XI and bench
    const allPlayers = [
      ...startingXI.map(slot => slot.player).filter((player): player is NonNullable<typeof player> => Boolean(player)),
      ...bench.map(slot => slot.player).filter((player): player is NonNullable<typeof player> => Boolean(player))
    ];
    return allPlayers.reduce((total, player) => {
      return total + (player?.total_points || 0);
    }, 0);
  };

  const calculateTotalSeasonPoints = () => {
    // For now, we'll use the current gameweek points as total points
    // In a real app, this would come from historical gameweek data
    const currentGWPoints = calculateCurrentGameweekPoints();
    const previousPoints = user?.profile.totalPoints || 0;
    
    // If we have a new team, add current GW points to previous total
    // This is a simplified calculation - in reality you'd track historical data
    return Math.max(previousPoints, currentGWPoints);
  };

  // Update user profile with calculated points (only for non-FPL users)
  const updateUserPoints = useCallback(async () => {
    if (!user) return;
    
    // Don't override FPL data - only update calculated values for non-FPL users
    if (user.profile.fplTeamId) {
      console.log('🚫 Skipping points update - FPL data should not be overridden');
      return;
    }

    const gameweekPoints = calculateCurrentGameweekPoints();
    const totalPoints = calculateTotalSeasonPoints();
    
    try {
      await updateProfile({
        ...user.profile,
        gameweekPoints,
        totalPoints,
        teamValue: getTotalTeamValue(),
        bank: BUDGET_LIMIT - getTotalTeamValue(),
        currentGameweek: gameweekData?.id || user.profile.currentGameweek
      });
      console.log('✅ Updated calculated points for non-FPL user');
    } catch (error) {
      console.error('Failed to update user points:', error);
    }
  }, [user, gameweekData?.id, startingXI, bench, updateProfile]);

  // Update user points when team composition changes (only for non-FPL users)
  useEffect(() => {
    if (user && startingXI.length > 0) {
      console.log('🔄 Team composition changed, checking if points update needed...', {
        hasFPLConnection: !!user.profile.fplTeamId,
        startingXICount: startingXI.filter(s => s.player).length,
        benchCount: bench.filter(s => s.player).length
      });
      
      // Debounce the update to avoid too many API calls
      const timeout = setTimeout(() => {
        updateUserPoints();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [updateUserPoints, user]);

  const getTotalTeamValue = () => {
    return getAllSelectedPlayers().reduce((total, player) => {
      return total + ((player?.now_cost || 0) / 10);
    }, 0);
  };

  const getTeamCounts = () => {
    const selectedPlayers = getAllSelectedPlayers();
    const teamCounts: Record<string, number> = {};
    
    selectedPlayers.forEach(player => {
      if (player?.team) {
        teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
      }
    });
    
    return teamCounts;
  };

  const validatePlayerSelection = (newPlayer: LivePlayer): { valid: boolean; message?: string } => {
    const selectedPlayers = getAllSelectedPlayers();
    
    // Check if player is already selected
    if (selectedPlayers.some(p => p?.id === newPlayer.id)) {
      return { valid: false, message: "Player is already in your squad" };
    }

    // Check budget constraint
    const currentValue = getTotalTeamValue();
    const newPlayerValue = (newPlayer.now_cost || 0) / 10;
    if (currentValue + newPlayerValue > BUDGET_LIMIT) {
      return { 
        valid: false, 
        message: `Would exceed budget limit of £${BUDGET_LIMIT}M` 
      };
    }

    // Check max players per team constraint
    const teamCounts = getTeamCounts();
    if ((teamCounts[newPlayer.team] || 0) >= MAX_PLAYERS_PER_TEAM) {
      return { 
        valid: false, 
        message: `Cannot have more than ${MAX_PLAYERS_PER_TEAM} players from ${newPlayer.team}` 
      };
    }

    // Check squad composition for bench players
    if (selectedSlot?.id.startsWith("BENCH-")) {
      const startingXIWithPlayers = startingXI.filter(slot => slot.player);
      const benchWithPlayers = bench.filter(slot => slot.player);
      
      if (!canAddToBench(
        startingXIWithPlayers.map(slot => ({ pos: slot.player!.pos })),
        benchWithPlayers.map(slot => ({ pos: slot.player!.pos })),
        newPlayer.pos
      )) {
        const availableSlots = getAvailableBenchSlots(
          startingXIWithPlayers.map(slot => ({ pos: slot.player!.pos }))
        );
        
        return { 
          valid: false, 
          message: `Cannot add more ${newPlayer.pos} to bench. Available: ${availableSlots[newPlayer.pos.toLowerCase() as keyof typeof availableSlots]} ${newPlayer.pos} slots` 
        };
      }
    }

    return { valid: true };
  };

  // Enhanced player selection with validation and opponent data
  const handlePlayerSelect = async (player: LivePlayer) => {
    if (!selectedSlot) return;

    // Validate the selection
    const validation = validatePlayerSelection(player);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setLoadingPlayer(true);
    
    try {
      // Fetch additional player data (fixtures, live match data)
      const [metaData, fixturesData] = await Promise.all([
        API.playerMeta(player.id).catch(() => null),
        API.playerFixtures(player.id).catch(() => null)
      ]);

      // Enhanced player object with opponent and fixture data
      const enhancedPlayer = {
        ...player,
        opponent: player.nextFixture || opponentsMap[player.team] || "—",
        fixtures: fixturesData?.fixtures || [],
        meta: metaData,
        // TODO: Add live match data when available
        liveMatch: null
      };

      // Update the appropriate slot
      if (selectedSlot.id.startsWith("BENCH-")) {
        setBench(prev => prev.map(slot => 
          slot.id === selectedSlot.id 
            ? { ...slot, player: enhancedPlayer } 
            : slot
        ));
      } else {
        setStartingXI(prev => prev.map(slot => 
          slot.id === selectedSlot.id 
            ? { ...slot, player: enhancedPlayer } 
            : slot
        ));
      }

      toast.success(`${player.name} added to your team`);
      
      // Auto-save the team
      // Auto-save removed - using direct API calls for fresh data
    } catch (error) {
      console.error("Failed to fetch player details:", error);
      toast.error("Failed to add player");
    } finally {
      setLoadingPlayer(false);
    }

    setIsPlayerSelectionOpen(false);
    setSelectedSlot(null);
  };

  // PlayerSheet handlers
  const handleClosePlayerSheet = () => {
    setIsPlayerSheetOpen(false);
    setSelectedPlayer(null);
    setTransferSlot(null);
  };

  const handleTransferPlayer = () => {
    if (transferSlot) {
      // Close player sheet and open player selection for transfer
      setIsPlayerSheetOpen(false);
      setSelectedSlot(transferSlot);
      setIsPlayerSelectionOpen(true);
    }
  };

  const handleSubstitutePlayer = (playerId: number) => {
    if (transferSlot && transferSlot.player) {
      // Close player sheet and open substitution selection
      setIsPlayerSheetOpen(false);
      setIsSubstitutionSelectionOpen(true);
    }
  };

  const handleSubstitutionSelection = (substituteId: string) => {
    if (!transferSlot) return;

    // Find the substitute slot
    const allSlots = [...startingXI, ...bench];
    const substituteSlot = allSlots.find(slot => slot.id === substituteId);
    
    if (substituteSlot && transferSlot) {
      performPlayerSubstitution(transferSlot, substituteSlot);
      setIsSubstitutionSelectionOpen(false);
    }
  };

  const getAvailableSubstitutes = () => {
    if (!transferSlot?.player) return [];

    const allPlayerSlots = [...startingXI, ...bench];
    const currentPlayerSlot = transferSlot;
    
    return allPlayerSlots
      .filter(slot => 
        slot.player && 
        slot.id !== currentPlayerSlot.id &&
        // Use formation validation logic for substitution eligibility
        canSubstitutePositions(
          currentPlayerSlot.player!.pos, 
          slot.player!.pos
        )
      )
      .map(slot => ({
        id: slot.id,
        player: slot.player!,
        isInStartingXI: startingXI.includes(slot)
      }));
  };

  const performPlayerSubstitution = (playerSlot: PlayerSlot, substituteSlot: PlayerSlot) => {
    if (!playerSlot.player || !substituteSlot.player) return;

    // Check position compatibility first
    if (!canSubstitutePositions(playerSlot.player.pos, substituteSlot.player.pos)) {
      toast.error("Cannot substitute: Position mismatch (Goalkeepers can only swap with goalkeepers)");
      return;
    }

    // Validate the substitution would result in a valid formation
    const playerInStartingXI = startingXI.includes(playerSlot);
    const subInStartingXI = startingXI.includes(substituteSlot);
    
    // If both are in starting XI or both on bench, it's just a position swap (no formation change)
    if ((playerInStartingXI && subInStartingXI) || (!playerInStartingXI && !subInStartingXI)) {
      // Simple swap - no formation validation needed
      performSwap();
      return;
    }

    // This is a starting XI ↔ bench swap - validate formation
    const currentStartingXIPlayers = startingXI
      .map(slot => slot.player)
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({ pos: player.pos, id: player.id }));

    const playerOut = playerInStartingXI ? playerSlot.player : substituteSlot.player;
    const playerIn = playerInStartingXI ? substituteSlot.player : playerSlot.player;

    const validationResult = validateSubstitution(
      currentStartingXIPlayers, 
      { pos: playerOut!.pos, id: playerOut!.id },
      { pos: playerIn!.pos, id: playerIn!.id }
    );

    if (!validationResult.isValid) {
      toast.error(`Substitution would break formation rules: ${validationResult.errors[0]}`);
      return;
    }

    performSwap();

    function performSwap() {
      const playerInTeam = startingXI.includes(playerSlot);
      const playerInBench = bench.includes(playerSlot);
      const subInTeam = startingXI.includes(substituteSlot);
      const subInBench = bench.includes(substituteSlot);

      // Update starting XI
      if (playerInTeam) {
        setStartingXI(prev => prev.map(slot => {
          if (slot.id === playerSlot.id) {
            return { ...slot, player: substituteSlot.player };
          }
          if (slot.id === substituteSlot.id) {
            return { ...slot, player: playerSlot.player };
          }
          return slot;
        }));
      }

      // Update bench  
      if (playerInBench) {
        setBench(prev => prev.map(slot => {
          if (slot.id === playerSlot.id) {
            return { ...slot, player: substituteSlot.player };
          }
          if (slot.id === substituteSlot.id) {
            return { ...slot, player: playerSlot.player };
          }
          return slot;
        }));
      }

      // Update bench if substitute was in bench
      if (subInBench && !playerInBench) {
        setBench(prev => prev.map(slot => 
          slot.id === substituteSlot.id 
            ? { ...slot, player: playerSlot.player }
            : slot
        ));
      }

      // Update starting XI if substitute was in starting XI
      if (subInTeam && !playerInTeam) {
        setStartingXI(prev => prev.map(slot => 
          slot.id === substituteSlot.id 
            ? { ...slot, player: playerSlot.player }
            : slot
        ));
      }

      if (playerSlot.player && substituteSlot.player) {
        toast.success(`${playerSlot.player.name} ↔ ${substituteSlot.player.name}`);
      }
      
      // Auto-save the team after substitution
      // Auto-save removed - using direct API calls for fresh data
    }
  };

  const handleRemovePlayer = () => {
    if (!transferSlot) return;

    // Remove player from the slot
    if (transferSlot.id.startsWith("BENCH-")) {
      setBench(prev => prev.map(slot => 
        slot.id === transferSlot.id 
          ? { ...slot, player: undefined } 
          : slot
      ));
    } else {
      setStartingXI(prev => prev.map(slot => 
        slot.id === transferSlot.id 
          ? { ...slot, player: undefined } 
          : slot
      ));
    }

    toast.success(`${selectedPlayer?.name} removed from your team`);
    
    // Auto-save the team
    // Auto-save removed - using direct API calls for fresh data
    
    handleClosePlayerSheet();
  };

  // Substitution simulation
  const substitutionResult = useMemo(() => {
    const startingXIPlayers: SubstitutionPlayer[] = startingXI
      .map(slot => slot.player)
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({
        ...player,
        played_minutes: player.played_minutes || 0,
        is_captain: player.id === captainId,
        is_vice_captain: player.id === viceCaptainId,
        multiplier: player.id === captainId ? 2 : 1,
      }));

    const benchPlayers: SubstitutionPlayer[] = bench
      .map(slot => slot.player)
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({
        ...player,
        played_minutes: player.played_minutes || 0,
        is_captain: false,
        is_vice_captain: false,
        multiplier: 0,
      }));

    if (startingXIPlayers.length !== 11 || benchPlayers.length !== 4) {
      return {
        displayTeam: startingXIPlayers,
        substitutions: [],
        totalPoints: 0,
        showSubstitutions: false
      };
    }

    // In demo mode, simulate a finished gameweek with some non-playing players
    const simulatedGameweekData = demoMode 
      ? { finished: true }
      : gameweekData ? { finished: gameweekData.finished } : undefined;

    // In demo mode, mark some players as non-playing for demonstration
    if (demoMode && startingXIPlayers.length === 11) {
      // Mark first midfielder and captain as not played for demo
      startingXIPlayers[4] = { ...startingXIPlayers[4], played_minutes: 0 }; // 5th player (mid)
      if (captainId) {
        const captainIndex = startingXIPlayers.findIndex((p: any) => p.id === captainId);
        if (captainIndex !== -1) {
          startingXIPlayers[captainIndex] = { ...startingXIPlayers[captainIndex], played_minutes: 0 };
        }
      }
    }

    return simulateGameweekResult(startingXIPlayers, benchPlayers, simulatedGameweekData);
  }, [startingXI, bench, captainId, viceCaptainId, gameweekData, demoMode]);

  // Dynamic formation rows based on actual player positions (not slot positions)
  const formationRows = useMemo(() => {
    // Separate filled and empty slots
    const filledSlots = startingXI.filter(slot => slot.player);
    const emptySlots = startingXI.filter(slot => !slot.player);

    // Group filled slots by actual player position
    const gkpSlots = filledSlots.filter(slot => slot.player!.pos === "GKP");
    const defSlots = filledSlots.filter(slot => slot.player!.pos === "DEF");
    const midSlots = filledSlots.filter(slot => slot.player!.pos === "MID");
    const fwdSlots = filledSlots.filter(slot => slot.player!.pos === "FWD");

    // Add empty slots to maintain the original formation structure
    // Empty slots should be distributed based on their original position
    const emptyGkpSlots = emptySlots.filter(slot => slot.position === "GKP");
    const emptyDefSlots = emptySlots.filter(slot => slot.position === "DEF");
    const emptyMidSlots = emptySlots.filter(slot => slot.position === "MID");
    const emptyFwdSlots = emptySlots.filter(slot => slot.position === "FWD");

    return {
      gkpSlots: [...gkpSlots, ...emptyGkpSlots],
      defSlots: [...defSlots, ...emptyDefSlots],
      midSlots: [...midSlots, ...emptyMidSlots],
      fwdSlots: [...fwdSlots, ...emptyFwdSlots]
    };
  }, [startingXI]);

  // Current formation validation
  const formationValidation = useMemo(() => {
    const playersWithPositions = startingXI
      .map(slot => slot.player)
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(player => ({ pos: player.pos }));
    
    return validateFPLFormation(playersWithPositions);
  }, [startingXI]);

  // Team persistence removed - using direct API calls for fresh data

  // Initialize points calculation hook
  const {
    pointsData,
    isCalculating: isCalculatingPoints,
    calculationError,
    hasValidTeam,
    hasValidGameweek
  } = usePointsCalculation({
    startingXI: startingXI.filter(slot => slot.player).map(slot => slot.player!),
    bench: bench.filter(slot => slot.player).map(slot => slot.player!),
    captainId: captainId ?? undefined,
    viceCaptainId: viceCaptainId ?? undefined,
    gameweekData,
    allPlayers,
    transfersMade: 0, // Could be enhanced to track actual transfers
    freeTransfers: 1, // Could be enhanced to track actual free transfers
    chipsActive: {} // Could be enhanced to track active chips
  });

  // Load team directly from FPL API when user is authenticated
  useEffect(() => {
    const loadTeamFromAPI = async () => {
      console.log('🔄 Loading team from FPL API:', { 
        hasUser: !!user, 
        fplTeamId: user?.profile.fplTeamId,
        allPlayersLength: allPlayers.length, 
        hasRestoredTeam: hasRestoredTeam,
        userEmail: user?.email 
      });
      
      // 🚨 TEMPORARY DEBUG: Log user profile structure
      if (user) {
        console.log('👤 User profile:', {
          hasProfile: !!user.profile,
          profileKeys: user.profile ? Object.keys(user.profile) : [],
          fplTeamId: user.profile?.fplTeamId,
          fplSquad: !!user.profile?.fplSquad
        });
      }
      
      if (!user) {
        console.log('❌ Cannot load team: No user authenticated');
        return;
      }
      
      // Check if user has connected their FPL team
      if (!user.profile.fplTeamId) {
        console.log('❌ Cannot load team: No FPL team ID found. User needs to connect their FPL team first.');
        console.log('💡 Tip: User should connect their FPL team in Profile section');
        return;
      }
      if (!allPlayers.length) {
        console.log('❌ Cannot load team: No players loaded yet');
        return;
      }
      if (hasRestoredTeam) {
        console.log('❌ Cannot load team: Already loaded');
        return;
      }
      
      console.log('✅ All conditions met, loading team from FPL API...');

      try {
        // Fetch fresh team data using API utility
        const teamData = await API.team(Number(user.profile.fplTeamId!));
        console.log('📦 Fresh team data from API:', teamData);
        console.log('📦 Squad data structure:', {
          hasSquad: !!teamData.squad,
          squadKeys: teamData.squad ? Object.keys(teamData.squad) : [],
          squadGKP: teamData.squad?.GKP?.length || 0,
          squadDEF: teamData.squad?.DEF?.length || 0, 
          squadMID: teamData.squad?.MID?.length || 0,
          squadFWD: teamData.squad?.FWD?.length || 0,
          totalPlayers: (teamData.squad?.GKP?.length || 0) + (teamData.squad?.DEF?.length || 0) + (teamData.squad?.MID?.length || 0) + (teamData.squad?.FWD?.length || 0)
        });
        
        if (teamData && teamData.squad) {
          console.log('🎯 Processing fresh team data from FPL API...');
          
          // Debug: Check individual players in each position
          console.log('🔍 Detailed squad analysis:');
          ['GKP', 'DEF', 'MID', 'FWD'].forEach(pos => {
            const players = teamData.squad[pos as keyof typeof teamData.squad] || [];
            console.log(`${pos}: ${players.length} players`);
            players.forEach((player: any, index: number) => {
              console.log(`  - ${player.name} (ID: ${player.id}, Position: ${player.position})`);
            });
          });
          
          // Convert API squad data to our format - the conversion handles everything
          const { convertAPITeamToMyTeam } = await import('@/lib/fpl-team-importer');
          const { startingXI: apiStartingXI, bench: apiBench, captainId: apiCaptainId, viceCaptainId: apiViceCaptainId } = convertAPITeamToMyTeam(teamData.squad);
          
          console.log('👑 API captain ID:', apiCaptainId);
          console.log('🫅 API vice-captain ID:', apiViceCaptainId);
          console.log('📊 API Starting XI players:', apiStartingXI.length);
          console.log('📊 API Bench players:', apiBench.length);
          
          // Check if we have valid team data
          const hasValidTeam = apiStartingXI.length === 11 && apiBench.length === 4;
          
          if (!hasValidTeam) {
            console.log('📭 API team data is incomplete');
            return;
          }

          // Enhance players with data from allPlayers (for additional fields like form, cost, etc.)
          const enhancePlayerWithAllPlayersData = (slot: any) => {
            if (!slot.player) return slot;
            
            const fullPlayerData = allPlayers.find((p: any) => p.id === slot.player.id);
            if (fullPlayerData) {
              return {
                ...slot,
                player: {
                  ...slot.player,
                  // Merge additional fields from allPlayers
                  now_cost: fullPlayerData.now_cost,
                  form: fullPlayerData.form,
                  total_points: fullPlayerData.total_points,
                  minutes: fullPlayerData.minutes,
                  opponent: slot.player.opponent || opponentsMap[slot.player.team] || "—"
                }
              };
            }
            return slot;
          };

          // Apply enhancements and set the team data
          const enhancedStartingXI = apiStartingXI.map(enhancePlayerWithAllPlayersData);
          const enhancedBench = apiBench.map(enhancePlayerWithAllPlayersData);
          
          setStartingXI(enhancedStartingXI);
          setBench(enhancedBench);
          
          // Set captain and vice-captain from API
          if (apiCaptainId) {
            setCaptainId(apiCaptainId);
            console.log(`👑 Set captain ID: ${apiCaptainId}`);
          }
          if (apiViceCaptainId) {
            setViceCaptainId(apiViceCaptainId);
            console.log(`🫅 Set vice-captain ID: ${apiViceCaptainId}`);
          }

          // Update user profile with API financial data
          if (teamData.entry_history && user) {
            try {
              const entryHistory = teamData.entry_history;
              await updateProfile({
                ...user.profile,
                // Convert FPL values (in tenths) to actual values  
                teamValue: (entryHistory.value || 0) / 10, // 1002 -> 100.2
                bank: (entryHistory.bank || 0) / 10, // 0 -> 0.0
                gameweekPoints: (() => {
                  // API's entryHistory.points shows LAST COMPLETED gameweek points
                  // For current gameweek, we need to calculate from live data
                  const apiGameweek = teamData.gameweek || gameweekData?.id;
                  const currentGameweek = gameweekData?.id;
                  
                  if (apiGameweek === currentGameweek) {
                    // Same gameweek - check if it's finished
                    const isGameweekFinished = gameweekData?.finished;
                    if (isGameweekFinished) {
                      // Gameweek finished, use API points
                      return entryHistory.points || 0;
                    } else {
                      // Gameweek active/upcoming, calculate live points from squad
                      const livePoints = Object.values(teamData.squad || {})
                        .flat()
                        .reduce((total: number, player: any) => {
                          return total + (player?.gameweekPoints || 0);
                        }, 0);
                      return livePoints;
                    }
                  } else {
                    // Different gameweek - this is historical data
                    return entryHistory.points || 0;
                  }
                })(),
                totalPoints: entryHistory.total_points || 0, // Season total
                overallRank: entryHistory.overall_rank || 0,
                currentGameweek: teamData.gameweek || gameweekData?.id || user.profile.currentGameweek,
                pointsOnBench: entryHistory.points_on_bench || 0
              });
              console.log('✅ Updated user profile with API financial data:', {
                teamValue: (entryHistory.value || 0) / 10,
                bank: (entryHistory.bank || 0) / 10,
                gameweekPoints: entryHistory.points || 0,
                totalPoints: entryHistory.total_points || 0
              });
            } catch (error) {
              console.error('❌ Failed to update user profile with API data:', error);
            }
          }
          
          // Only show success message if we actually loaded players
          const actuallyLoadedPlayers = enhancedStartingXI.filter(slot => slot.player).length + 
                                        enhancedBench.filter(slot => slot.player).length;
          
          if (actuallyLoadedPlayers > 0) {
            toast.success('Your FPL team has been loaded!');
          } else {
            console.log('📭 No players were actually loaded');
          }
        } else {
          console.log('📭 No team data from API');
        }
        
        // Mark that we've attempted loading (whether successful or not)
        setHasRestoredTeam(true);
      } catch (error) {
        console.error('❌ Failed to load team from API:', error);
        // Mark that we've attempted loading even if it failed
        setHasRestoredTeam(true);
        toast.error('Failed to load your FPL team. Please check your connection.');
      }
    };

    loadTeamFromAPI();
  }, [user, allPlayers.length, hasRestoredTeam]);

  // Monitor user profile changes and refresh team if FPL squad data is added
  useEffect(() => {
    const userFplSquad = user?.profile?.fplSquad;
    
    console.log('🔄 Profile monitoring check:', {
      hasUser: !!user,
      hasFplSquad: !!userFplSquad,
      allPlayersLength: allPlayers.length,
      hasRestoredTeam,
      currentStartingXIPlayers: startingXI.filter(s => s.player).length,
      currentBenchPlayers: bench.filter(s => s.player).length
    });
    
    // If user profile has FPL squad data and we haven't restored team yet, force refresh
    if (userFplSquad && allPlayers.length > 0 && !hasRestoredTeam) {
      console.log('🎯 User profile updated with FPL squad data, forcing team restoration...');
      setHasRestoredTeam(false); // Reset to trigger restoration
    }
    
    // Also check if we have FPL data but no players on pitch (restoration might have failed)
    if (userFplSquad && allPlayers.length > 0 && hasRestoredTeam) {
      const playersOnPitch = startingXI.filter(s => s.player).length + bench.filter(s => s.player).length;
      if (playersOnPitch === 0) {
        console.log('⚠️ FPL data exists but no players on pitch - forcing re-restoration...');
        setHasRestoredTeam(false);
      }
    }
  }, [user?.profile?.fplSquad, allPlayers.length, hasRestoredTeam, startingXI.length, bench.length]);

  // Track team state changes (silent)
  useEffect(() => {
    // Silent team state tracking - only log if there's an issue
  }, [startingXI, bench, captainId, viceCaptainId, hasRestoredTeam]);

  // Auto-save team when team state changes (debounced)
  useEffect(() => {
    if (!user) return;

    const timeoutId = setTimeout(() => {
      // Auto-save removed - using direct API calls for fresh data
    }, 1000); // Debounce auto-save by 1 second

    return () => clearTimeout(timeoutId);
  }, [startingXI, bench, captainId, viceCaptainId]); // Auto-save removed

  // Register team save function for logout
  useEffect(() => {
    if (user) {
      // setTeamSaveBeforeLogout(autoSaveTeam); // Removed - no longer saving teams
    }
    
    return () => {
      setTeamSaveBeforeLogout(() => Promise.resolve());
    };
  }, [user]); // Auto-save dependency removed

  // Team validation status
  const teamValidation = useMemo(() => {
    const selectedCount = getAllSelectedPlayers().length;
    const totalValue = getTotalTeamValue();
    const teamCounts = getTeamCounts();
    
    const warnings = [];
    const errors = [];
    
    // Budget warnings
    if (totalValue > BUDGET_LIMIT * 0.9) {
      warnings.push(`Budget: £${totalValue.toFixed(1)}M / £${BUDGET_LIMIT}M`);
    }
    if (totalValue > BUDGET_LIMIT) {
      errors.push(`Over budget by £${(totalValue - BUDGET_LIMIT).toFixed(1)}M`);
    }
    
    // Team count warnings
    Object.entries(teamCounts).forEach(([team, count]) => {
      if (count >= MAX_PLAYERS_PER_TEAM) {
        warnings.push(`${team}: ${count}/${MAX_PLAYERS_PER_TEAM} players`);
      }
    });
    
    // Squad size
    if (selectedCount < SQUAD_SIZE) {
      warnings.push(`${selectedCount}/${SQUAD_SIZE} players selected`);
    }
    
    return { warnings, errors, isComplete: selectedCount === SQUAD_SIZE && totalValue <= BUDGET_LIMIT };
  }, [startingXI, bench]);

  // Get gameweek status information based on deadline and fixtures
  const getGameweekStatus = () => {
    if (!gameweekData) return { status: 'loading', message: '—', color: 'text-white/60' };
    
    const now = new Date();
    const deadline = new Date(gameweekData.deadline_time);
    const diffMs = deadline.getTime() - now.getTime();
    
    // Check fixture status
    const allFixturesFinished = areAllFixturesFinished(currentFixtures);
    const anyFixturesStarted = haveAnyFixturesStarted(currentFixtures);
    const deadlinePassed = diffMs <= 0;
    
    // Gameweek is finished if marked as finished OR if deadline passed and all fixtures are done
    if (gameweekData.finished || (deadlinePassed && allFixturesFinished)) {
      return { 
        status: 'finished', 
        message: 'Gameweek Complete', 
        color: 'text-accent',
        icon: '✅'
      };
    } 
    // Deadline passed and fixtures are in progress
    else if (deadlinePassed && anyFixturesStarted && !allFixturesFinished) {
      const finishedCount = currentFixtures.filter(f => f.finished).length;
      const totalCount = currentFixtures.length;
      return { 
        status: 'in_progress', 
        message: `Matches Playing (${finishedCount}/${totalCount})`, 
        color: 'text-orange-400',
        icon: '⚽'
      };
    }
    // Deadline passed but no fixtures started yet (between deadline and first kickoff)
    else if (deadlinePassed && !anyFixturesStarted) {
      return { 
        status: 'deadline_passed', 
        message: 'Deadline Passed', 
        color: 'text-yellow-400',
        icon: '🔒'
      };
    }
    // Less than 24 hours until deadline
    else if (diffMs <= 24 * 60 * 60 * 1000) {
      return { 
        status: 'ending_soon', 
        message: 'Ending Soon', 
        color: 'text-red-400',
        icon: '⚠️'
      };
    } 
    // Active with plenty of time left
    else {
      return { 
        status: 'active', 
        message: 'Active', 
        color: 'text-green-400',
        icon: '🟢'
      };
    }
  };

  // Format deadline display with enhanced status information
  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    
    // Check fixture status
    const allFixturesFinished = areAllFixturesFinished(currentFixtures);
    const anyFixturesStarted = haveAnyFixturesStarted(currentFixtures);
    const deadlinePassed = diffMs <= 0;
    
    if (diffMs <= 0) {
      if (gameweekData?.finished || (deadlinePassed && allFixturesFinished)) {
        const options: Intl.DateTimeFormatOptions = { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        return `Completed ${deadlineDate.toLocaleDateString('en-US', options)}`;
      } else if (anyFixturesStarted) {
        return `Passed`;
      } else {
        return `Passed - Awaiting Kickoffs`;
      }
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMins}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  };

  // Display functions now handled by useGameweekManager

  // Helper function to get gameweek points for a player
  const getPlayerGameweekPoints = (player: any): { points: number | null, hasPlayed: boolean } => {
    if (!player) {
      return { points: null, hasPlayed: false };
    }

    // Check current gameweek status
    const currentGW = gameweekData?.id || comprehensiveGameweekData?.currentGameweek?.id;
    const isCurrentGameweekActive = !gameweekData?.finished && !comprehensiveGameweekData?.currentGameweek?.finished;
    
    // First check if the player has explicit gameweek points from the API
    const gameweekPoints = player.event_points !== undefined ? player.event_points : 
                          player.gameweekPoints !== undefined ? player.gameweekPoints : null;
    
    // For active/current gameweeks, only show points if matches have started/finished
    if (isCurrentGameweekActive && currentGW) {
      // Check if player's team has any finished fixtures this gameweek
      if (comprehensiveGameweekData?.teams) {
        const playerTeamId = Object.entries(comprehensiveGameweekData.teams).find(
          ([id, team]) => team.short_name === player.team
        )?.[0];

        if (playerTeamId) {
          const playerTeamFixtures = currentFixtures.filter(
            (fixture: any) => 
              fixture.team_h === parseInt(playerTeamId) || 
              fixture.team_a === parseInt(playerTeamId)
          );

          const hasPlayedThisGW = playerTeamFixtures.some((fixture: any) => fixture.finished);
          
          if (hasPlayedThisGW && gameweekPoints !== null && gameweekPoints !== undefined) {
            return { points: gameweekPoints, hasPlayed: true };
          } else if (hasPlayedThisGW) {
            // Team played but no points data - show 0
            return { points: 0, hasPlayed: true };
          }
        }
      }
      
      // For active gameweek, if no matches played yet, show opponent
      return { points: null, hasPlayed: false };
    }
    
    // For completed gameweeks, show points if available
    if (gameweekPoints !== null && gameweekPoints !== undefined) {
      return { points: gameweekPoints, hasPlayed: true };
    }

    // Default: show opponent for future matches
    return { points: null, hasPlayed: false };
  };

  // Handle loading states
  if (loading || gameweekLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-white text-xl">Loading {loading ? 'players' : 'gameweek data'}...</div>
      </div>
    );
  }

  // Handle error states  
  if (gameweekError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Failed to load gameweek data</div>
          <button 
            onClick={refreshComprehensiveGameweek}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-2 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT SIDEBAR */}
        <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-4 self-start">
          <SidebarLeft 
            teamPlayers={startingXI.map(slot => slot.player).filter((player): player is NonNullable<typeof player> => Boolean(player)) as LivePlayer[]}
            benchPlayers={bench.map(slot => slot.player).filter((player): player is NonNullable<typeof player> => Boolean(player)) as LivePlayer[]}
            squadValue={getTotalTeamValue()}
            bankValue={BUDGET_LIMIT - getTotalTeamValue()}
            pointsData={pointsData?.captainInfo && pointsData.captainInfo.playerId !== null ? { captainInfo: pointsData.captainInfo as { playerId: number; multiplier: number; points: number } } : null}
            isCalculatingPoints={isCalculatingPoints}
            currentGameweekInfo={comprehensiveGameweekData?.currentGameweek ? {
              id: comprehensiveGameweekData.currentGameweek.id,
              name: comprehensiveGameweekData.currentGameweek.name
            } : undefined}
          />
        </aside>

        {/* CENTER */}
        <main className="lg:col-span-7 space-y-4 flex flex-col items-center">
          <div className="w-full max-w-[850px]">
            <HeroTabs 
              title="My Team" 
              gameweekLabel={displayData.title}
              gameweekDates={displayData.dateRange}
              deadlineLabel={displayData.deadline}
              matchProgress={displayData.matchProgress}
            />
          </div>



          {/* Pitch */}
          <section className="w-full max-w-[850px] rounded-2xl overflow-visible bg-card border border-white/10">
            <div className="px-2 sm:px-4 pb-5">
              <Pitch variant="half" className="pt-2">
                <div className="max-w-[820px] mx-auto space-y-3 md:space-y-4">
                  {/* GKP Row */}
                  <div className="flex justify-center gap-5 md:gap-6">
                    {formationRows.gkpSlots.map((slot) => (
                      <EmptyPlayerSlot
                        key={slot.id}
                        slot={slot}
                        onClick={(e) => handleSlotClick(slot, e)}
                        substitutionData={substitutionResult}
                        captainId={captainId}
                        viceCaptainId={viceCaptainId}
                        getPlayerGameweekPoints={getPlayerGameweekPoints}
                        gameweekData={gameweekData}
                      />
                    ))}
                  </div>

                  {/* DEF Row - only show if there are defenders */}
                  {formationRows.defSlots.length > 0 && (
                    <div className="flex justify-center gap-5 md:gap-6">
                      {formationRows.defSlots.map((slot) => (
                        <EmptyPlayerSlot
                          key={slot.id}
                          slot={slot}
                          onClick={(e) => handleSlotClick(slot, e)}
                          substitutionData={substitutionResult}
                          captainId={captainId}
                          viceCaptainId={viceCaptainId}
                          getPlayerGameweekPoints={getPlayerGameweekPoints}
                          gameweekData={gameweekData}
                        />
                      ))}
                    </div>
                  )}

                  {/* MID Row - only show if there are midfielders */}
                  {formationRows.midSlots.length > 0 && (
                    <div className="flex justify-center gap-5 md:gap-6">
                      {formationRows.midSlots.map((slot) => (
                        <EmptyPlayerSlot
                          key={slot.id}
                          slot={slot}
                          onClick={(e) => handleSlotClick(slot, e)}
                          substitutionData={substitutionResult}
                          captainId={captainId}
                          viceCaptainId={viceCaptainId}
                          getPlayerGameweekPoints={getPlayerGameweekPoints}
                          gameweekData={gameweekData}
                        />
                      ))}
                    </div>
                  )}

                  {/* FWD Row - only show if there are forwards */}
                  {formationRows.fwdSlots.length > 0 && (
                    <div className="flex justify-center gap-5 md:gap-6">
                      {formationRows.fwdSlots.map((slot) => (
                        <EmptyPlayerSlot
                          key={slot.id}
                          slot={slot}
                          onClick={(e) => handleSlotClick(slot, e)}
                          substitutionData={substitutionResult}
                          captainId={captainId}
                          viceCaptainId={viceCaptainId}
                          getPlayerGameweekPoints={getPlayerGameweekPoints}
                          gameweekData={gameweekData}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Pitch>

              {/* Bench */}
              <div className="relative w-full -mt-6">
                <div
                  className="mx-auto w-[65%] max-w-[600px] rounded-t-xl px-6 py-4 shadow-lg bg-gradient-to-b from-accent/80 to-card"
                >
                  <div className="grid grid-cols-4 gap-4 text-center">
                    {bench.map((slot, index) => (
                      <BenchSlot
                        key={slot.id}
                        label={index === 0 ? "GKP" : `${index}. ${slot.position}`}
                        slot={slot}
                        onClick={(e) => handleSlotClick(slot, e)}
                        substitutionData={substitutionResult}
                        captainId={captainId}
                        viceCaptainId={viceCaptainId}
                        getPlayerGameweekPoints={getPlayerGameweekPoints}
                        gameweekData={gameweekData}
                      />
                    ))}
                  </div>
                </div>

                <div className="mx-auto w-[70%] max-w-[720px] bg-background text-center py-3 rounded-b-xl">
                  <span className="text-white font-bold">Substitutes</span>
                </div>
              </div>

              {/* Substitution Summary */}
              {substitutionResult.showSubstitutions && substitutionResult.substitutions.length > 0 && (
                <div className="mx-auto max-w-[980px] mt-6">
                  <SubstitutionIndicator
                    substitutions={substitutionResult.substitutions}
                    viceCaptainUsed={false} // We'll implement this logic later
                  />
                </div>
              )}

              {/* Save Team Button */}
              <div className="mt-6 text-center">
                <button 
                  className="inline-flex items-center rounded-lg font-semibold px-5 py-2 shadow transition-all bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={loadingPlayer}
                  onClick={async () => {
                    if (!user) {
                      toast.error('Please login to save your team');
                      return;
                    }

                    const totalPlayers = getAllSelectedPlayers().length;
                    if (totalPlayers === 0) {
                      toast.error('Cannot save empty team. Add some players first!');
                      return;
                    }

                    try {
                      setLoadingPlayer(true);
                      // Auto-save removed - using direct API calls for fresh data
                      toast.success(`Team saved successfully! (${totalPlayers} players)`);
                    } catch (error) {
                      console.error('Failed to save team:', error);
                      toast.error('Failed to save team. Please try again.');
                    } finally {
                      setLoadingPlayer(false);
                    }
                  }}
                >
                  {loadingPlayer ? 'Saving...' : '💾 Save Team'}
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* RIGHT SIDEBAR - AI Overview */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-4 self-start">
          <AIOverviewSidebar />
        </aside>
      </div>

      {/* Player Selection Sidebar */}
      <PlayerSelectionSidebar
        open={isPlayerSelectionOpen}
        onClose={() => setIsPlayerSelectionOpen(false)}
        position={selectedSlot?.position}
        players={allPlayers}
        selectedPlayerIds={getAllSelectedPlayers().map(p => p?.id).filter(Boolean) as number[]}
        onPlayerSelect={handlePlayerSelect}
      />

      {/* Player Sheet */}
      <PlayerSheet
        open={isPlayerSheetOpen}
        onOpenChange={handleClosePlayerSheet}
        player={selectedPlayer}
        onTransfer={handleTransferPlayer}
        onSubstitute={handleSubstitutePlayer}
        onRemove={handleRemovePlayer}
        onMakeCaptain={selectedPlayer ? handleSetCaptain : undefined}
        onMakeViceCaptain={selectedPlayer ? handleSetViceCaptain : undefined}
      />

      {/* Substitution Selection Sidebar */}
      <SubstitutionSelectionSidebar
        open={isSubstitutionSelectionOpen}
        onClose={() => setIsSubstitutionSelectionOpen(false)}
        currentPlayer={transferSlot?.player || null}
        availableSubstitutes={getAvailableSubstitutes()}
        onSubstitute={handleSubstitutionSelection}
      />
    </div>
  );
}

/** Empty slot component with plus icon */
function EmptyPlayerSlot({ 
  slot, 
  onClick, 
  substitutionData, 
  captainId, 
  viceCaptainId,
  getPlayerGameweekPoints,
  gameweekData
}: { 
  slot: PlayerSlot; 
  onClick: (event?: React.MouseEvent) => void;
  substitutionData?: {
    displayTeam: SubstitutionPlayer[];
    substitutions: any[];
    showSubstitutions: boolean;
  };
  captainId?: number | null;
  viceCaptainId?: number | null;
  getPlayerGameweekPoints: (player: any) => { points: number | null, hasPlayed: boolean };
  gameweekData: any;
}) {
  if (slot.player) {
    // Check if this player was substituted or is a substitute
    const isSubstituted = substitutionData?.showSubstitutions && 
      substitutionData.substitutions.some((sub: any) => sub.out.id === slot.player?.id);
    const substitutedIn = substitutionData?.showSubstitutions && 
      substitutionData.substitutions.find((sub: any) => sub.in.id === slot.player?.id);
    const isSubstitute = !!substitutedIn;

    const gameweekStatus = getPlayerGameweekPoints(slot.player);
    
    return (
      <div onClick={onClick}>
        <PlayerCard
          name={slot.player.name}
          opponent={slot.player.nextFixture || slot.player.opponent || "—"}
          status={slot.player.status as any}
          kitCandidates={[`/Kits/PLAYER/${slot.player.team}.webp`]}
          liveMatch={slot.player.liveMatch}
          playerId={slot.player.id}
          isCaptain={slot.player.id === captainId}
          isViceCaptain={slot.player.id === viceCaptainId}
          isSubstitute={isSubstitute}
          isSubstituted={isSubstituted}
          currentGameweek={gameweekData?.id}
          gameweekPoints={gameweekStatus.points}
          hasPlayedThisGameweek={gameweekStatus.hasPlayed}
        />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-[96px] h-[132px] rounded-xl bg-white/10 border-2 border-dashed border-white/30 hover:border-white/50 hover:bg-white/15 transition-colors flex flex-col items-center justify-center group"
    >
      <Plus className="w-6 h-6 text-white/60 group-hover:text-white/80 transition-colors" />
      <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors mt-1 font-medium">
        {slot.position}
      </span>
    </button>
  );
}

/** Bench slot component */
function BenchSlot({ 
  label, 
  slot, 
  onClick,
  substitutionData,
  captainId,
  viceCaptainId,
  getPlayerGameweekPoints,
  gameweekData
}: { 
  label: string; 
  slot: PlayerSlot; 
  onClick: (event?: React.MouseEvent) => void;
  substitutionData?: {
    displayTeam: SubstitutionPlayer[];
    substitutions: any[];
    showSubstitutions: boolean;
  };
  captainId?: number | null;
  viceCaptainId?: number | null;
  getPlayerGameweekPoints: (player: any) => { points: number | null, hasPlayed: boolean };
  gameweekData: any;
}) {
  return (
    <div>
      <div className="text-xs font-bold text-white/90 mb-1">{label}</div>
      {slot.player ? (
        <div onClick={onClick}>
          {(() => {
            const gameweekStatus = getPlayerGameweekPoints(slot.player);
            const opponentDisplay = slot.player.nextFixture || slot.player.opponent || "—";
            
            
            return (
              <PlayerCard
                name={slot.player.name}
                opponent={slot.player.nextFixture || slot.player.opponent || "—"}
                status={slot.player.status as any}
                kitCandidates={[`/Kits/PLAYER/${slot.player.team}.webp`]}
                liveMatch={slot.player.liveMatch}
                playerId={slot.player.id}
                isCaptain={slot.player.id === captainId}
                isViceCaptain={slot.player.id === viceCaptainId}
                isSubstitute={substitutionData?.showSubstitutions && 
                  substitutionData.substitutions.some((sub: any) => sub.in.id === slot.player?.id)}
                currentGameweek={gameweekData?.id}
                gameweekPoints={gameweekStatus.points}
                hasPlayedThisGameweek={gameweekStatus.hasPlayed}
              />
            );
          })()}
        </div>
      ) : (
        <button
          onClick={onClick}
          className="w-[96px] h-[132px] mx-auto rounded-xl bg-white/10 border-2 border-dashed border-white/30 hover:border-white/50 hover:bg-white/15 transition-colors flex flex-col items-center justify-center group"
        >
          <Plus className="w-6 h-6 text-white/60 group-hover:text-white/80 transition-colors" />
          <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors mt-1 font-medium">
            Add
          </span>
        </button>
      )}
    </div>
  );
}