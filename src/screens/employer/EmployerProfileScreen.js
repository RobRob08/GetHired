// src/screens/employer/EmployerProfileScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "../../components/InputField";
import COLORS from "../../constants/colors";
import { db } from "../../firebase/firebaseConfig";

const EmployerProfileScreen = ({ user, onLogout, initialSetup = false }) => {
  const [editing, setEditing] = useState(initialSetup);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    companyName: user?.name ?? "TechCorp PH",
    location: user?.location ?? "Makati City, Philippines",
    website: user?.website ?? "www.techcorp.ph",
    companySize: user?.companySize ?? "50-200 employees",
    industry: user?.industry ?? "Information Technology",
  });

  const saveProfile = async () => {
    if (!user?.uid)
      return Alert.alert("Save failed", "No active employer session found.");
    if (!profile.companyName.trim())
      return Alert.alert(
        "Company name required",
        "Please enter your company name.",
      );

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: profile.companyName.trim(),
          role: user?.role ?? 'employer',
          location: profile.location.trim(),
          website: profile.website.trim(),
          companySize: profile.companySize.trim(),
          industry: profile.industry.trim(),
          profileCompleted: true,
        },
        { merge: true },
      );
      setEditing(false);
      Alert.alert("Saved", "Employer profile updated.");
    } catch (error) {
      Alert.alert(
        "Save failed",
        error?.message ?? "Could not save employer profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.cover}>
          <View style={styles.coverActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => (editing ? saveProfile() : setEditing(true))}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.editText}>
                {saving ? "Saving..." : editing ? "Save" : "Edit"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Company logo */}
        <View style={styles.logoWrap}>
          <View style={styles.companyLogo}>
            <MaterialIcons name="business" size={32} color={COLORS.white} />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.companyName}>{profile.companyName}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>Employer</Text>
          </View>

          <InputField
            label="Company Name"
            iconName="business"
            value={profile.companyName}
            onChangeText={(v) => setProfile((p) => ({ ...p, companyName: v }))}
            placeholder="Company name"
            editable={editing}
          />
          <InputField
            label="Location"
            iconName="location-on"
            value={profile.location}
            onChangeText={(v) => setProfile((p) => ({ ...p, location: v }))}
            placeholder="City, Country"
            editable={editing}
          />
          <InputField
            label="Website"
            iconName="language"
            value={profile.website}
            onChangeText={(v) => setProfile((p) => ({ ...p, website: v }))}
            placeholder="www.yourcompany.com"
            editable={editing}
          />
          <InputField
            label="Company Size"
            iconName="group"
            value={profile.companySize}
            onChangeText={(v) => setProfile((p) => ({ ...p, companySize: v }))}
            placeholder="e.g. 50-200 employees"
            editable={editing}
          />
          <InputField
            label="Industry"
            iconName="work"
            value={profile.industry}
            onChangeText={(v) => setProfile((p) => ({ ...p, industry: v }))}
            placeholder="Industry"
            editable={editing}
          />

          {/* Email from user */}
          <View style={styles.detailRow}>
            <MaterialIcons
              name="email"
              size={18}
              color={COLORS.primary}
              style={styles.detailIcon}
            />
            <View>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailVal}>
                {user?.email ?? "employer@email.com"}
              </Text>
            </View>
          </View>

          {editing && (
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditing(false)}
                disabled={saving || initialSetup}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveProfile}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? "Saving..." : "Save Profile"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  cover: {
    height: 100,
    backgroundColor: "#1E293B",
    justifyContent: "flex-end",
    padding: 14,
  },
  coverActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  editBtn: {
    backgroundColor: "rgba(37,99,235,0.22)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.7)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: { color: "#DBEAFE", fontSize: 11, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  logoWrap: { alignItems: "flex-start", paddingHorizontal: 18, marginTop: -22 },
  companyLogo: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: COLORS.white,
    elevation: 4,
  },
  body: { paddingHorizontal: 18, paddingTop: 14 },
  companyName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 6,
  },
  roleTag: {
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  roleText: { fontSize: 11, color: COLORS.purple, fontWeight: "700" },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  detailIcon: { fontSize: 18 },
  detailLabel: { fontSize: 10, color: COLORS.mid, fontWeight: "600" },
  detailVal: { fontSize: 12, color: COLORS.dark, fontWeight: "700" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 11,
  },
  cancelText: { color: COLORS.mid, fontWeight: "700", fontSize: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 11,
  },
  saveText: { color: COLORS.white, fontWeight: "800", fontSize: 12 },
});

export default EmployerProfileScreen;
