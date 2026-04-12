// src/screens/employer/EmployerProfileScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
import useLocation from "../../hooks/useLocation";

const DEFAULT_LOCATION = "Add your location...";
const DEFAULT_WEBSITE = "www.yourcompany.com";
const DEFAULT_COMPANY_SIZE = "Add company size...";
const DEFAULT_INDUSTRY = "Add industry...";

const formatDetectedLocation = (place) => {
  const parts = [place?.city, place?.region].filter(Boolean);
  return parts.join(", ").trim();
};

const EmployerProfileScreen = ({ user, onLogout, initialSetup = false }) => {
  const [editing, setEditing] = useState(initialSetup);
  const [saving, setSaving] = useState(false);
  const [locationEdited, setLocationEdited] = useState(false);
  const { place } = useLocation();
  const [profile, setProfile] = useState({
    companyName: user?.name ?? "",
    location: user?.location ?? DEFAULT_LOCATION,
    website: user?.website ?? DEFAULT_WEBSITE,
    companySize: user?.companySize ?? DEFAULT_COMPANY_SIZE,
    industry: user?.industry ?? DEFAULT_INDUSTRY,
  });
  const detectedLocation = formatDetectedLocation(place);

  useEffect(() => {
    setProfile({
      companyName: user?.name ?? "",
      location: user?.location ?? DEFAULT_LOCATION,
      website: user?.website ?? DEFAULT_WEBSITE,
      companySize: user?.companySize ?? DEFAULT_COMPANY_SIZE,
      industry: user?.industry ?? DEFAULT_INDUSTRY,
    });
    setLocationEdited(false);
  }, [
    user?.name,
    user?.location,
    user?.website,
    user?.companySize,
    user?.industry,
  ]);

  useEffect(() => {
    if (!user?.uid || !detectedLocation || user?.location?.trim()) return;
    if (locationEdited) return;

    setProfile((current) => {
      const currentLocation = current.location?.trim();
      if (currentLocation && currentLocation !== DEFAULT_LOCATION) {
        return current;
      }
      return { ...current, location: detectedLocation };
    });

    setDoc(
      doc(db, "users", user.uid),
      {
        role: user?.role ?? "employer",
        location: detectedLocation,
      },
      { merge: true },
    ).catch(() => {});
  }, [detectedLocation, locationEdited, user?.location, user?.role, user?.uid]);

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
          role: user?.role ?? "employer",
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
            onChangeText={(v) => {
              setLocationEdited(true);
              setProfile((p) => ({ ...p, location: v }));
            }}
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
    height: 80,
    backgroundColor: "#1E293B",
    justifyContent: "flex-end",
    padding: 10,
  },
  coverActions: { flexDirection: "row", justifyContent: "flex-end", gap: 6 },
  editBtn: {
    backgroundColor: "rgba(37,99,235,0.22)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.7)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editText: { color: "#DBEAFE", fontSize: 10, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoutText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  logoWrap: { alignItems: "flex-start", paddingHorizontal: 12, marginTop: -18 },
  companyLogo: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 2,
  },
  body: { paddingHorizontal: 12, paddingTop: 10 },
  companyName: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  roleText: { fontSize: 10, color: COLORS.purple, fontWeight: "700" },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    elevation: 1,
  },
  detailIcon: { fontSize: 16, flexShrink: 0 },
  detailLabel: { fontSize: 9, color: COLORS.mid, fontWeight: "600" },
  detailVal: { fontSize: 11, color: COLORS.dark, fontWeight: "700" },
  formActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 9,
  },
  cancelText: { color: COLORS.mid, fontWeight: "700", fontSize: 11 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 9,
  },
  saveText: { color: COLORS.white, fontWeight: "800", fontSize: 11 },
});

export default EmployerProfileScreen;
