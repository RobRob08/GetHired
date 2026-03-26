// src/screens/employer/LocationPickerScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import COLORS from "../../constants/colors";
import useLocation from "../../hooks/useLocation";

const LocationPickerScreen = ({ route, navigation }) => {
  const {
    initialLat = null,
    initialLng = null,
    jobDetails = {},
  } = route.params || {};
  const { location } = useLocation();
  const webViewRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLat,
    longitude: initialLng,
  });

  const centerLat = initialLat || location?.latitude || 14.5547;
  const centerLng = initialLng || location?.longitude || 121.0244;

  const mapHtml = useMemo(() => {
    const markerCode =
      selectedLocation.latitude && selectedLocation.longitude
        ? `
        var marker = L.marker([${selectedLocation.latitude}, ${selectedLocation.longitude}], {
          draggable: true,
          icon: L.icon({
            iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563EB" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/></svg>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          })
        }).addTo(window.map);

        marker.on('dragend', function() {
          var pos = marker.getLatLng();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'locationSelected',
            latitude: pos.lat,
            longitude: pos.lng,
          }));
        });

        window.currentMarker = marker;
      `
        : "";

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
            html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
            .leaflet-control-attribution { font-size: 10px; }
            .instructions {
              position: absolute;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #2563EB;
              color: white;
              padding: 12px 20px;
              border-radius: 10px;
              font-weight: bold;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .center-marker {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 10px;
              height: 10px;
              background: #2563EB;
              border: 3px solid white;
              border-radius: 50%;
              transform: translate(-50%, -50%);
              box-shadow: 0 0 10px rgba(0,0,0,0.3);
              pointer-events: none;
              z-index: 999;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <div class="center-marker"></div>
          <div class="instructions">Tap to place job location</div>
          <script
            src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossorigin=""
          ></script>
          <script>
            window.map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            }).addTo(window.map);

            ${markerCode}

            window.map.on('click', function(e) {
              if (window.currentMarker) {
                window.map.removeLayer(window.currentMarker);
              }
              var marker = L.marker([e.latlng.lat, e.latlng.lng], {
                draggable: true,
                icon: L.icon({
                  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563EB" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/></svg>',
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })
              }).addTo(window.map);

              marker.on('dragend', function() {
                var pos = marker.getLatLng();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationSelected',
                  latitude: pos.lat,
                  longitude: pos.lng,
                }));
              });

              window.currentMarker = marker;

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
              }));
            });
          </script>
        </body>
      </html>
    `;
  }, [centerLat, centerLng, selectedLocation]);

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "locationSelected") {
        setSelectedLocation({
          latitude: message.latitude,
          longitude: message.longitude,
        });
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
      Alert.alert(
        "Location Required",
        "Please select a location by tapping on the map.",
      );
      return;
    }
    navigation.navigate("PostJob", {
      jobDetails,
      selectedLocation,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Job Location</Text>
        <View style={{ width: 24 }} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        onMessage={handleWebViewMessage}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!selectedLocation.latitude || !selectedLocation.longitude) &&
              styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation.latitude || !selectedLocation.longitude}
        >
          <MaterialIcons name="check" size={20} color="white" />
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.dark },
  map: { flex: 1 },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.dark },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
});

export default LocationPickerScreen;
