import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import useNotifications from "../../hooks/useNotifications";
import { markNotificationsRead } from "../../services/applicationsService";

const NotificationsScreen = ({ navigation, user }) => {
  const recipientId = user?.uid;
  const { notifications, unreadCount, loading } = useNotifications({
    recipientId,
  });

  const unreadIds = useMemo(() => {
    return notifications.filter((n) => !n.read).map((n) => n.id);
  }, [notifications]);

  const handleMarkAllRead = async () => {
    if (!unreadIds.length) return;
    try {
      await markNotificationsRead(unreadIds);
    } catch (e) {
      Alert.alert("Failed", e?.message ?? "Could not update notifications.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <MaterialIcons name="arrow-back" size={20} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {loading ? "Loading..." : `${unreadCount} unread`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.markBtn}
          onPress={handleMarkAllRead}
          disabled={!unreadIds.length || loading}
        >
          <Text style={styles.markText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 && !loading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When employers approve or hire you, it will appear here.
            </Text>
          </View>
        ) : null}

        {notifications.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.card, !n.read && { borderColor: COLORS.primary }]}
            activeOpacity={0.9}
            onPress={async () => {
              if (n.read || !n.id) return;
              try {
                await markNotificationsRead([n.id]);
              } catch (e) {
                Alert.alert(
                  "Failed",
                  e?.message ?? "Could not mark notification as read.",
                );
              }
            }}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name="notifications"
                  size={16}
                  color={n.read ? COLORS.mid : COLORS.primary}
                />
              </View>
              {!n.read ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text style={styles.message}>{n.message}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.headerBg,
  },
  backBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    flexShrink: 0,
  },
  headerCenter: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: "900", color: COLORS.dark },
  subtitle: { fontSize: 10, color: COLORS.mid, marginTop: 1 },
  markBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.light,
    flexShrink: 0,
  },
  markText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  scroll: { flex: 1, paddingHorizontal: 10, paddingTop: 10 },
  emptyWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 12, fontWeight: "900", color: COLORS.dark },
  emptyText: { fontSize: 11, color: COLORS.mid, marginTop: 5, lineHeight: 15 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red,
  },
  message: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
    lineHeight: 16,
  },
});

export default NotificationsScreen;
