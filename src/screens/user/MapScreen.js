// src/screens/user/MapScreen.js
// Uses OpenStreetMap via an embedded Leaflet map in a WebView.
// This avoids native react-native-maps issues on Expo SDK 55 / Expo Go.
import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import COLORS from '../../constants/colors';
import useJobs from '../../hooks/useJobs';
import useLocation from '../../hooks/useLocation';

const MapScreen = () => {
  const { location } = useLocation();
  const { jobs } = useJobs();
  const webViewRef = useRef(null);

  const centerLat = location?.latitude   ?? 14.5547;
  const centerLng = location?.longitude ?? 121.0244;

  // Build the HTML that renders a Leaflet map using OpenStreetMap tiles.
  const mapHtml = useMemo(() => {
    const markersJs = jobs.map((job) => {
      const title = `${job.title} · ${job.company}`;
      // Use JSON.stringify to safely escape strings
      return `
        L.marker([${job.latitude}, ${job.longitude}])
          .addTo(window.map)
          .bindPopup(${JSON.stringify(title)});
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossorigin=""
          />
          <style>
            html, body, #map {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>

          <script
            src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""
          ></script>
          <script>
            // Initialize map centered on the user's (or fallback) location
            window.map = L.map('map').setView([${centerLat}, ${centerLng}], 13);

            // OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(window.map);

            // Add job markers
            ${markersJs}
          </script>
        </body>
      </html>
    `;
  }, [centerLat, centerLng, jobs]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GetHired · Map</Text>
        <TouchableOpacity style={styles.searchBar}>
          <MaterialIcons name="search" size={16} color={COLORS.mid} />
          <Text style={styles.searchPlaceholder}>Search job title, location…</Text>
        </TouchableOpacity>
      </View>

      {/* OpenStreetMap via Leaflet in a WebView (works in Expo Go) */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
      />

      {/* Bottom drawer */}
      <View style={styles.drawer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialIcons name="location-on" size={14} color={COLORS.dark} />
          <Text style={styles.drawerTitle}>{jobs.length} Jobs Nearby</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
          {jobs.map(job => (
            <TouchableOpacity
              key={job.id}
              style={styles.drawerCard}
              activeOpacity={0.8}
            >
              <MaterialIcons name="work" size={18} color={COLORS.primary} style={styles.cardIcon} />
              <Text style={styles.cardTitle} numberOfLines={1}>{job.title}</Text>
              <Text style={styles.cardCompany} numberOfLines={1}>{job.company}</Text>
              <Text style={styles.cardSalary}>{job.salary}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
    gap: 9,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchIcon: { fontSize: 14, color: COLORS.mid },
  searchPlaceholder: { fontSize: 12, color: COLORS.mid },

  // Map fills remaining space
  map: { flex: 1 },

  // Custom job pin
  pin: {
    width: 36, height: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  pinEmoji: { fontSize: 16 },

  // Callout popup
  callout: {
    width: 180,
    padding: 10,
    borderRadius: 12,
  },
  calloutTitle: { fontSize: 13, fontWeight: '800', color: COLORS.dark, marginBottom: 3 },
  calloutCompany: { fontSize: 11, color: COLORS.mid, marginBottom: 4 },
  calloutSalary: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // Bottom drawer
  drawer: {
    backgroundColor: COLORS.white,
    paddingTop: 12,
    paddingBottom: 10,
    paddingLeft: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 9,
  },
  drawerCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 13,
    padding: 11,
    width: 155,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  cardIcon: { marginBottom: 5 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  cardCompany: { fontSize: 10, color: COLORS.mid, marginBottom: 4 },
  cardSalary: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
});

export default MapScreen;