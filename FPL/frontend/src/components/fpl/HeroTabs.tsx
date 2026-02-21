import { Card } from "@/components/ui/card";

type Props = {
  /** Title shown inside the boosts card (left side). */
  title?: string;
  /** e.g. "Gameweek 2" */
  gameweekLabel?: string;
  /** e.g. "Fri 22 Aug, 13:30" */
  deadlineLabel?: string;
  /** Gameweek start and end dates */
  gameweekDates?: string;
  /** Number of matches played vs total */
  matchProgress?: string;
};

export default function HeroTabs({
  title = "Pick Team",
  gameweekLabel = "Gameweek 2",
  deadlineLabel = "Fri 22 Aug, 13:30",
  gameweekDates,
  matchProgress,
}: Props) {

  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* Row 1: Title */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-center">
          <h1 className="text-3xl pl-heading font-bold text-accent tracking-widest uppercase">{title}</h1>
        </div>
      </div>

      {/* Row 2: Gameweek Info (horizontal line) */}
      <div className="px-4 mt-3">
        <div className="text-center text-muted-foreground font-medium pl-body">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Gameweek Number */}
            <span className="text-accent font-bold text-lg">{gameweekLabel}</span>
            
            {/* Gameweek Dates */}
            {gameweekDates && (
              <>
                <span className="text-white/40">•</span>
                <span className="opacity-90 text-sm">{gameweekDates}</span>
              </>
            )}
            
            {/* Deadline */}
            <span className="text-white/40">•</span>
            <span className="font-semibold">Deadline:</span>
            <span className="opacity-90">{deadlineLabel}</span>
            
            {/* Match Progress */}
            {matchProgress && (
              <>
                <span className="text-white/40">•</span>
                <span className="font-semibold">Matches:</span>
                <span className="opacity-90">{matchProgress}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Boosts (4 cards) */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Bench Boost" },
            { label: "Triple Captain" },
            { label: "Wildcard" },
            { label: "Free Hit" },
          ].map((b) => (
            <button
              key={b.label}
              className="rounded-2xl bg-card/50 border border-border text-foreground px-4 py-3 text-left hover:bg-accent/10 transition-colors w-full"
              style={{ boxShadow: "0 6px 14px rgba(0,0,0,.18)" }}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{b.label}</div>
                {/* icon placeholder; replace with your SVG if you want */}
                <div className="h-6 w-6 rounded-full bg-accent/20" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: Tip bubble */}
      <div className="px-4 py-4">
        <div className="mx-auto max-w-[760px] text-center bg-accent/10 text-foreground text-sm rounded-xl px-4 py-3 shadow">
          To change your captain use the menu which appears when clicking on a player
        </div>
      </div>
    </Card>
  );
}