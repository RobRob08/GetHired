// src/screens/employer/ApplicantsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
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
    createNotification,
    setApplicationStatus,
    subscribeEmployerApplications,
} from "../../services/applicationsService";

const AVATAR_COLORS = ["#4F6FFF", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

const STATUS_STYLE = {
  Applied: { color: COLORS.primary, bg: COLORS.primaryBg },
  Approved: { color: COLORS.purple, bg: COLORS.secondaryBg },
  Hired: { color: COLORS.green, bg: COLORS.successBg },
  Rejected: { color: COLORS.red, bg: COLORS.redBg },
};

const ApplicantsScreen = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const unsub = subscribeEmployerApplications(
      user.uid,
      (apps) => {
        setApplications(apps);
        setLoading(false);
      },
      (err) => {
        Alert.alert("Error", err?.message ?? "Could not load applications.");
        setLoading(false);
      },
    );

    return () => unsub?.();
  }, [user?.uid]);

  const sorted = useMemo(() => applications, [applications]);

  const getAvatarLetter = (app) => {
    const name = app?.applicantName ?? "";
    return name ? name[0].toUpperCase() : "?";
  };

  const handleUpdate = async (app, nextStatus) => {
    if (!user?.uid || !app?.id) return;

    try {
      await setApplicationStatus({
        applicationId: app.id,
        employerId: user.uid,
        status: nextStatus,
      });

      const recipientId = app.applicantId;
      const message =
        nextStatus === "Approved"
          ? `Your application for ${app.jobTitle} was approved.`
          : nextStatus === "Hired"
            ? `Congratulations! You were hired for ${app.jobTitle}.`
            : `Your application for ${app.jobTitle} was rejected.`;

      await createNotification({
        recipientId,
        senderId: user.uid,
        type:
          nextStatus === "Approved"
            ? "application_approved"
            : nextStatus === "Hired"
              ? "application_hired"
              : "application_rejected",
        message,
        meta: { applicationId: app.id, jobId: app.jobId, status: nextStatus },
      });
    } catch (e) {
      Alert.alert("Update failed", e?.message ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Applicants</Text>
        <Text style={styles.subtitle}>Manage incoming applications</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.emptyText}>Loading applications...</Text>
        ) : sorted.length === 0 ? (
          <Text style={styles.emptyText}>No applications yet.</Text>
        ) : (
          sorted.map((a, i) => {
            const sc = STATUS_STYLE[a.status] ?? {
              color: COLORS.mid,
              bg: COLORS.bg,
            };
            const canApprove = a.status === "Applied";
            const canHire = a.status === "Approved";
            const canReject = a.status !== "Rejected" && a.status !== "Hired";

            return (
              <View key={a.id} style={styles.card}>
                {/* Avatar */}
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>{getAvatarLetter(a)}</Text>
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {a.applicantName ?? "Applicant"}
                  </Text>
                  <Text style={styles.role}>
                    {a.jobTitle ? `Job: ${a.jobTitle}` : "Application"}
                  </Text>
                </View>

                {/* Status + actions */}
                <View style={styles.right}>
                  <Badge
                    label={a.status ?? "Applied"}
                    color={sc.color}
                    backgroundColor={sc.bg}
                  />
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.acceptBtn,
                        !canApprove && { opacity: 0.5 },
                      ]}
                      disabled={!canApprove}
                      onPress={() => handleUpdate(a, "Approved")}
                    >
                      <Text style={styles.acceptText}>✓</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.hireBtn, !canHire && { opacity: 0.5 }]}
                      disabled={!canHire}
                      onPress={() => handleUpdate(a, "Hired")}
                    >
                      <Text style={styles.hireText}>★</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rejectBtn, !canReject && { opacity: 0.5 }]}
                      disabled={!canReject}
                      onPress={() => handleUpdate(a, "Rejected")}
                    >
                      <Text style={styles.rejectText}>✗</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    backgroundColor: COLORS.dark,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.white },
  subtitle: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 },
  scroll: { flex: 1, paddingTop: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 14,
    marginTop: 10,
    gap: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "900", color: "#fff" },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: "800", color: COLORS.dark },
  role: { fontSize: 10, color: COLORS.mid, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 6 },
  actionRow: { flexDirection: "row", gap: 5 },
  acceptBtn: {
    backgroundColor: COLORS.successBg,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  acceptText: { color: COLORS.green, fontSize: 12, fontWeight: "700" },
  hireBtn: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  hireText: { color: COLORS.primary, fontSize: 12, fontWeight: "900" },
  rejectBtn: {
    backgroundColor: COLORS.redBg,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rejectText: { color: COLORS.red, fontSize: 12, fontWeight: "700" },
  emptyText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
});

export default ApplicantsScreen;
