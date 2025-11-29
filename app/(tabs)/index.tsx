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

  // ALWAYS use colorful gradient - NEVER black!
  const gradientColors = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc"] as const;

  return (
    <LinearGradient
      colors={gradientColors as any}
      style={[styles.container, { backgroundColor: "#6366f1" }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.33, 0.66, 1]}
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
    backgroundColor: "#6366f1", // Fallback purple color
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
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.8,
    opacity: 1,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  loginButton: {
    backgroundColor: "#1DA1F2",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 250,
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#1DA1F2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  checkButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    minWidth: 250,
    marginTop: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
    backgroundColor: "#6B7280",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 250,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
