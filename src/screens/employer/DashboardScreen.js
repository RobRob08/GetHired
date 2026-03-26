// src/screens/employer/DashboardScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Badge from "../../components/badge";
import COLORS from "../../constants/colors";
import { subscribeEmployerApplications } from "../../services/applicationsService";
import { subscribeToActiveJobs } from "../../services/jobsService";

const STATUS_STYLE = {
  Active: { color: COLORS.green, bg: "#ECFDF5" },
  Paused: { color: COLORS.amber, bg: "#FFFBEB" },
  Closed: { color: COLORS.mid, bg: "#F1F5F9" },
};

const DashboardScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user } = route?.params || {};
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Only subscribe if component is mounted and user exists
    let isMounted = true;
    let unsubscribe = () => {};

    if (user?.uid) {
      unsubscribe = subscribeToActiveJobs(
        (activeJobs) => {
          if (isMounted) setJobs(activeJobs);
        },
        (error) => {
          if (isMounted) console.error("Error fetching jobs:", error);
        },
      );
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    const unsubscribe = subscribeEmployerApplications(
      user.uid,
      (apps) => {
        if (isMounted) setApplications(apps);
      },
      (error) => {
        if (isMounted) console.error("Error fetching applications:", error);
      },
    );
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.uid]);

  const stats = useMemo(() => {
    const posted = jobs.length;
    const applicants = applications.length;
    const hired = applications.filter((app) => app.status === "Hired").length;

    return [
      { label: "Posted", n: posted, icon: "assignment", color: COLORS.primary },
      {
        label: "Applicants",
        n: applicants,
        icon: "group",
        color: COLORS.purple,
      },
      { label: "Hired", n: hired, icon: "check-circle", color: COLORS.green },
    ];
  }, [jobs, applications]);

  const handlePostJob = () => {
    navigation.navigate("PostJob", { user });
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Dark header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMini}>
            <MaterialIcons name="assignment" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.brandName}>GetHired</Text>
            <Text style={styles.brandSub}>Employer Dashboard</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <MaterialIcons
                name={s.icon}
                size={20}
                color="#fff"
                style={styles.statIcon}
              />
              <Text style={[styles.statNum, { color: s.color }]}>{s.n}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Job Postings</Text>
          <TouchableOpacity style={styles.postBtn} onPress={handlePostJob}>
            <Text style={styles.postBtnText}>+ Post Job</Text>
          </TouchableOpacity>
        </View>

        {jobs.length > 0 ? (
          jobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobLogo}>
                <MaterialIcons name="work" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobMeta}>
                  {job.company} · {job.salary}
                </Text>
              </View>
              <Badge
                label="Active"
                color={COLORS.green}
                backgroundColor="#ECFDF5"
              />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="work-outline" size={48} color={COLORS.light} />
            <Text style={styles.emptyText}>No jobs posted yet</Text>
            <TouchableOpacity
              style={styles.postBtnLarge}
              onPress={handlePostJob}
            >
              <Text style={styles.postBtnText}>Post Your First Job</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  logoMini: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 16, fontWeight: "800", color: "#fff" },
  brandSub: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  statsRow: {
    flexDirection: "row",
    gap: 9,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statIcon: { fontSize: 20, marginBottom: 5 },
  statNum: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  scroll: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 18,
    marginBottom: 11,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.dark },
  postBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 7,
    elevation: 2,
  },
  postBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 10,
    gap: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  jobLogo: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.bg,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 13, fontWeight: "800", color: COLORS.dark },
  jobMeta: { fontSize: 10, color: COLORS.mid, marginTop: 2 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.mid,
    marginTop: 12,
    marginBottom: 20,
  },
  postBtnLarge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    elevation: 2,
  },
});

export default DashboardScreen;
