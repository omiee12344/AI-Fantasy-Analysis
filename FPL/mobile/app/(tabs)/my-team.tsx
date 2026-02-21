import React, { useEffect, useMemo, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { useAuth } from "../../src/contexts/AuthContext";
import API from "../../src/lib/api";

export default function MyTeamScreen() {
  const { user, updateProfile } = useAuth();
  const [fplId, setFplId] = useState(user?.profile.fplTeamId || "");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const numericId = useMemo(() => {
    const n = Number(fplId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [fplId]);

  const load = async () => {
    if (!numericId) return;
    setError(null);
    setBusy(true);
    try {
      const team = await API.team(numericId);
      setData(team);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // auto-load if already set
    if (numericId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RequireAuth>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>My Team</Text>

        <Text style={{ color: "#374151" }}>
          Set your FPL Team ID (entry id). This is required to fetch `/team/:id` from your backend.
        </Text>

        <TextInput
          placeholder="FPL Team ID (number)"
          value={fplId}
          onChangeText={setFplId}
          keyboardType="number-pad"
          style={{ borderWidth: 1, borderColor: "#e5e7eb", padding: 10, borderRadius: 8 }}
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button
            title={busy ? "Saving..." : "Save ID"}
            disabled={busy || !fplId}
            onPress={async () => {
              setBusy(true);
              try {
                await updateProfile({ fplTeamId: fplId });
              } catch (e: any) {
                setError(e?.message || String(e));
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button title={busy ? "Loading..." : "Load team"} disabled={busy || !numericId} onPress={load} />
        </View>

        <Text style={{ color: "#6b7280" }}>Current user: {user?.email}</Text>
        {error && <Text style={{ color: "#dc2626" }}>{error}</Text>}
        <Text selectable>{data ? JSON.stringify(data, null, 2) : "No team loaded yet."}</Text>
      </ScrollView>
    </RequireAuth>
  );
}

