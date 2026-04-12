// src/screens/admin/AdminUsersScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Badge from "../../components/badge";
import COLORS from "../../constants/colors";
import { auth } from "../../firebase/firebaseConfig";
import {
    deleteUser,
    subscribeToAllUsers,
    toggleUserStatus,
} from "../../services/adminService";

const isLogoutPermissionError = (error) => {
  return error?.code === "permission-denied" && !auth.currentUser;
};

const AdminUsersScreen = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // all, user, employer, admin

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllUsers(
      (fetchedUsers) => {
        setUsers(fetchedUsers);
        setLoading(false);
      },
      (error) => {
        if (isLogoutPermissionError(error)) {
          setLoading(false);
          return;
        }
        console.error("Error fetching users:", error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(query) ||
          u.name?.toLowerCase().includes(query),
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, filterRole]);

  const handleDeactivateUser = (user) => {
    Alert.alert(
      user.active !== false ? "Deactivate User" : "Activate User",
      `Are you sure you want to ${user.active !== false ? "deactivate" : "activate"} ${user.email}?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: user.active !== false ? "Deactivate" : "Activate",
          onPress: async () => {
            try {
              await toggleUserStatus(user.id, user.active === false);
              Alert.alert("Success", "User status updated");
            } catch (error) {
              Alert.alert("Error", "Failed to update user status");
            }
          },
        },
      ],
    );
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteUser(user.id);
              Alert.alert("Success", "User deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete user");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return { color: COLORS.primary, bg: COLORS.primaryBg };
      case "employer":
        return { color: COLORS.purple, bg: "#F5F3FF" };
      case "user":
        return { color: COLORS.green, bg: "#ECFDF5" };
      default:
        return { color: COLORS.mid, bg: COLORS.grayBg };
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>
              Total: {users.length} users
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <MaterialIcons name="logout" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.filterSection}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={COLORS.mid} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by email or name..."
              placeholderTextColor={COLORS.mid}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Role filter */}
          <View style={styles.roleFilter}>
            {[
              { label: "All", value: "all" },
              { label: "Users", value: "user" },
              { label: "Employers", value: "employer" },
              { label: "Admins", value: "admin" },
            ].map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.filterChip,
                  filterRole === role.value && styles.filterChipActive,
                ]}
                onPress={() => setFilterRole(role.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterRole === role.value && styles.filterChipTextActive,
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Users list */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="person-off" size={48} color={COLORS.light} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const roleBadge = getRoleBadgeColor(user.role);
            const isInactive = user.active === false;
            return (
              <View
                key={user.id}
                style={[styles.userCard, isInactive && styles.userCardInactive]}
              >
                <View style={styles.userMain}>
                  <View style={styles.userAvatar}>
                    <MaterialIcons
                      name="person"
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name || "User"}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userMeta}>
                      <Badge
                        label={user.role}
                        color={roleBadge.color}
                        backgroundColor={roleBadge.bg}
                      />
                      {isInactive && (
                        <Badge
                          label="Inactive"
                          color={COLORS.mid}
                          backgroundColor="#F1F5F9"
                        />
                      )}
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeactivateUser(user)}
                  >
                    <MaterialIcons
                      name={isInactive ? "check-circle" : "block"}
                      size={20}
                      color={isInactive ? COLORS.green : COLORS.amber}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color={COLORS.red}
                    />
                  </TouchableOpacity>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.white },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 3,
  },
  logoutBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    flexShrink: 0,
  },
  scroll: { flex: 1, paddingHorizontal: 10 },
  filterSection: { marginTop: 12, marginBottom: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.dark,
  },
  roleFilter: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: COLORS.light,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 11, fontWeight: "600", color: COLORS.mid },
  filterChipTextActive: { color: COLORS.white },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.mid,
    marginTop: 12,
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.light,
    elevation: 1,
    gap: 8,
    flexWrap: "wrap",
  },
  userCardInactive: {
    opacity: 0.7,
    backgroundColor: COLORS.headerBg,
  },
  userMain: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 200,
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primaryBg,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 12, fontWeight: "800", color: COLORS.dark },
  userEmail: { fontSize: 10, color: COLORS.mid, marginTop: 1 },
  userMeta: {
    flexDirection: "row",
    gap: 5,
    marginTop: 5,
    flexWrap: "wrap",
  },
  userActions: {
    flexDirection: "row",
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.headerBg,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.light,
  },
});

export default AdminUsersScreen;
