// src/navigation/AppNavigator.js
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Auth Screens
import LandingScreen from "../screens/auth/LandingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import SplashScreen from "../screens/auth/SplashScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";

// User Screens
import HomeScreen from "../screens/user/HomeScreen";
import JobCategoriesScreen from "../screens/user/JobCategoriesScreen";
import MapScreen from "../screens/user/MapScreen";
import NotificationsScreen from "../screens/user/NotificationsScreen";
import ProfileScreen from "../screens/user/ProfileScreen";
import TrackScreen from "../screens/user/TrackScreen";

// Employer Screens
import ApplicantsScreen from "../screens/employer/ApplicantsScreen";
import DashboardScreen from "../screens/employer/DashboardScreen";
import EmployerMapScreen from "../screens/employer/EmployerMapScreen";
import EmployerProfileScreen from "../screens/employer/EmployerProfileScreen";

// Admin Screens
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";

import COLORS from "../constants/colors";
import { auth, db, firebaseConfigError } from "../firebase/firebaseConfig";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HAS_LAUNCHED_KEY = "gethired.hasLaunched";

// ── Tab icon helper ────────────────────────────────────────────────────────
const TabIcon = ({ name, focused }) => (
  <MaterialIcons
    name={name}
    size={22}
    color={focused ? COLORS.primary : COLORS.mid}
  />
);

