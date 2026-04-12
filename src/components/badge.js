// src/components/Badge.js
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Badge = ({ label, color, backgroundColor }) => {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
  },
});

export default Badge;
