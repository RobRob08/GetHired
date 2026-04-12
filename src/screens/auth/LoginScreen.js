// src/screens/auth/LoginScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as GoogleAuthSession from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import {
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import InputField from "../../components/InputField";
import COLORS from "../../constants/colors";
import { auth } from "../../firebase/firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

const readEnv = (key) => (process.env[key] ?? "").trim();
const googleWebClientId = readEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
const googleAndroidClientId = readEnv("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID");
const googleIosClientId = readEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
const isExpoGo = Constants.appOwnership === "expo";
const expoProxyRedirectUri = readEnv("EXPO_PUBLIC_EXPO_PROXY_REDIRECT_URI");
let expoRedirectUri = undefined;
if (isExpoGo) {
  try {
    // Expo Go / Expo proxy redirect used by expo-auth-session.
    // Use the base URL (no extra path) so the proxy can complete the session.
    expoRedirectUri = AuthSession.getRedirectUrl();
  } catch {
    expoRedirectUri = undefined;
  }
}
const getGoogleButtonLabel = (googleLoading, googleSigninModule) => {
  if (googleLoading) {
    return "Signing in with Google...";
  }

  if (googleSigninModule || isExpoGo) {
    return "Continue with Google";
  }

  return "Google Sign-In unavailable";
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSigninModule, setGoogleSigninModule] = useState(null);
  const [googleSigninError, setGoogleSigninError] = useState("");

  useEffect(() => {
    if (isExpoGo) {
      // Helpful for OAuth config in Google Cloud.
      // eslint-disable-next-line no-console
      console.log(
        "[Google OAuth] Expo Go redirectUri:",
        expoProxyRedirectUri ?? expoRedirectUri ?? "(undefined)",
      );
    }
  }, []);

  const [request, response, promptAsync] =
    GoogleAuthSession.useIdTokenAuthRequest({
      clientId: googleWebClientId || undefined,
      // In Expo Go we don't have a standalone Android/iOS package identity,
      // so use only the web client id for the popup flow.
      iosClientId: isExpoGo ? undefined : googleIosClientId || undefined,
      androidClientId: isExpoGo
        ? undefined
        : googleAndroidClientId || undefined,
      webClientId: googleWebClientId || undefined,
      // Force the redirectUri to match Google Cloud allow-list for Expo Go.
      // Set `EXPO_PUBLIC_EXPO_PROXY_REDIRECT_URI` in your `.env` to the exact value.
      redirectUri: isExpoGo
        ? expoProxyRedirectUri || expoRedirectUri
        : undefined,
    });

  const handleExpoGoGoogleSignIn = async () => {
    if (!googleWebClientId) {
      throw new Error("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env");
    }
    const proxyRedirectUri = expoProxyRedirectUri || expoRedirectUri;
    if (!proxyRedirectUri) {
      throw new Error(
        "Missing Expo proxy redirect URI. Set EXPO_PUBLIC_EXPO_PROXY_REDIRECT_URI.",
      );
    }

    // This is the URL the Expo proxy will redirect back to in your app.
    const returnUrl = AuthSession.getDefaultReturnUrl();

    // In Expo Go we should avoid code exchange (it may require client_secret depending on client type).
    // Request an ID token directly instead.
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const authRequest = new AuthSession.AuthRequest({
      clientId: googleWebClientId,
      redirectUri: proxyRedirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
      extraParams: { nonce },
      scopes: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    const authUrl = await authRequest.makeAuthUrlAsync(
      GoogleAuthSession.discovery,
    );

    const startUrl = `${proxyRedirectUri.replace(/\/$/, "")}/start?${new URLSearchParams(
      {
        authUrl,
        returnUrl,
      },
    ).toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
    if (result.type !== "success") {
      return;
    }

    const parsed = authRequest.parseReturnUrl(result.url);
    if (parsed.type !== "success") {
      throw new Error(parsed.error?.message ?? "Google Sign-In failed.");
    }

    const idToken = parsed.params?.id_token;
    if (!idToken) {
      throw new Error("No ID token returned from Google.");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  };

  useEffect(() => {
    if (!isExpoGo || !request) return;
    // eslint-disable-next-line no-console
    console.log("[Google OAuth] request.redirectUri:", request?.redirectUri);
    // eslint-disable-next-line no-console
    console.log("[Google OAuth] request.clientId:", request?.clientId);

    if (typeof request?.url === "string") {
      try {
        const u = new URL(request.url);
        // eslint-disable-next-line no-console
        console.log(
          "[Google OAuth] request.url redirect_uri:",
          u.searchParams.get("redirect_uri"),
        );
      } catch {
        // ignore
      }
    }
  }, [request]);

  useEffect(() => {
    let mounted = true;

    const loadGoogleSignin = async () => {
      try {
        // Expo Go does not include the native module `RNGoogleSignin`,
        // so skip importing it entirely to avoid invariant violations.
        if (isExpoGo) {
          if (!mounted) return;
          setGoogleSigninModule(null);
          setGoogleSigninError(
            "Google Sign-In needs a development build or production app. Expo Go does not include this native module.",
          );
          return;
        }

        const googleSignin =
          await import("@react-native-google-signin/google-signin");
        googleSignin.GoogleSignin.configure({
          webClientId: googleWebClientId || undefined,
          iosClientId: googleIosClientId || undefined,
          offlineAccess: false,
        });

        if (mounted) {
          setGoogleSigninModule(googleSignin);
          setGoogleSigninError("");
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setGoogleSigninModule(null);
        setGoogleSigninError(
          isExpoGo
            ? "Google Sign-In needs a development build or production app. Expo Go does not include this native module."
            : (error?.message ??
                "Google Sign-In native module is unavailable in this build."),
        );
      }
    };

    loadGoogleSignin();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (response?.type !== "success") {
      return;
    }

    const loginWithOAuth = async () => {
      const idToken = response.params?.id_token;
      if (!idToken) {
        Alert.alert("Google Sign-In Failed", "No ID token from OAuth.");
        return;
      }

      try {
        setGoogleLoading(true);
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } catch (error) {
        Alert.alert(
          "Google Sign-In Failed",
          error?.message ?? "Firebase sign-in failed.",
        );
      } finally {
        setGoogleLoading(false);
      }
    };

    loginWithOAuth();
  }, [response]);

  const handleNativeGoogleSignIn = async () => {
    if (!googleSigninModule) {
      throw new Error(
        "Google Sign-In native module not available in this build.",
      );
    }

    try {
      const { GoogleSignin } = googleSigninModule;

      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      const response = await GoogleSignin.signIn();

      if (response.type !== "success") {
        return;
      }

      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error("No ID token from Google Sign-In.");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      if (googleSigninModule) {
        const { statusCodes } = googleSigninModule;

        if (error?.code === statusCodes?.SIGN_IN_CANCELLED) {
          return;
        }

        if (error?.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            "Google Sign-In Failed",
            "Google Play Services not available. Update it from Play Store.",
          );
          return;
        }

        if (error?.code === statusCodes?.IN_PROGRESS) {
          return;
        }
      }

      Alert.alert("Google Sign-In Failed", error?.message ?? "Unknown error.");
    }
  };

  const handleGoogleButtonPress = async () => {
    if (!googleWebClientId && !googleAndroidClientId && !googleIosClientId) {
      Alert.alert(
        "Google Setup Error",
        "Missing Google client IDs in .env file",
      );
      return;
    }

    setGoogleLoading(true);
    try {
      // Native module works only in a dev build / production app.
      // Expo Go: fall back to the OAuth popup flow (browser-based).
      if (googleSigninModule && !isExpoGo) {
        await handleNativeGoogleSignIn();
        return;
      }

      // Expo Go: use the Expo AuthSession proxy start URL flow so the browser returns to the app.
      if (isExpoGo) {
        await handleExpoGoGoogleSignIn();
        return;
      }

      await promptAsync();
    } catch (error) {
      Alert.alert("Google Sign-In Failed", error?.message ?? "Unknown error.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error?.message ?? "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Email required",
        "Enter your email first, then tap Forgot Password.",
      );
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Reset email sent",
        `Password reset email sent to ${email.trim()}.`,
      );
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error?.message ?? "Could not send reset email.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
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
          <MaterialIcons name="assignment" size={26} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue your job search</Text>

        {/* Inputs */}
        <InputField
          label="Email"
          iconName="email"
          placeholder="you@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <InputField
          label="Password"
          iconName="lock"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.forgot}
          disabled={loading || resetLoading}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotText}>
            {resetLoading ? "Sending reset..." : "Forgot Password?"}
          </Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>
            {loading ? "Signing in..." : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.line} />
        </View>

        {/* Google */}
        <TouchableOpacity
          style={styles.googleBtn}
          activeOpacity={0.85}
          disabled={loading || resetLoading || googleLoading}
          onPress={handleGoogleButtonPress}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>
            {getGoogleButtonLabel(googleLoading, googleSigninModule)}
          </Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don&apos;t have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            disabled={loading}
          >
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1 },
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
  forgot: { alignSelf: "flex-end", marginBottom: 20, marginTop: -6 },
  forgotText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: COLORS.light },
  dividerText: { fontSize: 12, color: COLORS.mid },
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
  googleIcon: { fontSize: 18, fontWeight: "900", color: "#DB4437" },
  googleText: { fontSize: 14, fontWeight: "600", color: COLORS.dark },
  signupRow: { flexDirection: "row", justifyContent: "center" },
  signupText: { fontSize: 13, color: COLORS.mid },
  signupLink: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
});

export default LoginScreen;
