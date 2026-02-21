import React from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { useAuth } from "../../src/contexts/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <RequireAuth>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Profile</Text>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>User</Text>
          <Text selectable>{user ? JSON.stringify(user, null, 2) : "No user"}</Text>
        </View>

        <Button title="Logout" onPress={() => logout()} />
        <Text style={{ color: "#6b7280" }}>
          Note: Google sign-in (popup) from the web app isn’t enabled in this mobile scaffold yet.
        </Text>
      </ScrollView>
    </RequireAuth>
  );
}

