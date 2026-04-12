// src/screens/admin/AdminDashboardScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Badge from "../../components/badge";
import COLORS from "../../constants/colors";
import { auth } from "../../firebase/firebaseConfig";
import {
  getAdminStats,
  reviewFlaggedJob,
  subscribeToDailyActivity,
  subscribeToFlaggedContent,
} from "../../services/adminService";

const isLogoutPermissionError = (error) => {
  return error?.code === "permission-denied" && !auth.currentUser;
};

const AdminDashboardScreen = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    regularUsers: 0,
    totalEmployers: 0,
    activeJobs: 0,
    totalApplications: 0,
  });
  const [dailyActivity, setDailyActivity] = useState({
    newUsers: 0,
    newJobs: 0,
    applications: 0,
  });
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading stats:", error);
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToDailyActivity(
      (activity) => setDailyActivity(activity),
      (error) => {
        if (isLogoutPermissionError(error)) return;
        console.error("Error fetching daily activity:", error);
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToFlaggedContent(
      (flagged) => setFlaggedContent(flagged),
      (error) => {
        if (isLogoutPermissionError(error)) return;
        console.error("Error fetching flagged content:", error);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleReviewFlagged = (item, approve) => {
    Alert.alert(
      approve ? "Approve Job" : "Delete Job",
      approve
        ? `Approve this job posting: "${item.title}"?`
        : `Permanently delete this job posting: "${item.title}"?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: approve ? "Approve" : "Delete",
          onPress: async () => {
            setReviewingId(item.id);
            try {
              await reviewFlaggedJob(item.id, approve);
              Alert.alert("Success", approve ? "Job approved" : "Job deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to review job");
            } finally {
              setReviewingId(null);
            }
          },
          style: approve ? "default" : "destructive",
        },
      ],
    );
  };

  const statsData = useMemo(
    () => [
      {
        label: "Total Users",
        n: (user?.role === "admin"
          ? stats.regularUsers
          : stats.totalUsers
        ).toString(),
        color: COLORS.primary,
        icon: "group",
      },
      {
        label: "Employers",
        n: stats.totalEmployers.toString(),
        color: COLORS.purple,
        icon: "business",
      },
      {
        label: "Active Jobs",
        n: stats.activeJobs.toString(),
        color: COLORS.green,
        icon: "work",
      },
      {
        label: "Applications",
        n: stats.totalApplications.toString(),
        color: COLORS.amber,
        icon: "mail",
      },
    ],
    [stats, user?.role],
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMini}>
            <MaterialIcons name="assignment" size={17} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>GetHired</Text>
            <Text style={styles.brandSub}>Admin Panel</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <MaterialIcons name="logout" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.pageTitle}>Platform Overview</Text>
        <Text style={styles.pageDate}>Real-time stats · Feb 17, 2026</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {statsData.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.statCard}
                  onPress={() => {
                    if (s.label === "Total Users") navigation.navigate("Users");
                  }}
                >
                  <View style={styles.statTop}>
                    <MaterialIcons name={s.icon} size={20} color="#fff" />
                  </View>
                  <Text style={[styles.statNum, { color: s.color }]}>
                    {s.n}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Activity bars */}
            <View style={styles.activityCard}>
              <Text style={styles.cardTitle}>Platform Activity (Today)</Text>
              <View style={styles.barRow}>
                <View style={styles.barMeta}>
                  <Text style={styles.barLabel}>New Users Today</Text>
                  <Text style={[styles.barVal, { color: COLORS.primary }]}>
                    {dailyActivity.newUsers}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min((dailyActivity.newUsers / 50) * 100, 100)}%`,
                        backgroundColor: COLORS.primary,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.barRow}>
                <View style={styles.barMeta}>
                  <Text style={styles.barLabel}>New Jobs Posted</Text>
                  <Text style={[styles.barVal, { color: COLORS.purple }]}>
                    {dailyActivity.newJobs}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min((dailyActivity.newJobs / 30) * 100, 100)}%`,
                        backgroundColor: COLORS.purple,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.barRow}>
                <View style={styles.barMeta}>
                  <Text style={styles.barLabel}>Applications Today</Text>
                  <Text style={[styles.barVal, { color: COLORS.green }]}>
                    {dailyActivity.applications}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min((dailyActivity.applications / 100) * 100, 100)}%`,
                        backgroundColor: COLORS.green,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Flagged content */}
            <View style={styles.flaggedCard}>
              <View style={styles.flaggedHeader}>
                <Text style={styles.cardTitle}>Flagged Content</Text>
                <Badge
                  label={`${flaggedContent.length} issues`}
                  color={COLORS.red}
                  backgroundColor="rgba(239,68,68,0.18)"
                />
              </View>
              {flaggedContent.length === 0 ? (
                <View style={styles.noFlaggedContainer}>
                  <MaterialIcons
                    name="check-circle"
                    size={32}
                    color={COLORS.green}
                  />
                  <Text style={styles.noFlaggedText}>No flagged content</Text>
                </View>
              ) : (
                flaggedContent.map((item) => (
                  <View key={item.id} style={styles.flagRow}>
                    <View style={styles.flagInfo}>
                      <MaterialIcons
                        name="warning-amber"
                        size={18}
                        color={COLORS.amber}
                      />
                      <View style={styles.flagDetails}>
                        <Text style={styles.flagTitle}>{item.title}</Text>
                        <Text style={styles.flagCompany}>{item.company}</Text>
                      </View>
                    </View>
                    <View style={styles.flagActions}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleReviewFlagged(item, true)}
                        disabled={reviewingId === item.id}
                      >
                        {reviewingId === item.id ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.green}
                          />
                        ) : (
                          <MaterialIcons
                            name="check"
                            size={18}
                            color={COLORS.green}
                          />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleReviewFlagged(item, false)}
                        disabled={reviewingId === item.id}
                      >
                        {reviewingId === item.id ? (
                          <ActivityIndicator size="small" color={COLORS.red} />
                        ) : (
                          <MaterialIcons
                            name="delete"
                            size={18}
                            color={COLORS.red}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  logoMini: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 14, fontWeight: "800", color: COLORS.white },
  brandSub: { fontSize: 9, color: "rgba(255,255,255,0.45)" },
  logoutBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 2,
  },
  pageDate: { fontSize: 10, color: "rgba(255,255,255,0.4)" },
  scroll: { flex: 1 },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statIcon: { fontSize: 18 },
  trendBadge: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trendText: { fontSize: 9, color: COLORS.green, fontWeight: "700" },
  statNum: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 2 },
  activityCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 10,
  },
  barRow: { marginBottom: 10 },
  barMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  barLabel: { fontSize: 10, color: "rgba(255,255,255,0.55)", flex: 1 },
  barVal: { fontSize: 10, fontWeight: "700", flexShrink: 0 },
  barBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  flaggedCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  flaggedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  noFlaggedContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  noFlaggedText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
    fontWeight: "600",
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(239,68,68,0.07)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.12)",
    flexWrap: "wrap",
  },
  flagInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 200,
  },
  flagDetails: {
    flex: 1,
    minWidth: 0,
  },
  flagTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  flagCompany: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    marginTop: 1,
  },
  flagActions: {
    flexDirection: "row",
    gap: 4,
    flexShrink: 0,
  },
  approveBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(16,185,129,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(239,68,68,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
});

export default AdminDashboardScreen;
