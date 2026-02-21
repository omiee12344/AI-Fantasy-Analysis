import React, { useEffect, useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import API from "../../src/lib/api";
import { useAuth } from "../../src/contexts/AuthContext";

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [health, setHealth] = useState<string>("(not checked)");

  useEffect(() => {
    let alive = true;
    API.health()
      .then((r) => alive && setHealth(r.time ? `ok (${r.time})` : "ok"))
      .catch((e) => alive && setHealth(String(e?.message || e)));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>AI Fantasy Analytics (Mobile)</Text>
      <Text>API health: {health}</Text>

      <Text>
        Auth: {isAuthenticated ? `signed in as ${user?.email}` : "not signed in"}
      </Text>

      {!isAuthenticated && (
        <Link href="/login" style={{ color: "#2563eb" }}>
          Go to Login
        </Link>
      )}
    </View>
  );
}

