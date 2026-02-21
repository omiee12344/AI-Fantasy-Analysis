import React from "react";
import { Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";

export default function PredictorScreen() {
  return (
    <RequireAuth>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Predictor</Text>
        <Text>
          This screen is scaffolded for mobile. The next step is porting the web predictor UI/components into
          React Native.
        </Text>
      </View>
    </RequireAuth>
  );
}

