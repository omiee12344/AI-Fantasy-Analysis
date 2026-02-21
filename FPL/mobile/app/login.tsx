import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Button, Text, TextInput, View } from "react-native";
import { useAuth } from "../src/contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (mode === "register" && (!firstName || !lastName || !teamName)) return false;
    return true;
  }, [email, password, mode, firstName, lastName, teamName]);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          firstName,
          lastName,
          teamName,
          favouriteTeam: null,
          country: null,
        });
      }
      router.replace("/");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        {mode === "login" ? "Login" : "Create account"}
      </Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Text
          onPress={() => setMode("login")}
          style={{ color: mode === "login" ? "#111827" : "#2563eb" }}
        >
          Login
        </Text>
        <Text
          onPress={() => setMode("register")}
          style={{ color: mode === "register" ? "#111827" : "#2563eb" }}
        >
          Register
        </Text>
      </View>

      {mode === "register" && (
        <>
          <TextInput
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            style={{ borderWidth: 1, borderColor: "#e5e7eb", padding: 10, borderRadius: 8 }}
          />
          <TextInput
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            style={{ borderWidth: 1, borderColor: "#e5e7eb", padding: 10, borderRadius: 8 }}
          />
          <TextInput
            placeholder="Team name"
            value={teamName}
            onChangeText={setTeamName}
            autoCapitalize="words"
            style={{ borderWidth: 1, borderColor: "#e5e7eb", padding: 10, borderRadius: 8 }}
          />
        </>
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: "#e5e7eb", padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: "#e5e7eb", padding: 10, borderRadius: 8 }}
      />

      {error && <Text style={{ color: "#dc2626" }}>{error}</Text>}

      <Button title={busy ? "Please wait..." : "Continue"} disabled={!canSubmit || busy} onPress={onSubmit} />
    </View>
  );
}

