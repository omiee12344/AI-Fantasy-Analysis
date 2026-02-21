import { useState, useMemo, useEffect } from "react";
import { X, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LivePlayer, Pos } from "@/lib/api";
import { getPlayerImageSources } from "@/lib/playerImages";

type PlayerSelectionSidebarProps = {
  open: boolean;
  onClose: () => void;
  position?: Pos;
  players: LivePlayer[];
  selectedPlayerIds?: number[];
  onPlayerSelect: (player: LivePlayer) => void;
};

// Sort options
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "total_points", label: "Total Points" },
  { value: "now_cost", label: "Price" },
  { value: "form", label: "Form" },
  { value: "selected_by_percent", label: "Selected %" },
];

// Price filter options
const PRICE_FILTER_OPTIONS = [
  { value: "all", label: "Any price" },
  { value: "4.0-5.0", label: "£4.0m - £5.0m" },
  { value: "5.0-6.5", label: "£5.0m - £6.5m" },
  { value: "6.5-8.0", label: "£6.5m - £8.0m" },
  { value: "8.0-10.0", label: "£8.0m - £10.0m" },
  { value: "10.0-12.0", label: "£10.0m - £12.0m" },
  { value: "12.0-15.0", label: "£12.0m+" },
];

// Points filter options
const POINTS_FILTER_OPTIONS = [
  { value: "all", label: "Any points" },
  { value: "0-20", label: "0 - 20 points" },
  { value: "20-50", label: "20 - 50 points" },
  { value: "50-100", label: "50 - 100 points" },
  { value: "100-150", label: "100 - 150 points" },
  { value: "150-200", label: "150 - 200 points" },
  { value: "200+", label: "200+ points" },
];

