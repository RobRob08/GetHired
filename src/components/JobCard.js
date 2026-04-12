// src/components/JobCard.js
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLORS from "../constants/colors";
import Badge from "./badge";

const JobCard = ({ job, onPress, onApply }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(job)}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <MaterialIcons name="work" size={22} color={COLORS.primary} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <View style={styles.tags}>
            <Badge
              label={job.category}
              color={COLORS.primary}
              backgroundColor="#EEF2FF"
            />
            <View style={{ width: 6 }} />
            <Badge label={job.type} color="#16A34A" backgroundColor="#F0FDF4" />
          </View>
        </View>

        {/* Salary + Apply */}
        <View style={styles.right}>
          <Text style={styles.salary}>{job.salary}</Text>
          <TouchableOpacity
            style={styles.applyBtn}
            activeOpacity={0.8}
            onPress={() => onApply && onApply(job)}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.grayBg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 2,
  },
  company: {
    fontSize: 11,
    color: COLORS.mid,
    marginBottom: 7,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  right: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  salary: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  applyBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  applyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
  },
});

export default JobCard;
