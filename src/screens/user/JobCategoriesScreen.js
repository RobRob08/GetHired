import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import JobCard from "../../components/JobCard";
import COLORS from "../../constants/colors";
import { JOB_CATEGORIES } from "../../constants/data";
import useJobs from "../../hooks/useJobs";

const JobCategoriesScreen = ({ navigation }) => {
  const { jobs, loading } = useJobs();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const categoryCounts = useMemo(() => {
    return jobs.reduce((acc, job) => {
      const label = (job?.category ?? "").toLowerCase();
      if (!label) return acc;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  const selectedCategory = useMemo(() => {
    return JOB_CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null;
  }, [selectedCategoryId]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q);

      const matchesCategory =
        !selectedCategory ||
        (j.category ?? "").toLowerCase() === selectedCategory.label.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [jobs, search, selectedCategory]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.85}
          >
            <MaterialIcons name="arrow-back" size={20} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Categories</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={COLORS.mid} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search job title or company..."
            placeholderTextColor={COLORS.mid}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setSelectedCategoryId(null)}>
            <Text style={styles.seeAll}>All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 14, gap: 10 }}
        >
          {JOB_CATEGORIES.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catCard,
                  { backgroundColor: cat.bg },
                  isSelected && { borderWidth: 2, borderColor: COLORS.primary },
                ]}
                activeOpacity={0.85}
                onPress={() =>
                  setSelectedCategoryId((prev) => (prev === cat.id ? null : cat.id))
                }
              >
                <View style={[styles.catIcon, { backgroundColor: cat.color }]}>
                  <MaterialIcons name="work" size={18} color={COLORS.white} />
                </View>
                <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                <Text style={styles.catCount}>
                  {categoryCounts[cat.label.toLowerCase()] ?? 0} jobs
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.sectionHeader, { marginTop: 18 }]}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? selectedCategory.label : "All Jobs"}
          </Text>
        </View>

        <View style={styles.jobList}>
          {loading && <Text style={styles.emptyText}>Loading jobs...</Text>}
          {!loading && filteredJobs.length === 0 && (
            <Text style={styles.emptyText}>No jobs found yet.</Text>
          )}
          {!loading &&
            filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} onPress={() => {}} />
            ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  headerTitle: { fontSize: 15, fontWeight: "900", color: COLORS.dark },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 9,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.dark },
  scroll: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 11,
    marginTop: 18,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.dark },
  seeAll: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  catCard: {
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    minWidth: 96,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  catLabel: { fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 14 },
  catCount: { fontSize: 10, color: COLORS.mid, marginTop: 2 },
  jobList: { paddingHorizontal: 14, paddingBottom: 30 },
  emptyText: { fontSize: 12, color: COLORS.mid, marginBottom: 10 },
});

export default JobCategoriesScreen;

