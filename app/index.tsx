// Root index - directly render the login screen
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

export default function Index() {
  const insets = useSafeAreaInsets();
  const { user, isLoggingIn, loginWithTwitter, pollingStatus, manualCheckStatus, cancelLogin } = useAuth();
  const router = useRouter();

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

  return (
    <LinearGradient
      colors={["#000000", "#0a0a0a", "#000000"]}
      style={styles.container}
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
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#888888",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  loginButton: {
    backgroundColor: "#1DA1F2",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 250,
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loggingInContainer: {
    alignItems: "center",
    gap: 15,
    width: "100%",
  },
  statusText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  checkButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 250,
    marginTop: 20,
  },
  checkButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#374151",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 250,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
