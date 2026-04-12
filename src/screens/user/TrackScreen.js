// src/screens/user/TrackScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Badge from "../../components/badge";
import COLORS from "../../constants/colors";
import useApplications from "../../hooks/useApplications";

const STATUS_COLORS = {
  Applied: { color: COLORS.primary, bg: COLORS.primaryBg },
  Approved: { color: COLORS.purple, bg: COLORS.secondaryBg },
  Hired: { color: COLORS.green, bg: COLORS.successBg },
  Rejected: { color: COLORS.red, bg: COLORS.redBg },
};

const TrackScreen = ({ user }) => {
  const { applications, counts, loading } = useApplications({
    applicantId: user?.uid,
  });

  const stats = useMemo(() => {
    return [
      {
        label: "Applied",
        n: counts.Applied,
        color: COLORS.primary,
        bg: COLORS.primaryBg,
        icon: "mail",
      },
      {
        label: "Approved",
        n: counts.Approved,
        color: COLORS.purple,
        bg: COLORS.secondaryBg,
        icon: "check-circle",
      },
      {
        label: "Hired",
        n: counts.Hired,
        color: COLORS.green,
        bg: COLORS.successBg,
        icon: "emoji-events",
      },
      {
        label: "Rejected",
        n: counts.Rejected,
        color: COLORS.red,
        bg: COLORS.redBg,
        icon: "cancel",
      },
    ];
  }, [counts]);

  const progressed = counts.Approved + counts.Hired;
  const total = applications.length;
  const pct = total ? Math.round((progressed / total) * 100) : 0;
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Application Tracker</Text>
        <Text style={styles.subtitle}>Monitor your job applications</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View
              key={i}
              style={[styles.statCard, { borderColor: s.bg, borderWidth: 2 }]}
            >
              <MaterialIcons
                name={s.icon}
                size={20}
                color={s.color}
                style={styles.statIcon}
              />
              <Text style={[styles.statNum, { color: s.color }]}>{s.n}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={[styles.progressPct, { color: COLORS.primary }]}>
              {pct}%
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressSub}>
            {progressed} of {total} applications progressed
          </Text>
        </View>

        {/* Applications list */}
        <Text style={styles.listTitle}>Recent Applications</Text>
        {loading ? (
          <Text style={styles.emptyText}>Loading applications...</Text>
        ) : applications.length === 0 ? (
          <Text style={styles.emptyText}>No applications yet.</Text>
        ) : (
          applications.map((app) => {
            const sc = STATUS_COLORS[app.status] || {
              color: COLORS.mid,
              bg: COLORS.bg,
            };
            return (
              <View key={app.id} style={styles.appCard}>
                <View style={styles.appLogo}>
                  <MaterialIcons name="work" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appTitle}>{app.jobTitle}</Text>
                  <Text style={styles.appMeta}>{app.employerName}</Text>
                </View>
                <Badge
                  label={app.status}
                  color={sc.color}
                  backgroundColor={sc.bg}
                />
              </View>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "900", color: COLORS.dark },
  subtitle: { fontSize: 10, color: COLORS.mid, marginTop: 1 },
  scroll: { flex: 1 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "20%",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 8,
    elevation: 1,
    alignItems: "center",
  },
  statIcon: { fontSize: 18, marginBottom: 3 },
  statNum: { fontSize: 16, fontWeight: "900" },
  statLabel: {
    fontSize: 8,
    color: COLORS.mid,
    fontWeight: "600",
    marginTop: 1,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 8,
    marginBottom: 10,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
    gap: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.dark,
    flex: 1,
  },
  progressPct: { fontSize: 11, fontWeight: "700", flexShrink: 0 },
  progressBg: {
    height: 7,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "33%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressSub: { fontSize: 9, color: COLORS.mid, marginTop: 5 },
  listTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.dark,
    marginHorizontal: 10,
    marginBottom: 8,
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 8,
    marginBottom: 6,
    gap: 6,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: COLORS.grayBg,
  },
  appLogo: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  appInfo: { flex: 1, minWidth: 0 },
  appTitle: { fontSize: 11, fontWeight: "800", color: COLORS.dark },
  appMeta: { fontSize: 9, color: COLORS.mid, marginTop: 1 },
});

export default TrackScreen;
