// src/screens/auth/RegisterScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import InputField from "../../components/InputField";
import COLORS from "../../constants/colors";
import { auth, db } from "../../firebase/firebaseConfig";

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value) => {
    // Basic email validation to avoid Firebase `auth/invalid-email`.
    // Note: this is intentionally simple; Firebase will still enforce final rules.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const ROLES = [
    { key: "user", icon: "person", label: "Job Seeker" },
    { key: "employer", icon: "business", label: "Employer" },
  ];

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !password || !confirm) {
      Alert.alert("Missing fields", "Please fill out all required fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert(
        "Password mismatch",
        "Password and repeat password must match.",
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address (example: name@gmail.com).",
      );
      return;
    }

    setLoading(true);
    try {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } catch (error) {
        const code = error?.code ?? "";
        if (code === "auth/invalid-email") {
          Alert.alert("Invalid Email", "Please enter a valid email address.");
          return;
        }
        Alert.alert(
          "Registration Failed",
          `${code ? `${code}\n` : ""}${error?.message ?? "Could not create account."}`,
        );
        return;
      }

      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role,
          profileCompleted: false,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        Alert.alert(
          "Registration Failed",
          `${error?.code ? `${error.code}\n` : ""}${error?.message ?? "Could not save profile."}`,
        );
        return;
      }

      try {
        await sendEmailVerification(cred.user);
        Alert.alert(
          "Success",
          "Account created. A verification email was sent to your inbox.",
        );
        navigation.navigate("VerifyEmail");
      } catch (error) {
        // Account was created, but verification email couldn't be sent.
        Alert.alert(
          "Account created, but verification failed",
          `${error?.code ? `${error.code}\n` : ""}${error?.message ?? "Could not send verification email."}`,
        );
      }
    } catch (error) {
      if (error?.code === "auth/invalid-email") {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }
      Alert.alert(
        "Registration Failed",
        `${error?.code ? `${error.code}\n` : ""}${error?.message ?? "Could not create account."}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={20} color={COLORS.dark} />
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoBox}>
        <MaterialIcons name="assignment" size={26} color={COLORS.white} />
      </View>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Choose your account type</Text>

      {/* Role picker */}
      <View style={styles.rolePicker}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.roleCard, role === r.key && styles.roleCardActive]}
            onPress={() => setRole(r.key)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={r.icon}
              size={22}
              style={styles.roleIcon}
              color={role === r.key ? COLORS.primary : COLORS.mid}
            />
            <Text
              style={[
                styles.roleLabel,
                role === r.key && styles.roleLabelActive,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form fields */}
      <InputField
        label="Full Name"
        iconName="person"
        placeholder="Juan Dela Cruz"
        value={name}
        onChangeText={setName}
      />
      <InputField
        label="Email"
        iconName="email"
        placeholder="you@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <InputField
        label="Phone Number"
        iconName="phone"
        placeholder="+63 9XX XXX XXXX"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <InputField
        label="Password"
        iconName="lock"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <InputField
        label="Repeat Password"
        iconName="lock"
        placeholder="••••••••"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />

      {/* Register button */}
      <TouchableOpacity
        style={styles.registerBtn}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.registerBtnText}>
          {loading ? "Creating..." : "Register"}
        </Text>
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
        >
          <Text style={styles.loginLink}>Log In</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 18,
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
  rolePicker: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.light,
    padding: 12,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  roleIcon: { fontSize: 22, marginBottom: 6 },
  roleLabel: { fontSize: 12, fontWeight: "700", color: COLORS.mid },
  roleLabelActive: { color: COLORS.primary },
  registerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  registerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { fontSize: 13, color: COLORS.mid },
  loginLink: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
});

export default RegisterScreen;
