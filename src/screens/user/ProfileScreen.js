// src/screens/user/ProfileScreen.js
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
const DEFAULT_EXPERIENCE = "Add your experience...";
const DEFAULT_EDUCATION = "Add your education...";
const DEFAULT_SKILLS = "Add your skills...";

const formatDetectedLocation = (place) => {
  const parts = [place?.city, place?.region].filter(Boolean);
  return parts.join(", ").trim();
};

const ProfileScreen = ({ user, onLogout, initialSetup = false }) => {
  const [editing, setEditing] = useState(initialSetup);
  const [saving, setSaving] = useState(false);
  const [locationEdited, setLocationEdited] = useState(false);
  const { place } = useLocation();
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    location: user?.location ?? DEFAULT_LOCATION,
    experience: user?.experience ?? DEFAULT_EXPERIENCE,
    education: user?.education ?? DEFAULT_EDUCATION,
    skills: user?.skills ?? DEFAULT_SKILLS,
  });
  const detectedLocation = formatDetectedLocation(place);

  useEffect(() => {
    setProfile({
      name: user?.name ?? "",
      location: user?.location ?? DEFAULT_LOCATION,
      experience: user?.experience ?? DEFAULT_EXPERIENCE,
      education: user?.education ?? DEFAULT_EDUCATION,
      skills: user?.skills ?? DEFAULT_SKILLS,
    });
    setLocationEdited(false);
  }, [
    user?.name,
    user?.location,
    user?.experience,
    user?.education,
    user?.skills,
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
        role: user?.role ?? "user",
        location: detectedLocation,
      },
      { merge: true },
    ).catch(() => {});
  }, [detectedLocation, locationEdited, user?.location, user?.role, user?.uid]);

  const saveProfile = async () => {
    if (!user?.uid)
      return Alert.alert("Save failed", "No active user session found.");
    if (!profile.name.trim())
      return Alert.alert("Name required", "Please enter your name.");

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: profile.name.trim(),
          role: user?.role ?? "user",
          location: profile.location.trim(),
          experience: profile.experience.trim(),
          education: profile.education.trim(),
          skills: profile.skills.trim(),
          profileCompleted: true,
        },
        { merge: true },
      );
      setEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error) {
      Alert.alert("Save failed", error?.message ?? "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>GetHired</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => (editing ? saveProfile() : setEditing(true))}
            disabled={saving}
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

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.cover} />
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color={COLORS.dark} />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.name}>{profile.name || "User"}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>
              {user?.role === "employer"
                ? "Employer"
                : user?.role === "admin"
                  ? "Admin"
                  : "Job Seeker"}
            </Text>
          </View>
          <Text style={styles.stats}>{profile.location}</Text>
        </View>

        <View style={styles.formWrap}>
          <InputField
            label="Full Name"
            iconName="person"
            value={profile.name}
            placeholder="Your name"
            onChangeText={(v) => setProfile((p) => ({ ...p, name: v }))}
            editable={editing}
          />
          <InputField
            label="Location"
            iconName="location-on"
            value={profile.location}
            placeholder="City, Country"
            onChangeText={(v) => {
              setLocationEdited(true);
              setProfile((p) => ({ ...p, location: v }));
            }}
            editable={editing}
          />
          <InputField
            label="Experience"
            iconName="work"
            value={profile.experience}
            placeholder="Years and focus"
            onChangeText={(v) => setProfile((p) => ({ ...p, experience: v }))}
            editable={editing}
          />
          <InputField
            label="Education"
            iconName="school"
            value={profile.education}
            placeholder="Highest education"
            onChangeText={(v) => setProfile((p) => ({ ...p, education: v }))}
            editable={editing}
          />
          <InputField
            label="Skills"
            iconName="star"
            value={profile.skills}
            placeholder="Comma-separated skills"
            onChangeText={(v) => setProfile((p) => ({ ...p, skills: v }))}
            editable={editing}
          />
          <View style={styles.aboutRow}>
            <MaterialIcons
              name="email"
              size={18}
              color={COLORS.primary}
              style={styles.aboutIcon}
            />
            <View style={styles.aboutContent}>
              <Text style={styles.aboutLabel}>Email</Text>
              <Text style={styles.aboutVal} numberOfLines={2}>
                {user?.email ?? "Not available"}
              </Text>
            </View>
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
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  headerTitle: { fontSize: 14, fontWeight: "800", color: COLORS.dark },
  editBtn: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editText: { color: COLORS.primary, fontSize: 10, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: COLORS.redBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoutText: { color: COLORS.red, fontSize: 10, fontWeight: "700" },
  cover: { height: 80, backgroundColor: COLORS.primary },
  avatarWrap: { alignItems: "center", marginTop: -30, marginBottom: 8 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.gray,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  infoSection: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 5,
  },
  roleText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  stats: { fontSize: 10, color: COLORS.mid, marginBottom: 1 },
  formWrap: { paddingHorizontal: 10, paddingTop: 6 },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    elevation: 1,
  },
  aboutIcon: { fontSize: 16, flexShrink: 0 },
  aboutContent: { flex: 1, minWidth: 0 },
  aboutLabel: { fontSize: 9, color: COLORS.mid, fontWeight: "600" },
  aboutVal: { fontSize: 11, color: COLORS.dark, fontWeight: "700" },
  formActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.grayBg,
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

export default ProfileScreen;
