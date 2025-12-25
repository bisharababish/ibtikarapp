import IbtikarLogo from "@/components/IbtikarLogo";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggingIn, loginWithTwitter, pollingStatus, manualCheckStatus, cancelLogin } = useAuth();
  const router = useRouter();

  // Debug: Log user state changes
  useEffect(() => {
    console.log("🔍 LoginScreen - User state changed:", user ? `User ID: ${user.id}, Name: ${user.name}` : "null");
    console.log("🔍 LoginScreen - isLoggingIn:", isLoggingIn);
  }, [user, isLoggingIn]);

  // Redirect when user is set
  useEffect(() => {
    if (user) {
      console.log("✅ User detected, navigating to main");
      console.log("   User:", JSON.stringify(user, null, 2));
      console.log("   User ID:", user.id);
      console.log("   User Name:", user.name);

      // Use a slightly longer delay to ensure state is fully propagated
      const timer = setTimeout(() => {
        console.log("🔄 Starting navigation...");
        console.log("   Current route (if available):", router.pathname || "unknown");

        // Try multiple navigation methods to ensure it works
        console.log("   Attempt 1: router.replace('/(tabs)/main')");
        router.replace("/(tabs)/main");

        // Backup attempts
        setTimeout(() => {
          console.log("   Attempt 2: router.push('/(tabs)/main')");
          router.push("/(tabs)/main");
        }, 200);

        setTimeout(() => {
          console.log("   Attempt 3: router.replace('/main')");
          router.replace("/main");
        }, 400);
      }, 200);

      return () => {
        clearTimeout(timer);
        console.log("🧹 Cleanup: Navigation timer cleared");
      };
    } else {
      console.log("⏳ No user yet, waiting...");
    }
  }, [user, router]);

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
        <View style={styles.logoContainer}>
          <IbtikarLogo
            size={Math.min(width * 0.55, 240)}
            style={styles.logoWrapper}
          />
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.title}>Welcome to Ibtikar</Text>
          <Text style={styles.subtitle}>
            Empowerment & Social Entrepreneurship
          </Text>

          {!isLoggingIn ? (
            <TouchableOpacity style={styles.loginButton} onPress={loginWithTwitter}>
              <Text style={styles.loginButtonText}>🐦 Login with Twitter</Text>
            </TouchableOpacity>
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
        </View>
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  logoWrapper: {
    // No effects as per official guidelines
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1.5,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.8,
    opacity: 0.9,
    textShadowColor: "rgba(255, 255, 255, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loginButton: {
    backgroundColor: "#00A3A3",
    paddingHorizontal: 44,
    paddingVertical: 20,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 260,
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2.5,
    borderColor: "#000000",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loggingInContainer: {
    alignItems: "center",
    gap: 15,
    width: "100%",
  },
  statusText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  checkButton: {
    backgroundColor: "#38B000",
    paddingHorizontal: 44,
    paddingVertical: 20,
    borderRadius: 32,
    minWidth: 260,
    marginTop: 20,
    shadowColor: "#38B000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2.5,
    borderColor: "#000000",
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    backgroundColor: "#AAAAAA",
    paddingHorizontal: 44,
    paddingVertical: 18,
    borderRadius: 32,
    minWidth: 260,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
