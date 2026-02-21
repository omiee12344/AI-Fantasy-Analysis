import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HeroCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  sparklineData?: Array<{ value: number }>;
  className?: string;
}

export function HeroCard({
  title,
  value,
  subtitle,
  trend = "neutral",
  trendValue,
  sparklineData,
  className,
}: HeroCardProps) {
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[trend];

  const trendColor = {
    up: "text-accent",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  }[trend];

  return (
    <Card className={`fpl-card ${className || ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
            {trendValue && (
              <div className={`flex items-center space-x-1 mt-2 ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                <span className="text-xs font-medium">{trendValue}</span>
              </div>
            )}
          </div>
          {sparklineData && (
            <div className="h-12 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}