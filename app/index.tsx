// Root index - directly render the login screen
import IbtikarLogo from "@/components/IbtikarLogo";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function Index() {
  const insets = useSafeAreaInsets();
  const { user, isLoggingIn, loginWithTwitter, pollingStatus, manualCheckStatus, cancelLogin } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const hasResetSplashRef = useRef(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;

  // Start animations after splash or when user logs out
  useEffect(() => {
    if (!showSplash && !user) {
      // Animate login screen when not showing splash and no user
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSplash, user]);

  // When user logs out, show splash screen again then colorful login screen (prevent loops)
  const logoutProcessedRef = useRef(false);
  useEffect(() => {
    if (!user) {
      // User logged out - show splash screen again, then colorful login screen
      if (!logoutProcessedRef.current) {
        console.log("🔄 User logged out - showing splash screen then colorful gradient login screen");
        logoutProcessedRef.current = true;
        // Show splash screen again on logout
        setShowSplash(true);
        hasResetSplashRef.current = false;

        // Force re-render by resetting everything
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        logoScale.setValue(0.8);
        buttonScale.setValue(0.9);

        // Trigger animations immediately to show colorful screen
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(buttonScale, {
              toValue: 1,
              tension: 40,
              friction: 6,
              delay: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }, 50);
      }
    } else {
      // Reset flags when user logs back in
      logoutProcessedRef.current = false;
      hasResetSplashRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Safety: If splash is stuck, force it to finish after 5 seconds
  useEffect(() => {
    if (showSplash) {
      const safetyTimer = setTimeout(() => {
        console.log("⚠️ Splash screen stuck - forcing finish");
        setShowSplash(false);
      }, 5000);
      return () => clearTimeout(safetyTimer);
    }
  }, [showSplash]);

  // Redirect when user is set
  useEffect(() => {
    if (user) {
      console.log("✅ User detected, navigating to main");
      console.log("   User:", JSON.stringify(user, null, 2));
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        try {
          console.log("🔄 Attempting navigation to /(tabs)/main");
          router.replace("/(tabs)/main");
          console.log("✅ Navigation triggered");
        } catch (error) {
          console.error("❌ Navigation error:", error);
          // Fallback: try push
          router.push("/(tabs)/main");
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Official Ibtikar gradient: Yellow -> Teal -> Black
  const gradientColors = ["#F6DE55", "#00A3A3", "#000000"] as const;

  return (
    <LinearGradient
      colors={gradientColors as any}
      style={[styles.container, { backgroundColor: "#F6DE55" }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 40),
            paddingBottom: Math.max(insets.bottom, 40),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <IbtikarLogo
            size={Math.min(width * 0.35, 140)}
            style={styles.logoWrapper}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.title}>Welcome to Ibtikar</Text>
          <Text style={styles.subtitle}>
            Empowerment & Social Entrepreneurship
          </Text>

          {!isLoggingIn ? (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={loginWithTwitter}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>🐦 Login with Twitter</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.loggingInContainer}>
              <TouchableOpacity style={styles.loginButton} disabled>
                <ActivityIndicator color="#fff" />
                <Text style={styles.loginButtonText}>Logging in...</Text>
              </TouchableOpacity>
              {pollingStatus && (
                <Text style={styles.statusText}>{pollingStatus}</Text>
              )}
              <TouchableOpacity style={styles.checkButton} onPress={manualCheckStatus}>
                <Text style={styles.checkButtonText}>✅ I Authorized - Check Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelLogin}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6DE55", // Fallback Ibtikar Yellow
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingTop: 20,
  },
  logoWrapper: {
    // No effects as per official guidelines
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 1,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.5,
    opacity: 0.9,
    textShadowColor: "rgba(255, 255, 255, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loginButton: {
    backgroundColor: "#00A3A3",
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 240,
    maxWidth: "90%",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#000000",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loggingInContainer: {
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 20,
  },
  statusText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  checkButton: {
    backgroundColor: "#38B000",
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 28,
    minWidth: 240,
    maxWidth: "90%",
    marginTop: 8,
    shadowColor: "#38B000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#000000",
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    backgroundColor: "#AAAAAA",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 28,
    minWidth: 240,
    maxWidth: "90%",
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
