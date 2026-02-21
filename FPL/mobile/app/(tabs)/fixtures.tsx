import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import API from "../../src/lib/api";

export default function FixturesScreen() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const gw = await API.currentGameweek();
        const fixtures = await API.fixtures(gw.id);
        if (!alive) return;
        setData({ gameweek: gw, fixtures });
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
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Fixtures</Text>
        {error && <Text style={{ color: "#dc2626" }}>{error}</Text>}
        <Text selectable>{data ? JSON.stringify(data, null, 2) : "Loading..."}</Text>
      </ScrollView>
    </RequireAuth>
  );
}

