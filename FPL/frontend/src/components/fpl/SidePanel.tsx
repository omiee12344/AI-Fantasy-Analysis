import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BankPanel({ bank, freeTransfers }: { bank: number; freeTransfers: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Transfers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bank</span>
          <span className="font-medium">£{bank.toFixed(1)}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Free Transfers</span>
          <span className="font-medium">{freeTransfers}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DeadlinePanel({ gw, deadline }: { gw: number; deadline: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Deadline</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gameweek</span>
          <span className="font-medium">{gw}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Closes</span>
          <span className="font-medium">{deadline}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function FixturesPanel({
  fixtures,
}: {
  fixtures: Array<{ opp: string; hA: "H" | "A"; fdr: number }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Upcoming Fixtures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {fixtures.map((f, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">{f.hA === "H" ? "vs" : "@"} {f.opp}</div>
            <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
              FDR {f.fdr}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
