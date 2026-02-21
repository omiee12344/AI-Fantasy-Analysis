import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield } from "lucide-react";

export type Player = {
  id: string | number;
  name: string;
  team: string;       // short code (ARS, MCI, etc.)
  position: "GKP" | "DEF" | "MID" | "FWD";
  price: number;      // £m
  shirtColor: string; // hex
  textColor?: string; // optional contrast override
  isCaptain?: boolean;
  isViceCaptain?: boolean;
};

type Props = {
  player: Player;
  onClick?: () => void;
};

const ShirtSVG = ({ color = "#0ea5e9" }: { color?: string }) => (
  <svg width="72" height="72" viewBox="0 0 64 64" className="drop-shadow">
    <path
      d="M20 8 L44 8 L56 18 L50 28 L44 24 L44 56 L20 56 L20 24 L14 28 L8 18 Z"
      fill={color}
      stroke="white"
      strokeWidth="2"
    />
  </svg>
);

export default function PlayerTile({ player, onClick }: Props) {
  const { name, team, price, shirtColor, textColor, isCaptain, isViceCaptain } = player;
  return (
    <button
      onClick={onClick}
      className="relative group w-full rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm px-3 py-2 flex flex-col items-center justify-center hover:bg-white/15 transition"
      style={{ color: textColor ?? "#fff" }}
    >
      <div className="mb-1">
        <ShirtSVG color={shirtColor} />
      </div>
      <div className="text-center">
        <div className="font-medium leading-tight">{name}</div>
        <div className="text-white/85 text-xs">{team} • £{price.toFixed(1)}m</div>
      </div>

      {(isCaptain || isViceCaptain) && (
        <Badge
          className="absolute -top-2 -right-2 rounded-full"
          variant={isCaptain ? "default" : "secondary"}
        >
          {isCaptain ? <Crown className="h-3.5 w-3.5 mr-1" /> : <Shield className="h-3.5 w-3.5 mr-1" />}
          {isCaptain ? "C" : "VC"}
        </Badge>
      )}
    </button>
  );
}
