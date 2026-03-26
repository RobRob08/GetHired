import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import COLORS from "../../constants/colors";

const VerifyEmailScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const refresh = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await user.reload();
    setEmailVerified(!!user.emailVerified);
    setUserEmail(user.email ?? "");
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Session expired", "Please log in again.");
      navigation.navigate("Login");
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(user);
      Alert.alert("Verification sent", "Check your inbox for the verification email.");
    } catch (error) {
      Alert.alert(
        "Resend failed",
        error?.message ?? "Could not send verification email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIHaveVerified = async () => {
    await refresh();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back */}
      <TouchableOpacity
        style={styles.back}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={20} color={COLORS.dark} />
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoBox}>
        <MaterialIcons name="mail" size={26} color={COLORS.white} />
      </View>

      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        Open the email we sent and confirm your account.
      </Text>

      <View style={styles.hint}>
        <Text style={styles.hintTitle}>
          Status:{" "}
          <Text style={{ color: emailVerified ? COLORS.primary : COLORS.mid }}>
            {emailVerified ? "Verified" : "Not verified yet"}
          </Text>
        </Text>
        {!!userEmail && (
          <Text style={{ fontSize: 11, color: COLORS.mid, marginTop: 6 }}>
            Sent to: <Text style={{ color: COLORS.dark, fontWeight: "700" }}>{userEmail}</Text>
          </Text>
        )}
        <Text style={styles.hintText}>
          {emailVerified
            ? "You’re all set. You can continue now."
            : "If you don’t see it, check your spam folder."}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleIHaveVerified}
        activeOpacity={0.85}
        disabled={loading}
      >
        <Text style={styles.loginBtnText}>
          {loading ? "Checking..." : "I’ve verified"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.googleBtn}
        activeOpacity={0.85}
        onPress={handleResend}
        disabled={loading}
      >
        <Text style={styles.googleText}>
          {loading ? "Sending..." : "Resend verification email"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, paddingBottom: 40 },
  back: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backText: { fontSize: 18, color: COLORS.dark },
  logoBox: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 5,
  },
  subtitle: { fontSize: 13, color: COLORS.mid, marginBottom: 16 },
  hint: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  hintText: { fontSize: 11, color: "#92400E", lineHeight: 18 },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.light,
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 24,
  },
  googleText: { fontSize: 14, fontWeight: "600", color: COLORS.dark },
});

export default VerifyEmailScreen;

