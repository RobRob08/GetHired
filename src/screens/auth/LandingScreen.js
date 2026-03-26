// src/screens/auth/LandingScreen.js
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';

const FEATURES = [
  { icon: 'location-on', label: 'GPS Jobs' },
  { icon: 'insights', label: 'Track Apps' },
  { icon: 'business', label: 'Employers' },
  { icon: 'verified-user', label: 'Admin' },
];

const LandingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.logoBox}>
          <MaterialIcons name="assignment" size={50} color={COLORS.white} />
        </View>
        <Text style={styles.title}>GetHired</Text>
        <Text style={styles.subtitle}>
          Find your dream job near you,{'\n'}powered by location intelligence.
        </Text>

        <View style={styles.pills}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.pill}>
              <MaterialIcons
                name={feature.icon}
                size={14}
                color={COLORS.primary}
                style={styles.pillIcon}
              />
              <Text style={styles.pillText}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 28,
    paddingBottom: 44,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.dark,
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mid,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    backgroundColor: COLORS.bg,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillIcon: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    gap: 11,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  outlineBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  outlineBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LandingScreen;