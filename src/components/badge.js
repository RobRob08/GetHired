// src/components/Badge.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Badge = ({ label, color, backgroundColor }) => {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default Badge;