export default function PlayerSelectionSidebar({
  open,
  onClose,
  position,
  players,
  selectedPlayerIds = [],
  onPlayerSelect,
}: PlayerSelectionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("total_points");
  const [priceFilter, setPriceFilter] = useState("all");
  const [pointsFilter, setPointsFilter] = useState("all");

  // Reset filters when position changes
  useEffect(() => {
    if (position) {
      setSearchQuery("");
      setSortBy("total_points");
      setPriceFilter("all");
      setPointsFilter("all");
    }
  }, [position]);

  // Helper function to parse price filter range
  const getPriceRange = (filter: string): [number, number] => {
    switch (filter) {
      case "4.0-5.0": return [4.0, 5.0];
      case "5.0-6.5": return [5.0, 6.5];
      case "6.5-8.0": return [6.5, 8.0];
      case "8.0-10.0": return [8.0, 10.0];
      case "10.0-12.0": return [10.0, 12.0];
      case "12.0-15.0": return [12.0, 20.0]; // 20.0 as max to cover all high-priced players
      default: return [0, 100]; // "all" case
    }
  };

  // Helper function to parse points filter range
  const getPointsRange = (filter: string): [number, number] => {
    switch (filter) {
      case "0-20": return [0, 20];
      case "20-50": return [20, 50];
      case "50-100": return [50, 100];
      case "100-150": return [100, 150];
      case "150-200": return [150, 200];
      case "200+": return [200, 1000]; // 1000 as max to cover all high-scoring players
      default: return [0, 1000]; // "all" case
    }
  };

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    if (!position) return [];

    let filtered = players.filter(player => {
      // Filter by position
      if (position === "OUTFIELD") {
        // For OUTFIELD bench slots, allow any non-goalkeeper
        if (player.pos === "GKP") return false;
      } else {
        // For specific positions, exact match required
        if (player.pos !== position) return false;
      }

      // Filter by search query
      if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !player.team.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by price range
      const price = (player.now_cost || 0) / 10; // Convert from tenths to full value
      const [priceMin, priceMax] = getPriceRange(priceFilter);
      if (price < priceMin || price > priceMax) return false;

      // Filter by points range
      const points = player.total_points || 0;
      const [pointsMin, pointsMax] = getPointsRange(pointsFilter);
      if (points < pointsMin || points > pointsMax) return false;

      return true;
    });

    // Sort players
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "total_points":
          return (b.total_points || 0) - (a.total_points || 0);
        case "now_cost":
          return (b.now_cost || 0) - (a.now_cost || 0);
        case "form":
          return parseFloat(b.form || "0") - parseFloat(a.form || "0");
        case "selected_by_percent":
          return parseFloat(b.selected_by_percent || "0") - parseFloat(a.selected_by_percent || "0");
        default:
          return 0;
      }
    });

    return filtered;
  }, [players, position, searchQuery, sortBy, priceFilter, pointsFilter, getPriceRange, getPointsRange]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSortBy("total_points");
    setPriceFilter("all");
    setPointsFilter("all");
  };

  // Get position display name
  const getPositionName = (pos: Pos) => {
    switch (pos) {
      case "GKP": return "Goalkeepers";
      case "DEF": return "Defenders";
      case "MID": return "Midfielders";
      case "FWD": return "Forwards";
      default: return "Players";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-[#2a0f32] border-r border-white/10 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {position ? getPositionName(position) : "Select Player"}
              </h2>
              <p className="text-sm text-white/70">
                {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Position Selection & Sort */}
          <div className="p-4 border-b border-white/10 space-y-4">
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">
                Sort by
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-[#210724] border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#210724] border-white/20">
                  {SORT_OPTIONS.map(option => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-white focus:bg-white/10"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#210724] border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white/90">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-white/70 hover:text-white text-xs h-6 px-2"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>

            {/* Compact Filter Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Price Filter */}
              <div>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="bg-[#210724] border-white/20 text-white h-8 text-xs">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#210724] border-white/20">
                    {PRICE_FILTER_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white focus:bg-white/10 text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Points Filter */}
              <div>
                <Select value={pointsFilter} onValueChange={setPointsFilter}>
                  <SelectTrigger className="bg-[#210724] border-white/20 text-white h-8 text-xs">
                    <SelectValue placeholder="Points" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#210724] border-white/20">
                    {POINTS_FILTER_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white focus:bg-white/10 text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {filteredPlayers.map((player) => (
                  <PlayerListItem
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayerIds.includes(player.id)}
                    onClick={() => onPlayerSelect(player)}
                  />
                ))}
                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    No players found matching your criteria
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Individual player item in the list */
function PlayerListItem({ 
  player, 
  isSelected = false,
  onClick 
}: { 
  player: LivePlayer; 
  isSelected?: boolean;
  onClick: () => void;
}) {
  const price = ((player.now_cost || 0) / 10).toFixed(1);
  const form = parseFloat(player.form || "0").toFixed(1);
  const totalPoints = player.total_points || 0;

  return (
    <button
      onClick={onClick}
      disabled={isSelected}
      className={`w-full p-3 rounded-lg border transition-colors text-left relative ${
        isSelected 
          ? 'bg-gray-600 border-gray-500 opacity-60 cursor-not-allowed' 
          : 'bg-[#210724] hover:bg-[#3a1540] border-white/10 hover:border-white/20'
      }`}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <span className="text-white/90 text-sm font-medium">In Squad</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        {/* Player Image */}
        <PlayerImageComponent playerId={player.id} playerName={player.name} teamName={player.team} />

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white truncate">
              {player.name}
            </h4>
            <span className="text-sm font-semibold text-[#04d27f]">
              £{price}m
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-white/70 mt-1">
            <span>{player.team}</span>
            <span>{totalPoints} pts</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-white/50 mt-1">
            <span>Form: {form}</span>
            <span>{parseFloat(player.selected_by_percent || "0").toFixed(1)}% selected</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/** Player image component for selection sidebar */
function PlayerImageComponent({ 
  playerId, 
  playerName, 
  teamName 
}: { 
  playerId: number; 
  playerName: string; 
  teamName: string; 
}) {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  
  // Build sources array: player images first, then jersey fallback, then placeholder
  const sources = useMemo(() => {
    const playerImageSources = getPlayerImageSources(playerId);
    const jerseySource = `/Kits/PLAYER/${teamName}.webp`;
    
    return [
      ...playerImageSources,
      jerseySource,
      "/placeholder.svg"
    ];
  }, [playerId, teamName]);
  
  const currentSrc = sources[currentSrcIndex];
  const isPlayerImage = currentSrcIndex < getPlayerImageSources(playerId).length;
  
  const handleImageError = () => {
    if (currentSrcIndex < sources.length - 1) {
      setCurrentSrcIndex(currentSrcIndex + 1);
    }
  };
  
  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
      <img
        src={currentSrc}
        alt={isPlayerImage ? playerName : teamName}
        className={`${
          isPlayerImage 
            ? 'w-10 h-10 rounded-full object-cover' 
            : 'w-8 h-8 object-contain'
        }`}
        onError={handleImageError}
      />
    </div>
  );
}