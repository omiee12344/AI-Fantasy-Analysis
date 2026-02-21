// src/components/fpl/PlayerCard.tsx
import React, { useMemo, useState } from "react";
import { getPlayerImageSources } from "@/lib/playerImages";

export type PlayerStatus = "available" | "yellow" | "red";

export type LivePoints = {
  totalPoints: number;
  minutes: number;
  goals: number;
  assists: number;
  bonus: number;
  isPlaying: boolean;
};

export type LiveMatchData = {
  started: boolean;
  finished: boolean;
  minutes: number;
  fixtureId: number;
  isHome: boolean;
  livePoints?: LivePoints | null;
};

export type PlayerCardProps = {
  /** Prefer kitCandidates; kitSrc used only if you provide a single URL. */
  kitCandidates?: string[];
  kitSrc?: string;
  name: string;            // full name; we render last name only
  opponent: string;        // "WHU (A)"
  status?: PlayerStatus;
  liveMatch?: LiveMatchData | null; // Live match data for scores
  className?: string;
  onClick?: () => void;
  playerId?: number;       // Add player ID for image lookup
  // Substitution indicators
  isSubstitute?: boolean;  // Player came on as substitute
  isSubstituted?: boolean; // Player was substituted out
  isCaptain?: boolean;     // Captain indicator
  isViceCaptain?: boolean; // Vice-captain indicator
  // Gameweek-specific data
  currentGameweek?: number;        // Current gameweek ID
  gameweekPoints?: number | null;  // Points scored in current gameweek (null if not played)
  hasPlayedThisGameweek?: boolean; // Whether player has played in current gameweek
};


export default function PlayerCard({
  kitCandidates,
  kitSrc,
  name,
  opponent,
  status = "available",
  liveMatch,
  className = "",
  onClick,
  playerId,
  isSubstitute = false,
  isSubstituted = false,
  isCaptain = false,
  isViceCaptain = false,
  currentGameweek,
  gameweekPoints,
  hasPlayedThisGameweek = false,
}: PlayerCardProps) {
  // Reduced card size for better spacing
  const cardW = "w-[96px]";
  const cardH = "h-[132px]";
  const imgH  = "h-[68px]";

  // Get jersey images with player fallbacks (prioritize jerseys on pitch)
  const sources = useMemo(() => {
    const playerImageSources = playerId ? getPlayerImageSources(playerId) : [];
    const kitSources = kitCandidates?.length ? kitCandidates : kitSrc ? [kitSrc] : [];
    
    // Prefer kit/jersey images first, then player images, then placeholder
    return [
      ...kitSources,
      ...playerImageSources,
      "/Kits/PLAYER/placeholder.webp"
    ];
  }, [playerId, kitCandidates, kitSrc]);
  
  const [srcIx, setSrcIx] = useState(0);
  const currentSrc = sources[srcIx] ?? "/Kits/PLAYER/placeholder.webp";
  
  // Check if current source is a player image (vs kit/placeholder)
  const kitSources = kitCandidates?.length ? kitCandidates : kitSrc ? [kitSrc] : [];
  const isPlayerImage = playerId && srcIx >= kitSources.length && srcIx < (kitSources.length + getPlayerImageSources(playerId).length);

  return (
    <button
      onClick={onClick}
      className={[
        "relative rounded-xl overflow-visible",
        "border border-white/20 backdrop-blur-md",
        "shadow-[0_10px_24px_rgba(0,0,0,0.25)]",
        "transition hover:scale-[1.02] active:scale-[0.99]",
        "pt-1 pr-1", // Add padding for captain badge
        cardW, cardH, className,
      ].join(" ")}
      style={{
        background:
          "linear-gradient(180deg, rgba(78,230,166,0.25) 0%, rgba(33,7,36,0.45) 100%)",
      }}
    >
      {/* Status alert icon - only show for doubtful/injured players */}
      {status !== "available" && (
        <div
          className="absolute left-1 top-1 h-3 w-3 flex items-center justify-center"
          title={status === "yellow" ? "Doubtful" : status === "red" ? "Injured" : "Available"}
        >
          <img
            src={status === "yellow" ? "/icons/yellow-doubt-icon.png" : "/icons/red-alert-icon.png"}
            alt={status === "yellow" ? "Doubtful" : "Injured"}
            className="w-3 h-3 drop-shadow-sm"
          />
        </div>
      )}

      {/* Captain/Vice-Captain indicator */}
      {(isCaptain || isViceCaptain) && (
        <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-bold shadow-lg z-10 ${
          isCaptain 
            ? 'bg-black text-white' 
            : 'bg-gray-700 text-white'
        }`}>
          {isCaptain ? 'C' : 'VC'}
        </div>
      )}

      {/* Substitution indicators - positioned to avoid conflict with captain badges */}
      {isSubstitute && !isCaptain && !isViceCaptain && (
        <div className="absolute -top-1 -right-1 text-xs px-1 py-0.5 rounded-md bg-accent text-accent-foreground font-bold shadow-lg">
          SUB
        </div>
      )}
      {isSubstituted && !isCaptain && !isViceCaptain && (
        <div className="absolute -top-1 -right-1 text-xs px-1 py-0.5 rounded-md bg-muted text-muted-foreground font-bold shadow-lg line-through opacity-70">
          OUT
        </div>
      )}
      {/* Show substitution on captain/vice-captain at bottom right instead */}
      {isSubstitute && (isCaptain || isViceCaptain) && (
        <div className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0.5 rounded-sm bg-accent text-accent-foreground font-bold shadow-lg">
          SUB
        </div>
      )}
      {isSubstituted && (isCaptain || isViceCaptain) && (
        <div className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0.5 rounded-sm bg-muted text-muted-foreground font-bold shadow-lg line-through opacity-70">
          OUT
        </div>
      )}

      {/* player image or jersey */}
      <div className="absolute inset-x-0 top-4 flex justify-center">
        <img
          src={currentSrc}
          alt={isPlayerImage ? name : "kit"}
          className={`${imgH} w-auto object-contain drop-shadow-lg pointer-events-none select-none ${
            isPlayerImage 
              ? 'scale-[1.1] transform origin-center rounded-full bg-white/5 p-1' 
              : 'scale-[1.4] transform origin-center'
          }`}
          draggable={false}
          onError={() => {
            if (srcIx < sources.length - 1) {
              setSrcIx(srcIx + 1); // try next candidate
            } else {
              console.warn("No valid image source found:", sources);
            }
          }}
        />
      </div>

      {/* bottom label: show LAST name only + conditional opponent/points */}
      <div className="absolute left-0.5 right-0.5 bottom-0.5">
        <div className="rounded-sm bg-white text-[#1e2330] text-center px-1 py-0.5 shadow">
          <div className="text-[10px] font-semibold leading-tight truncate">
            {name.split(" ").slice(-1).join("")}
          </div>
          
          {/* Show gameweek points if player has played, otherwise show opponent */}
          {hasPlayedThisGameweek && gameweekPoints !== null && gameweekPoints !== undefined ? (
            <div className={`text-[9px] font-bold tracking-wide truncate ${
              gameweekPoints > 0 
                ? 'text-green-600' 
                : gameweekPoints < 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
            }`}>
              {gameweekPoints > 0 && '+'}
              {gameweekPoints} pts
            </div>
          ) : (
            <div className="text-[9px] font-bold tracking-wide truncate">
              {opponent}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
