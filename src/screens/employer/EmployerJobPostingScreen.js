// src/screens/employer/EmployerJobPostingScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../constants/colors";
import useLocation from "../../hooks/useLocation";
import { createJobPin } from "../../services/jobsService";

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
];
const CATEGORIES = [
  "Technology",
  "Sales",
  "Marketing",
  "HR",
  "General",
  "Design",
  "Finance",
];

const EmployerJobPostingScreen = ({ route, navigation, user: propsUser }) => {
  // Try to get user from props first, then route params as fallback
  const user = propsUser || route?.params?.user;
  const { selectedLocation: routeLocation } = route?.params || {};
  const { location } = useLocation();
  const defaultLat = location?.latitude ?? 14.5547;
  const defaultLng = location?.longitude ?? 121.0244;

  const [formData, setFormData] = useState({
    title: "",
    salary: "",
    type: "Full-time",
    category: "General",
    description: "",
  });

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: routeLocation?.latitude || defaultLat,
    longitude: routeLocation?.longitude || defaultLng,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleOpenLocationPicker = () => {
    navigation.navigate("LocationPicker", {
      jobDetails: formData,
      initialLat: selectedLocation.latitude,
      initialLng: selectedLocation.longitude,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.salary.trim()) newErrors.salary = "Salary is required";
    if (!formData.description.trim())
      newErrors.description = "Job description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePostJob = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!user?.uid) {
      Alert.alert(
        "Authentication Error",
        "User ID is missing. Please log in again.",
      );
      return;
    }

    setLoading(true);
    try {
      await createJobPin({
        title: formData.title,
        company: user?.name || "Company",
        salary: formData.salary,
        type: formData.type,
        category: formData.category,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        createdBy: user.uid,
      });

      Alert.alert("Success", "Job posted successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error posting job:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to post job. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post New Job</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Job Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="e.g., Senior React Developer"
              value={formData.title}
              onChangeText={(val) => handleInputChange("title", val)}
              editable={!loading}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Salary */}
          <View style={styles.section}>
            <Text style={styles.label}>Salary Range *</Text>
            <TextInput
              style={[styles.input, errors.salary && styles.inputError]}
              placeholder="e.g., $50,000 - $80,000"
              value={formData.salary}
              onChangeText={(val) => handleInputChange("salary", val)}
              editable={!loading}
            />
            {errors.salary && (
              <Text style={styles.errorText}>{errors.salary}</Text>
            )}
          </View>

          {/* Job Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Job Type</Text>
            <View style={styles.chipRow}>
              {JOB_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    formData.type === type && styles.chipActive,
                  ]}
                  onPress={() => handleInputChange("type", type)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.type === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    formData.category === cat && styles.chipActive,
                  ]}
                  onPress={() => handleInputChange("category", cat)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.category === cat && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Job Description *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                errors.description && styles.inputError,
              ]}
              placeholder="Describe the role, responsibilities, and requirements..."
              value={formData.description}
              onChangeText={(val) => handleInputChange("description", val)}
              multiline
              numberOfLines={6}
              editable={!loading}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Location Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Job Location</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleOpenLocationPicker}
              disabled={loading}
            >
              <MaterialIcons
                name="location-on"
                size={20}
                color={COLORS.primary}
              />
              <View style={styles.locationButtonContent}>
                <Text style={styles.locationButtonTitle}>
                  Drop a pin on the map
                </Text>
                <Text style={styles.locationButtonSubtitle}>
                  Latitude: {selectedLocation.latitude?.toFixed(4)}, Longitude:{" "}
                  {selectedLocation.longitude?.toFixed(4)}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={COLORS.mid}
              />
            </TouchableOpacity>
          </View>

          {/* Post Button */}
          <TouchableOpacity
            style={[styles.postBtn, loading && styles.postBtnDisabled]}
            onPress={handlePostJob}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="cloud-upload" size={20} color="white" />
                <Text style={styles.postBtnText}>Post Job</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.dark },
  scroll: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 20 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.dark,
  },
  inputError: { borderColor: COLORS.red },
  textarea: { minHeight: 100 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.mid },
  chipTextActive: { color: COLORS.white },
  locationButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationButtonContent: {
    flex: 1,
  },
  locationButtonTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
  },
  locationButtonSubtitle: {
    fontSize: 11,
    color: COLORS.mid,
    marginTop: 2,
  },
  errorText: { fontSize: 11, color: COLORS.red, marginTop: 4 },
  postBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
});

export default EmployerJobPostingScreen;
