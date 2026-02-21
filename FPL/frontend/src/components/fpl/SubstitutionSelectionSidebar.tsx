import { useState } from "react";
import { X, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlayerCard from "./PlayerCard";
import { type LivePlayer } from "@/lib/api";

interface SubstitutionSelectionSidebarProps {
  open: boolean;
  onClose: () => void;
  currentPlayer: LivePlayer | null;
  availableSubstitutes: Array<{
    id: string;
    player: LivePlayer;
    isInStartingXI: boolean;
  }>;
  onSubstitute: (substituteId: string) => void;
}

export default function SubstitutionSelectionSidebar({
  open,
  onClose,
  currentPlayer,
  availableSubstitutes,
  onSubstitute,
}: SubstitutionSelectionSidebarProps) {
  if (!open || !currentPlayer) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-50 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Substitute Player</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Current Player Info */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/60">Substituting:</div>
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {currentPlayer.pos}
              </Badge>
              <div className="font-medium text-white">{currentPlayer.name}</div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {currentPlayer.team}
              </Badge>
            </div>
          </div>
        </div>

        {/* Available Substitutes */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {availableSubstitutes.length === 0 ? (
              <div className="text-center py-8">
                <ArrowLeftRight className="w-12 h-12 mx-auto text-white/30 mb-3" />
                <p className="text-white/60">No available substitutes</p>
                <p className="text-sm text-white/40 mt-1">
                  {currentPlayer.pos === "GKP" 
                    ? "Need another goalkeeper to substitute"
                    : "All outfield players are already selected"
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm font-medium text-white mb-4">
                  Choose a substitute ({availableSubstitutes.length} available):
                </div>
                
                {availableSubstitutes.map((substitute) => (
                  <div
                    key={substitute.id}
                    className="group relative p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-accent/40"
                    onClick={() => onSubstitute(substitute.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Mini Player Card */}
                      <div className="transform scale-75 origin-left">
                        <PlayerCard
                          name={substitute.player.name}
                          opponent="—"
                          status={substitute.player.status as any}
                          kitCandidates={[`/Kits/PLAYER/${substitute.player.team}.webp`]}
                          playerId={substitute.player.id}
                        />
                      </div>
                      
                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={substitute.player.pos === currentPlayer.pos 
                              ? "bg-accent text-accent-foreground" 
                              : "bg-white/20 text-white"
                            }
                          >
                            {substitute.player.pos}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {substitute.player.team}
                          </Badge>
                          {substitute.isInStartingXI && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400/40">
                              Starting XI
                            </Badge>
                          )}
                        </div>
                        <div className="font-medium text-white truncate">
                          {substitute.player.name}
                        </div>
                        <div className="text-sm text-white/60">
                          £{((substitute.player.now_cost || 50) / 10).toFixed(1)}m • 
                          {substitute.player.total_points || 0} pts
                        </div>
                      </div>
                      
                      {/* Substitute Button */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowLeftRight className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-white/60 text-center">
            {currentPlayer.pos === "GKP" 
              ? "Goalkeepers can only be substituted with other goalkeepers"
              : "Click on any player to swap positions"
            }
          </p>
        </div>
      </div>
    </div>
  );
}