// src/screens/employer/DashboardScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Badge from "../../components/badge";
import COLORS from "../../constants/colors";
import { auth } from "../../firebase/firebaseConfig";
import { subscribeEmployerApplications } from "../../services/applicationsService";
import { subscribeToEmployerJobs } from "../../services/jobsService";

const STATUS_STYLE = {
  Active: { color: COLORS.green, bg: "#ECFDF5" },
  Paused: { color: COLORS.amber, bg: "#FFFBEB" },
  Closed: { color: COLORS.mid, bg: "#F1F5F9" },
};

const isLogoutPermissionError = (error) => {
  return (
    error?.code === "permission-denied" &&
    !auth.currentUser
  );
};

const DashboardScreen = ({ route, user: propsUser }) => {
  const navigation = useNavigation();
  // Try to get user from props first, then route params as fallback
  const user = propsUser || route?.params?.user;
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Only subscribe if component is mounted and user exists
    let isMounted = true;
    let unsubscribe = () => {};

    if (user?.uid) {
      unsubscribe = subscribeToEmployerJobs(
        user.uid,
        (employerJobs) => {
          if (isMounted) setJobs(employerJobs);
        },
        (error) => {
          if (isLogoutPermissionError(error)) return;
          if (isMounted) console.error("Error fetching employer jobs:", error);
        },
      );
    } else {
      setJobs([]);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setApplications([]);
      return;
    }

    let isMounted = true;
    const unsubscribe = subscribeEmployerApplications(
      user.uid,
      (apps) => {
        if (isMounted) setApplications(apps);
      },
      (error) => {
        if (isLogoutPermissionError(error)) return;
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
            <MaterialIcons name="map" size={48} color={COLORS.light} />
            <Text style={styles.emptyText}>No jobs posted yet</Text>
            <Text style={styles.emptySubText}>
              Create jobs from the Map tab
            </Text>
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  logoMini: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 14, fontWeight: "800", color: "#fff" },
  brandSub: { fontSize: 9, color: "rgba(255,255,255,0.5)" },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: "31%",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statNum: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 1 },
  scroll: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: COLORS.dark },
  postBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  postBtnText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 8,
    gap: 8,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    flexWrap: "wrap",
  },
  jobLogo: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  jobInfo: { flex: 1, minWidth: 150 },
  jobTitle: { fontSize: 12, fontWeight: "800", color: COLORS.dark },
  jobMeta: { fontSize: 9, color: COLORS.mid, marginTop: 1 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.mid,
    marginTop: 10,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 11,
    color: COLORS.light,
    marginBottom: 14,
    fontStyle: "italic",
  },
  postBtnLarge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 1,
  },
});

export default DashboardScreen;
