// src/screens/user/MapScreen.js
// Uses OpenStreetMap via an embedded Leaflet map in a WebView.
// This avoids native react-native-maps issues on Expo SDK 55 / Expo Go.
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import COLORS from "../../constants/colors";
import useApplications from "../../hooks/useApplications";
import useJobs from "../../hooks/useJobs";
import useLocation from "../../hooks/useLocation";
import { applyToJob } from "../../services/applicationsService";

const MapScreen = ({ user }) => {
  const { location } = useLocation();
  const { jobs } = useJobs();
  const { applications } = useApplications({ applicantId: user?.uid });
  const webViewRef = useRef(null);
  const [detailsJob, setDetailsJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const centerLat = location?.latitude ?? 14.5547;
  const centerLng = location?.longitude ?? 121.0244;

  // Check if user has already applied to this job
  useEffect(() => {
    if (detailsJob?.id && applications.length > 0) {
      const hasApplied = applications.some(
        (app) => app.jobId === detailsJob.id,
      );
      setAlreadyApplied(hasApplied);
    } else {
      setAlreadyApplied(false);
    }
  }, [detailsJob, applications]);

  // Build the HTML that renders a Leaflet map using OpenStreetMap tiles.
  const mapHtml = useMemo(() => {
    const currentLocationJs = `
      (function () {
        var userLocationIcon = L.divIcon({
          className: 'custom-current-location-icon',
          html: '<div class="current-location-pin user-pin"><div class="current-location-dot"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });

        var m = L.marker([${centerLat}, ${centerLng}], { icon: userLocationIcon }).addTo(window.map);
        m.bindPopup('Your current location');
        window.__currentLocationMarker = m;
      })();
    `;

    const markersJs = jobs
      .map((job) => {
        const payload = {
          id: job.id,
          title: job.title,
          company: job.company,
          salary: job.salary,
          type: job.type,
          latitude: job.latitude,
          longitude: job.longitude,
        };
        const popupHtml = `
          <div style="font-family: -apple-system, Segoe UI, Roboto, Arial; min-width: 180px;">
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 4px;">${job.title}</div>
            <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">${job.company}</div>
            <div style="font-weight: 800; color: #2563EB; font-size: 12px;">${job.salary} · ${job.type}</div>
            <button
              style="margin-top: 10px; width: 100%; padding: 8px 10px; border-radius: 10px; border: 0; background: #2563EB; color: #fff; font-weight: 800; font-size: 12px;"
              onclick='window.ReactNativeWebView.postMessage(${JSON.stringify(
                JSON.stringify({ type: "openJob", job: payload }),
              )})'
            >
              View details
            </button>
          </div>
        `;

        return `
          (function () {
            var m = L.marker([${job.latitude}, ${job.longitude}]).addTo(window.map);
            m._jobId = ${JSON.stringify(job.id)};
            m.bindPopup(${JSON.stringify(popupHtml)});
            window.__markers = window.__markers || {};
            window.__markers[m._jobId] = m;
          })();
        `;
      })
      .join("\n");

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
            .leaflet-control-attribution { font-size: 10px; }
            .custom-current-location-icon {
              background: transparent;
              border: 0;
            }
            .current-location-pin {
              width: 24px;
              height: 24px;
              border-radius: 999px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 10px 22px rgba(15, 23, 42, 0.22);
              border: 3px solid #ffffff;
            }
            .current-location-pin.user-pin {
              background: linear-gradient(135deg, #0f766e, #14b8a6);
            }
            .current-location-dot {
              width: 8px;
              height: 8px;
              border-radius: 999px;
              background: #ffffff;
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

            window.__markers = {};
            ${currentLocationJs}

            // Add job markers with popups
            ${markersJs}
          </script>
        </body>
      </html>
    `;
  }, [centerLat, centerLng, jobs]);

  const centerMapToJob = (job) => {
    if (webViewRef.current) {
      const script = `
        window.map.setView([${job.latitude}, ${job.longitude}], 15);
        if (window.__markers && window.__markers[${JSON.stringify(job.id)}]) {
          window.__markers[${JSON.stringify(job.id)}].openPopup();
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "openJob") {
        setDetailsJob(data.job);
        centerMapToJob(data.job);
      }
    } catch {
      // ignore
    }
  };

  const handleApply = async () => {
    if (alreadyApplied) {
      Alert.alert(
        "Already Applied",
        "You already submitted an application for this job.",
      );
      return;
    }

    if (!user?.uid || !detailsJob?.id) {
      Alert.alert("Error", "Missing user or job information.");
      return;
    }

    setApplying(true);
    try {
      const res = await applyToJob({
        job: detailsJob,
        applicantId: user.uid,
        applicantName: user.name,
        applicantEmail: user.email,
        employerId: detailsJob.createdBy,
      });
      if (res.created) {
        Alert.alert("Applied", "Your application has been sent.");
      } else {
        Alert.alert(
          "Already applied",
          "You already submitted an application for this job.",
        );
      }
      setDetailsJob(null);
    } catch (e) {
      Alert.alert("Apply failed", e?.message ?? "Please try again.");
    } finally {
      setApplying(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GetHired · Map</Text>
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.9}>
          <MaterialIcons name="search" size={16} color={COLORS.mid} />
          <Text style={styles.searchPlaceholder}>
            Search job title, location…
          </Text>
        </TouchableOpacity>
      </View>

      {/* OpenStreetMap via Leaflet in a WebView (works in Expo Go) */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        onMessage={onMessage}
      />

      {/* Bottom drawer */}
      <View style={styles.drawer}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MaterialIcons name="location-on" size={14} color={COLORS.dark} />
          <Text style={styles.drawerTitle}>{jobs.length} Jobs Nearby</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 9 }}
        >
          {jobs.map((job) => {
            const isApplied = applications.some((app) => app.jobId === job.id);
            return (
              <TouchableOpacity
                key={job.id}
                style={styles.drawerCard}
                activeOpacity={0.8}
                onPress={() => {
                  centerMapToJob(job);
                }}
              >
                {isApplied && (
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedBadgeText}>✓ Applied</Text>
                  </View>
                )}
                <MaterialIcons
                  name="work"
                  size={18}
                  color={COLORS.primary}
                  style={styles.cardIcon}
                />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {job.title}
                </Text>
                <Text style={styles.cardCompany} numberOfLines={1}>
                  {job.company}
                </Text>
                <Text style={styles.cardSalary}>{job.salary}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Job Details Modal */}
      <Modal
        visible={!!detailsJob}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsJob(null)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailsJob(null)}>
              <MaterialIcons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Job Details</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailSection}>
              <Text style={styles.jobDetailTitle}>{detailsJob?.title}</Text>
              <Text style={styles.jobDetailMeta}>{detailsJob?.company}</Text>
              <Text style={styles.jobDetailSalary}>
                {detailsJob?.salary} · {detailsJob?.type}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 14, paddingBottom: 20 }}>
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  (applying || alreadyApplied) && { opacity: 0.6 },
                  alreadyApplied && { backgroundColor: COLORS.mid },
                ]}
                onPress={handleApply}
                disabled={applying || alreadyApplied}
              >
                <Text style={styles.applyBtnText}>
                  {applying
                    ? "Applying..."
                    : alreadyApplied
                      ? "Already Applied"
                      : "Apply Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
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
  searchPlaceholder: {
    fontSize: 13,
    color: COLORS.mid,
  },
  map: { flex: 1 },
  drawer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    maxHeight: "30%",
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.dark,
  },
  drawerCard: {
    minWidth: 140,
    backgroundColor: COLORS.bg,
    borderRadius: 13,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  cardIcon: { marginBottom: 4 },
  cardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 2,
  },
  cardCompany: {
    fontSize: 9,
    color: COLORS.mid,
    marginBottom: 4,
  },
  cardSalary: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  appliedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  appliedBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.white,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.dark,
  },
  modalContent: {
    flex: 1,
    padding: 14,
  },
  detailSection: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    padding: 14,
    marginBottom: 16,
  },
  jobDetailTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 6,
  },
  jobDetailMeta: {
    fontSize: 12,
    color: COLORS.mid,
    marginBottom: 8,
  },
  jobDetailSalary: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 2,
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
});

export default MapScreen;