// ── Role-specific Tab Navigators ──────────────────────────────────────────
function UserTabs({ user, onLogout }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.light,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
          height: 62 + insets.bottom,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mid,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-filled" focused={focused} />
          ),
        }}
      >
        {() => <HomeScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      >
        {() => <MapScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Track"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="insights" focused={focused} />
          ),
        }}
      >
        {() => <TrackScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
      >
        {(props) => (
          <ProfileScreen {...props} user={user} onLogout={onLogout} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function EmployerTabs({ user, onLogout }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.light,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
          height: 62 + insets.bottom,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mid,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="dashboard" focused={focused} />
          ),
        }}
      >
        {(props) => <DashboardScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      >
        {() => <EmployerMapScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Applicants"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="group" focused={focused} />
          ),
        }}
      >
        {() => <ApplicantsScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="business" focused={focused} />
          ),
        }}
      >
        {(props) => (
          <EmployerProfileScreen {...props} user={user} onLogout={onLogout} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AdminTabs({ user, onLogout }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1E293B",
          borderTopColor: "rgba(255,255,255,0.1)",
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
          height: 62 + insets.bottom,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="Overview"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="analytics" focused={focused} />
          ),
        }}
      >
        {(props) => (
          <AdminDashboardScreen {...props} user={user} onLogout={onLogout} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Users"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="group" focused={focused} />
          ),
        }}
      >
        {(props) => <AdminUsersScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────
export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [startupRoute, setStartupRoute] = useState("Landing");
  const [startupLoading, setStartupLoading] = useState(true);
  const [accountDisabled, setAccountDisabled] = useState(false);
  const authenticatedInitialRoute = !user
    ? null
    : !user.emailVerified
      ? "VerifyEmail"
      : !user.profileCompleted
        ? "InitialSetup"
        : "Main";
  const navigatorKey = user
    ? `authenticated-${authenticatedInitialRoute}`
    : `guest-${startupRoute}`;

  useEffect(() => {
    let mounted = true;

    const loadStartupRoute = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);
        if (!mounted) return;

        if (hasLaunched) {
          setStartupRoute("Landing");
        } else {
          setStartupRoute("Splash");
          await AsyncStorage.setItem(HAS_LAUNCHED_KEY, "true");
        }
      } catch {
        if (mounted) {
          setStartupRoute("Landing");
        }
      } finally {
        if (mounted) {
          setStartupLoading(false);
        }
      }
    };

    loadStartupRoute();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!accountDisabled) return;

    Alert.alert(
      "Account Disabled",
      "Your account has been disabled by an administrator.",
    );
    setStartupRoute("Landing");
    setAccountDisabled(false);
  }, [accountDisabled]);

  useEffect(() => {
    if (!auth || !db) {
      setAuthLoading(false);
      return () => {};
    }

    let profileUnsub = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        profileUnsub();
        setUser(null);
        setAccountDisabled(false);
        setAuthLoading(false);
        return;
      }

      setStartupRoute("Landing");
      setAuthLoading(true);

      const userRef = doc(db, "users", firebaseUser.uid);
      profileUnsub = onSnapshot(
        userRef,
        (snap) => {
          const profile = snap.exists() ? snap.data() : {};
          if (profile?.active === false) {
            setAccountDisabled(true);
            setUser(null);
            setAuthLoading(false);
            signOut(auth).catch(() => {});
            return;
          }

          setAccountDisabled(false);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: profile?.name ?? firebaseUser.displayName ?? "User",
            role: profile?.role ?? "user",
            location: profile?.location ?? "",
            experience: profile?.experience ?? "",
            education: profile?.education ?? "",
            skills: profile?.skills ?? "",
            website: profile?.website ?? "",
            companySize: profile?.companySize ?? "",
            industry: profile?.industry ?? "",
            emailVerified: firebaseUser.emailVerified,
            profileCompleted: profile?.profileCompleted ?? true,
          });
          setAuthLoading(false);
        },
        () => {
          setAccountDisabled(false);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName ?? "User",
            role: "user",
            location: "",
            experience: "",
            education: "",
            skills: "",
            website: "",
            companySize: "",
            industry: "",
            emailVerified: firebaseUser.emailVerified,
            profileCompleted: true,
          });
          setAuthLoading(false);
        },
      );
    });

    return () => {
      unsubscribe();
      profileUnsub();
    };
  }, []);

  // Keep `user.emailVerified` in sync after the user clicks the verification link.
  useEffect(() => {
    if (!user || user.emailVerified) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const current = auth.currentUser;
        if (!current) return;
        await current.reload();
        if (cancelled) return;
        if (current.emailVerified) {
          setUser((prev) => (prev ? { ...prev, emailVerified: true } : prev));
        }
      } catch {
        // ignore and retry
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.uid, user?.emailVerified]);

  const handleLogout = async () => {
    setStartupRoute("Landing");
    await signOut(auth);
  };

  if (firebaseConfigError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>App startup failed</Text>
        <Text style={styles.errorText}>{firebaseConfigError}</Text>
        <Text style={styles.errorHint}>
          For Android release builds, rebuild after updating `.env` so Expo can
          inline the `EXPO_PUBLIC_*` values into the bundle.
        </Text>
      </View>
    );
  }

  if (authLoading || startupLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.bg,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={navigatorKey}
        screenOptions={{ headerShown: false, animationEnabled: false }}
        detachInactiveScreens={false}
        initialRouteName={user ? authenticatedInitialRoute : startupRoute}
      >
        {!user ? (
          // ── Auth flow ──────────────────────────────────────────────────
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        ) : (
          // ── Authenticated: block until email verified ──────────────────
          <>
            {!user.emailVerified ? (
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            ) : user.role === "admin" ? (
              <Stack.Screen name="Main">
                {() => <AdminTabs user={user} onLogout={handleLogout} />}
              </Stack.Screen>
            ) : !user.profileCompleted ? (
              <Stack.Screen name="InitialSetup">
                {(props) => {
                  if (user.role === "user") {
                    return (
                      <ProfileScreen
                        {...props}
                        user={user}
                        onLogout={handleLogout}
                        initialSetup
                      />
                    );
                  }
                  return (
                    <EmployerProfileScreen
                      {...props}
                      user={user}
                      onLogout={handleLogout}
                      initialSetup
                    />
                  );
                }}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Main">
                  {() => {
                    if (user.role === "user")
                      return <UserTabs user={user} onLogout={handleLogout} />;
                    if (user.role === "employer")
                      return (
                        <EmployerTabs user={user} onLogout={handleLogout} />
                      );
                    if (user.role === "admin")
                      return <AdminTabs onLogout={handleLogout} />;
                    return null;
                  }}
                </Stack.Screen>
                <Stack.Screen
                  name="JobCategories"
                  component={JobCategoriesScreen}
                />
                <Stack.Screen name="Notifications">
                  {(props) => <NotificationsScreen {...props} user={user} />}
                </Stack.Screen>
                <>
                  <Stack.Group
                    screenOptions={{
                      presentation: "modal",
                      headerShown: false,
                    }}
                  >
                    {/* Job posting is now handled through the Map tab */}
                  </Stack.Group>
                </>
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: COLORS.bg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.dark,
    textAlign: "center",
    marginBottom: 12,
  },
  errorHint: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.mid,
    textAlign: "center",
  },
});
