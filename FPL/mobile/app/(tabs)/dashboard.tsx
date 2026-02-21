import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import API from "../../src/lib/api";

export default function DashboardScreen() {
  const [gw, setGw] = useState<any>(null);
  const [table, setTable] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [g, t] = await Promise.all([API.currentGameweek(), API.table()]);
        if (!alive) return;
        setGw(g);
        setTable(t);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <RequireAuth>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Dashboard</Text>
        {error && <Text style={{ color: "#dc2626" }}>{error}</Text>}
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>Current Gameweek</Text>
          <Text selectable>{gw ? JSON.stringify(gw, null, 2) : "Loading..."}</Text>
        </View>
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>Premier League Table</Text>
          <Text selectable>{table ? JSON.stringify(table, null, 2) : "Loading..."}</Text>
        </View>
      </ScrollView>
    </RequireAuth>
  );
}

