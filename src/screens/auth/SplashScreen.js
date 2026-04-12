// src/screens/auth/SplashScreen.js
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const splashLogo = require('../../../assets/images/splash-icon.png');

const SplashScreen = ({ navigation }) => {
  return (
    <LinearGradient colors={['#2D4FE0', '#4F6FFF', '#8B5CF6']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* Decorative rings */}
      <View style={[styles.ring, { width: 400, height: 400, borderColor: 'rgba(255,255,255,0.06)' }]} />
      <View style={[styles.ring, { width: 270, height: 270, borderColor: 'rgba(255,255,255,0.09)' }]} />
      <View style={[styles.ring, { width: 150, height: 150, borderColor: 'rgba(255,255,255,0.12)' }]} />

      {/* Logo */}
      <View style={styles.logoBox}>
        <Image source={splashLogo} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Title */}
      <Text style={styles.title}>GetHired</Text>
      <Text style={styles.subtitle}>YOUR CAREER STARTS HERE</Text>

      {/* CTA */}
      <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('Landing')} activeOpacity={0.8}>
        <Text style={styles.btnText}>Get Started →</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>For Job Seekers · Employers · Admins</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    alignSelf: 'center',
  },
  logoBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 3,
    marginBottom: 52,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 50,
    marginBottom: 20,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
});

export default SplashScreen;
