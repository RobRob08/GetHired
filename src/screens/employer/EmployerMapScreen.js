// src/screens/employer/EmployerMapScreen.js
// Employer map using OpenStreetMap (Leaflet) in a WebView (works in Expo Go)
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import COLORS from '../../constants/colors';
import { JOB_CATEGORIES } from '../../constants/data';
import useLocation from '../../hooks/useLocation';
import useJobs from '../../hooks/useJobs';
import InputField from '../../components/InputField';
import { createJobPin } from '../../services/jobsService';

const EmployerMapScreen = ({ user }) => {
  const { location } = useLocation();
  const { jobs } = useJobs();
  const webViewRef = useRef(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    company: user?.name ?? 'Your Company',
    salary: '',
    type: 'Full-time',
    category: JOB_CATEGORIES?.[0]?.label ?? 'Tech',
    latitude: null,
    longitude: null,
  });

  const centerLat = location?.latitude ?? 14.5547;
  const centerLng = location?.longitude ?? 121.0244;

  const mapHtml = useMemo(() => {
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
                JSON.stringify({ type: 'openJob', job: payload })
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
      .join('\n');

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
            window.map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(window.map);

            window.__markers = {};

            // Tap on map to create a new pin
            window.map.on('click', function (e) {
              var msg = { type: 'mapClick', latitude: e.latlng.lat, longitude: e.latlng.lng };
              window.ReactNativeWebView.postMessage(JSON.stringify(msg));
            });

            // Create markers for all jobs
            ${markersJs}

            // Expose a tiny API for React Native to focus a job
            window.__focusJob = function(jobId, lat, lng) {
              try {
                window.map.setView([lat, lng], 15, { animate: true });
                var m = window.__markers && window.__markers[jobId];
                if (m && m.openPopup) m.openPopup();
              } catch (e) {}
            };
          </script>
        </body>
      </html>
    `;
  }, [centerLat, centerLng, jobs]);

  const focusJobOnMap = (job) => {
    const js = `window.__focusJob(${JSON.stringify(job.id)}, ${job.latitude}, ${job.longitude}); true;`;
    webViewRef.current?.injectJavaScript(js);
  };

  const openCreateWithCoords = (latitude, longitude) => {
    setDraft((d) => ({
      ...d,
      company: user?.name ?? d.company,
      latitude,
      longitude,
    }));
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!draft.title.trim() || !draft.salary.trim() || draft.latitude == null || draft.longitude == null) {
      Alert.alert('Missing fields', 'Please add title, salary, and map location.');
      return;
    }

    setCreating(true);
    try {
      await createJobPin({
        title: draft.title,
        company: draft.company || user?.name || 'Your Company',
        salary: draft.salary,
        type: draft.type,
        category: draft.category,
        latitude: draft.latitude,
        longitude: draft.longitude,
        createdBy: user?.uid ?? null,
      });

      setCreateOpen(false);
      setDraft({
        title: '',
        company: user?.name ?? 'Your Company',
        salary: '',
        type: 'Full-time',
        category: JOB_CATEGORIES?.[0]?.label ?? 'Tech',
        latitude: null,
        longitude: null,
      });
    } catch (error) {
      Alert.alert('Failed to create pin', error?.message ?? 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const [detailsJob, setDetailsJob] = useState(null);

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        openCreateWithCoords(data.latitude, data.longitude);
      } else if (data.type === 'openJob') {
        setDetailsJob(data.job);
      }
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>GetHired · Employer Map</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => openCreateWithCoords(centerLat, centerLng)} activeOpacity={0.85}>
            <MaterialIcons name="add" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.9}>
          <MaterialIcons name="search" size={16} color={COLORS.mid} />
          <Text style={styles.searchPlaceholder}>Tap map to drop a job pin…</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        onMessage={onMessage}
      />

      <View style={styles.drawer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialIcons name="location-on" size={14} color={COLORS.dark} />
          <Text style={styles.drawerTitle}>{jobs.length} Pins</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
          {jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.drawerCard}
              onPress={() => focusJobOnMap(job)}
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

      {/* Create pin modal */}
      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Job Pin</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)} style={styles.modalClose} activeOpacity={0.8}>
                <MaterialIcons name="close" size={18} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <InputField
              label="Job Title"
              iconName="work"
              placeholder="e.g. React Native Developer"
              value={draft.title}
              onChangeText={(t) => setDraft((d) => ({ ...d, title: t }))}
            />
            <InputField
              label="Company"
              iconName="business"
              placeholder="Company name"
              value={draft.company}
              onChangeText={(t) => setDraft((d) => ({ ...d, company: t }))}
            />
            <InputField
              label="Salary"
              iconName="payments"
              placeholder="e.g. ₱80k / mo"
              value={draft.salary}
              onChangeText={(t) => setDraft((d) => ({ ...d, salary: t }))}
            />
            <InputField
              label="Type"
              iconName="schedule"
              placeholder="Full-time / Part-time / Remote"
              value={draft.type}
              onChangeText={(t) => setDraft((d) => ({ ...d, type: t }))}
            />

            <View style={styles.catSelectWrap}>
              <Text style={styles.catSelectLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {JOB_CATEGORIES.map((cat) => {
                  const selected = draft.category === cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        { backgroundColor: cat.bg },
                        selected && { borderWidth: 2, borderColor: COLORS.primary },
                      ]}
                      activeOpacity={0.85}
                      onPress={() =>
                        setDraft((d) => ({ ...d, category: cat.label }))
                      }
                    >
                      <Text style={[styles.catChipText, { color: cat.color }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.coordRow}>
              <Text style={styles.coordText}>
                Pin: {draft.latitude?.toFixed?.(5) ?? '—'}, {draft.longitude?.toFixed?.(5) ?? '—'}
              </Text>
              <Text style={styles.coordHint}>Tap the map to set pin location</Text>
            </View>

            <TouchableOpacity style={styles.modalPrimary} onPress={submitCreate} activeOpacity={0.9} disabled={creating}>
              <Text style={styles.modalPrimaryText}>{creating ? 'Creating...' : 'Create Pin'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Details modal */}
      <Modal visible={!!detailsJob} animationType="fade" transparent onRequestClose={() => setDetailsJob(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Job Details</Text>
              <TouchableOpacity onPress={() => setDetailsJob(null)} style={styles.modalClose} activeOpacity={0.8}>
                <MaterialIcons name="close" size={18} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <Text style={styles.detailsTitle}>{detailsJob?.title}</Text>
            <Text style={styles.detailsCompany}>{detailsJob?.company}</Text>
            <Text style={styles.detailsMeta}>{detailsJob?.salary} · {detailsJob?.type}</Text>

            <TouchableOpacity
              style={[styles.modalPrimary, { marginTop: 14 }]}
              onPress={() => {
                if (detailsJob) focusJobOnMap(detailsJob);
                setDetailsJob(null);
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.modalPrimaryText}>Show on map</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  addBtn: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
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
  searchPlaceholder: { fontSize: 12, color: COLORS.mid },
  map: { flex: 1 },
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 18,
    marginTop: 120,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontSize: 14, fontWeight: '900', color: COLORS.dark },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordRow: { marginTop: 2, marginBottom: 12 },
  coordText: { fontSize: 11, color: COLORS.dark, fontWeight: '700' },
  coordHint: { fontSize: 10, color: COLORS.mid, marginTop: 3 },
  catSelectWrap: { marginTop: 2, marginBottom: 10 },
  catSelectLabel: { fontSize: 11, fontWeight: '900', color: COLORS.dark, marginBottom: 8 },
  catChip: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catChipText: { fontSize: 12, fontWeight: '900' },
  modalPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryText: { color: COLORS.white, fontSize: 12, fontWeight: '900' },
  detailsTitle: { fontSize: 15, fontWeight: '900', color: COLORS.dark, marginTop: 4 },
  detailsCompany: { fontSize: 11, color: COLORS.mid, marginTop: 4 },
  detailsMeta: { fontSize: 12, color: COLORS.primary, fontWeight: '800', marginTop: 8 },
});

export default EmployerMapScreen;

