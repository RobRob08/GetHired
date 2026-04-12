// src/screens/user/HomeScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import JobCard from "../../components/JobCard";
import COLORS from "../../constants/colors";
import { JOB_CATEGORIES } from "../../constants/data";
import { db } from "../../firebase/firebaseConfig";
import useJobs from "../../hooks/useJobs";
import useLocation from "../../hooks/useLocation";
import useNotifications from "../../hooks/useNotifications";
import { applyToJob } from "../../services/applicationsService";

const HomeScreen = ({ user }) => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [preferredLocationDraft, setPreferredLocationDraft] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const { jobs, loading } = useJobs();
  const { place, loading: locLoading } = useLocation();
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
  } = useNotifications({
    recipientId: user?.uid,
  });

  const categoryCounts = jobs.reduce((acc, job) => {
    const label = (job?.category ?? "").toLowerCase();
    if (!label) return acc;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const selectedCategory =
    JOB_CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null;

  useEffect(() => {
    setPreferredLocationDraft(user?.location ?? "");
  }, [user?.location]);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q);

    const matchesCategory =
      !selectedCategory ||
      (j.category ?? "").toLowerCase() === selectedCategory.label.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleApply = async (job) => {
    if (!user?.uid) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }
    if (!job?.createdBy) {
      Alert.alert(
        "Missing employer info",
        "This job pin is missing its employer reference.",
      );
      return;
    }

    try {
      const res = await applyToJob({
        job,
        applicantId: user.uid,
        applicantName: user.name,
        applicantEmail: user.email,
        employerId: job.createdBy,
      });
      if (res.created) {
        Alert.alert("Applied", "Your application has been sent.");
      } else {
        Alert.alert(
          "Already applied",
          "You already submitted an application for this job.",
        );
      }
    } catch (e) {
      Alert.alert("Apply failed", e?.message ?? "Please try again.");
    }
  };

  const savePreferredLocation = async () => {
    if (!user?.uid) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    setSavingLocation(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          role: user?.role ?? "user",
          location: preferredLocationDraft.trim(),
        },
        { merge: true },
      );
      setLocationModalOpen(false);
    } catch (e) {
      Alert.alert("Save failed", e?.message ?? "Could not save location.");
    } finally {
      setSavingLocation(false);
    }
  };

  const clearPreferredLocation = async () => {
    setPreferredLocationDraft("");
    if (!user?.uid) return;

    setSavingLocation(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { role: user?.role ?? "user", location: "" },
        { merge: true },
      );
      setLocationModalOpen(false);
    } catch (e) {
      Alert.alert("Save failed", e?.message ?? "Could not clear location.");
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoMini}>
              <MaterialIcons name="assignment" size={18} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.brandName}>GetHired</Text>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                activeOpacity={0.85}
                onPress={() => setLocationModalOpen(true)}
              >
                <MaterialIcons
                  name="location-on"
                  size={12}
                  color={COLORS.mid}
                />
                <Text style={styles.location}>
                  {user?.location?.trim()
                    ? user.location.trim()
                    : locLoading
                      ? "Getting location..."
                      : place?.city || "Select Location"}
                </Text>
                <MaterialIcons name="edit" size={12} color={COLORS.mid} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate("Notifications")}
            activeOpacity={0.9}
          >
            <MaterialIcons name="notifications" size={18} color={COLORS.dark} />
            {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
          </TouchableOpacity>
        </View>

        {/* Notifications preview */}
        {!notifLoading && notifications.length > 0 ? (
          <TouchableOpacity
            style={styles.notifPreview}
            onPress={() => navigation.navigate("Notifications")}
            activeOpacity={0.9}
          >
            <View style={styles.notifPreviewHeader}>
              <MaterialIcons
                name="notifications"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.notifPreviewTitle}>
                {unreadCount > 0 ? `${unreadCount} new` : "Notifications"}
              </Text>
            </View>
            <Text style={styles.notifPreviewMsg} numberOfLines={2}>
              {notifications[0]?.message ?? ""}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Search bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={COLORS.mid} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search job title, location etc."
            placeholderTextColor={COLORS.mid}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => navigation.navigate("JobCategories")}
          >
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("JobCategories")}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={{ paddingLeft: 10, paddingRight: 10, gap: 8 }}
        >
          {JOB_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catCard,
                { backgroundColor: cat.bg },
                selectedCategoryId === cat.id && {
                  borderWidth: 2,
                  borderColor: COLORS.primary,
                },
              ]}
              activeOpacity={0.85}
              onPress={() =>
                setSelectedCategoryId((prev) =>
                  prev === cat.id ? null : cat.id,
                )
              }
            >
              <View style={[styles.catIcon, { backgroundColor: cat.color }]}>
                <MaterialIcons name="work" size={18} color={COLORS.white} />
              </View>
              <Text style={[styles.catLabel, { color: cat.color }]}>
                {cat.label}
              </Text>
              <Text style={styles.catCount}>
                {categoryCounts[cat.label.toLowerCase()] ?? 0} jobs
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Job listings */}
        <View style={[styles.sectionHeader, { marginTop: 18 }]}>
          <Text style={styles.sectionTitle}>Near You</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("JobCategories")}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.jobList}>
          {loading && <Text style={styles.emptyText}>Loading jobs...</Text>}
          {!loading && filtered.length === 0 && (
            <Text style={styles.emptyText}>No jobs found yet.</Text>
          )}
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => {}}
              onApply={handleApply}
            />
          ))}
        </View>
      </ScrollView>

      {/* Preferred home location modal */}
      <Modal
        visible={locationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Home location</Text>
              <TouchableOpacity
                onPress={() => setLocationModalOpen(false)}
                style={styles.modalClose}
                activeOpacity={0.85}
              >
                <MaterialIcons name="close" size={18} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              Set a preferred location for your Home page. Leave empty to use
              GPS.
            </Text>

            <View style={styles.modalInputRow}>
              <MaterialIcons name="location-on" size={18} color={COLORS.mid} />
              <TextInput
                style={styles.modalInput}
                placeholder="City, Country (e.g. Makati City)"
                placeholderTextColor={COLORS.mid}
                value={preferredLocationDraft}
                onChangeText={setPreferredLocationDraft}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondary}
                onPress={clearPreferredLocation}
                disabled={savingLocation}
              >
                <Text style={styles.modalSecondaryText}>Use GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimary}
                onPress={savePreferredLocation}
                disabled={savingLocation}
              >
                <Text style={styles.modalPrimaryText}>
                  {savingLocation ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  logoMini: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 14, fontWeight: "800", color: COLORS.dark },
  location: { fontSize: 9, color: COLORS.mid },
  notifBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    position: "relative",
    flexShrink: 0,
  },
  notifDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    backgroundColor: COLORS.red,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notifPreview: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    elevation: 1,
  },
  notifPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  notifPreviewTitle: { fontSize: 11, fontWeight: "900", color: COLORS.dark },
  notifPreviewMsg: { fontSize: 10, color: COLORS.mid, fontWeight: "600" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    elevation: 2,
  },
  searchIcon: { fontSize: 14, color: COLORS.mid },
  searchInput: { flex: 1, fontSize: 12, color: COLORS.dark },
  filterBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  filterText: { color: COLORS.white, fontSize: 9, fontWeight: "600" },
  scroll: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 6,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: COLORS.dark },
  seeAll: { fontSize: 9, color: COLORS.primary, fontWeight: "600" },
  catScroll: { paddingBottom: 4 },
  catCard: {
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    minWidth: 75,
  },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  catLabel: {
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 11,
  },
  catCount: { fontSize: 8, color: COLORS.mid, marginTop: 1 },
  jobList: { paddingHorizontal: 8, paddingBottom: 20 },
  emptyText: { fontSize: 11, color: COLORS.mid, marginBottom: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 14, fontWeight: "900", color: COLORS.dark },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHint: {
    fontSize: 11,
    color: COLORS.mid,
    marginBottom: 12,
    lineHeight: 16,
  },
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 9,
  },
  modalInput: { flex: 1, fontSize: 13, color: COLORS.dark },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalSecondary: {
    flex: 1,
    backgroundColor: COLORS.grayBg,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 11,
  },
  modalSecondaryText: { color: COLORS.mid, fontWeight: "800", fontSize: 12 },
  modalPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 11,
  },
  modalPrimaryText: { color: COLORS.white, fontWeight: "900", fontSize: 12 },
});

export default HomeScreen;
