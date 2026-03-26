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
import {
    getAdminStats,
    reviewFlaggedJob,
    subscribeToFlaggedContent,
} from "../../services/adminService";

const ACTIVITY = [
  { label: "New Users Today", val: 12, max: 50, color: COLORS.primary },
  { label: "New Jobs Posted", val: 8, max: 30, color: COLORS.purple },
  { label: "Applications Today", val: 47, max: 100, color: COLORS.green },
];

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployers: 0,
    activeJobs: 0,
    totalApplications: 0,
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
    const unsubscribe = subscribeToFlaggedContent(
      (flagged) => setFlaggedContent(flagged),
      (error) => console.error("Error fetching flagged content:", error),
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
        n: stats.totalUsers.toString(),
        color: COLORS.primary,
        icon: "group",
        trend: "+12%",
      },
      {
        label: "Employers",
        n: stats.totalEmployers.toString(),
        color: COLORS.purple,
        icon: "business",
        trend: "+5%",
      },
      {
        label: "Active Jobs",
        n: stats.activeJobs.toString(),
        color: COLORS.green,
        icon: "work",
        trend: "+18%",
      },
      {
        label: "Applications",
        n: stats.totalApplications.toString(),
        color: COLORS.amber,
        icon: "mail",
        trend: "+22%",
      },
    ],
    [stats],
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMini}>
            <MaterialIcons name="assignment" size={17} color="#fff" />
          </View>
          <View>
            <Text style={styles.brandName}>GetHired</Text>
            <Text style={styles.brandSub}>Admin Panel</Text>
          </View>
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
                    <View style={styles.trendBadge}>
                      <Text style={styles.trendText}>{s.trend}</Text>
                    </View>
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
              <Text style={styles.cardTitle}>Platform Activity</Text>
              {ACTIVITY.map((bar, i) => (
                <View key={i} style={styles.barRow}>
                  <View style={styles.barMeta}>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                    <Text style={[styles.barVal, { color: bar.color }]}>
                      {bar.val}
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(bar.val / bar.max) * 100}%`,
                          backgroundColor: bar.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  logoMini: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 15, fontWeight: "800", color: COLORS.white },
  brandSub: { fontSize: 10, color: "rgba(255,255,255,0.45)" },
  pageTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 3,
  },
  pageDate: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  scroll: { flex: 1 },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 14,
  },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  statIcon: { fontSize: 20 },
  trendBadge: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  trendText: { fontSize: 10, color: COLORS.green, fontWeight: "700" },
  statNum: { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3 },
  activityCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 12,
  },
  barRow: { marginBottom: 12 },
  barMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  barLabel: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
  barVal: { fontSize: 11, fontWeight: "700" },
  barBg: {
    height: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  flaggedCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  flaggedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  noFlaggedContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  noFlaggedText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    fontWeight: "600",
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(239,68,68,0.07)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.12)",
  },
  flagInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  flagDetails: {
    flex: 1,
  },
  flagTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  flagCompany: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  flagActions: {
    flexDirection: "row",
    gap: 6,
  },
  approveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
});

export default AdminDashboardScreen;
