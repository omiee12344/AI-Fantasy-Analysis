import { ArrowRight, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type SubstitutionResult } from "@/lib/substitutions";

interface SubstitutionIndicatorProps {
  substitutions: SubstitutionResult['substitutions'];
  viceCaptainUsed: boolean;
  className?: string;
}

export function SubstitutionIndicator({ 
  substitutions, 
  viceCaptainUsed, 
  className = "" 
}: SubstitutionIndicatorProps) {
  const hasSubstitutions = substitutions.length > 0 || viceCaptainUsed;

  if (!hasSubstitutions) {
    return null;
  }

  return (
    <div className={`bg-accent/20 border border-accent/40 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <RotateCcw className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-accent">Automatic Changes Applied</span>
      </div>
      
      <div className="space-y-2">
        {/* Captain/Vice-Captain */}
        {viceCaptainUsed && (
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-accent border-accent/40">
              Captain
            </Badge>
            <span className="text-muted-foreground">
              Vice-captain received double points (captain didn't play)
            </span>
          </div>
        )}

        {/* Player Substitutions */}
        {substitutions.map((sub, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-orange-400 border-orange-400/40">
              Auto-Sub
            </Badge>
            <span className="text-muted-foreground">
              {sub.out.name}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-foreground font-medium">
              {sub.in.name}
            </span>
            <span className="text-muted-foreground">
              (didn't play)
            </span>
          </div>
        ))}
      </div>

      {substitutions.length === 0 && viceCaptainUsed && (
        <p className="text-xs text-muted-foreground mt-2">
          No player substitutions were needed.
        </p>
      )}
    </div>
  );
}

interface PlayerSubstitutionBadgeProps {
  isSubstitute: boolean;
  isSubstituted: boolean;
  className?: string;
}

export function PlayerSubstitutionBadge({ 
  isSubstitute, 
  isSubstituted, 
  className = "" 
}: PlayerSubstitutionBadgeProps) {
  if (isSubstitute) {
    return (
      <Badge 
        variant="outline" 
        className={`absolute -top-1 -right-1 text-xs px-1 py-0 bg-accent text-accent-foreground border-accent ${className}`}
      >
        SUB
      </Badge>
    );
  }

  if (isSubstituted) {
    return (
      <Badge 
        variant="outline" 
        className={`absolute -top-1 -right-1 text-xs px-1 py-0 bg-muted text-muted-foreground border-muted line-through ${className}`}
      >
        OUT
      </Badge>
    );
  }

  return null;
}