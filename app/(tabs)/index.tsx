import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { Twitter, CheckCircle, TestTube } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IbtikarLogo from "@/components/IbtikarLogo";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const { user, loginWithTwitter, isLoggingIn, cancelLogin } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Auto-redirect when user is set
  useEffect(() => {
    if (user) {
      setDebugInfo(`✅ User logged in! ID: ${user.id}, Name: ${user.name}`);
      console.log("=".repeat(80));
      console.log("🔄 REDIRECT: User detected, attempting redirect");
      console.log("   User ID:", user.id);
      console.log("   User Name:", user.name);
      console.log("   Route: /(tabs)/main");
      console.log("=".repeat(80));
      
      // Try redirect immediately
      const attemptRedirect = () => {
        try {
          console.log("🔄 Attempting router.replace to /(tabs)/main");
          router.replace("/(tabs)/main");
          console.log("✅ Redirect command sent");
        } catch (e) {
          console.error("❌ Redirect error:", e);
          // Fallback to push
          try {
            console.log("🔄 Fallback: Attempting router.push");
            router.push("/(tabs)/main");
          } catch (e2) {
            console.error("❌ Fallback redirect also failed:", e2);
          }
        }
      };
      
      // Try immediately
      attemptRedirect();
      
      // Also try after delays in case state needs to settle
      const timeoutId1 = setTimeout(() => {
        console.log("🔄 Retry redirect after 300ms");
        attemptRedirect();
      }, 300);
      
      const timeoutId2 = setTimeout(() => {
        console.log("🔄 Retry redirect after 1000ms");
        attemptRedirect();
      }, 1000);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
      };
    }
  }, [user, router]);

  // Manual redirect function
  const handleContinue = () => {
    if (user) {
      console.log("🔄 Manual redirect triggered");
      try {
        router.replace("/(tabs)/main");
      } catch (e) {
        console.error("❌ Manual redirect failed:", e);
        router.push("/(tabs)/main");
      }
    }
  };

  // Test deep link manually
  const testDeepLink = async () => {
    const testUrl = "ibtikar://oauth/callback?success=true&user_id=1";
    Alert.alert(
      "🧪 Test Deep Link",
      `This will simulate the OAuth callback.\n\nURL: ${testUrl}\n\nThis helps verify if deep links work.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Test",
          onPress: async () => {
            try {
              const canOpen = await Linking.canOpenURL(testUrl);
              if (canOpen) {
                await Linking.openURL(testUrl);
                Alert.alert("✅ Test Sent", "Deep link test sent. Check if callback is processed.");
              } else {
                Alert.alert("❌ Cannot Open", "Deep link scheme not configured properly.");
              }
            } catch (e) {
              Alert.alert("❌ Error", `Failed to open deep link: ${e}`);
            }
          },
        },
      ]
    );
  };

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

          {debugInfo ? (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          ) : null}
          {user ? (
            <View style={styles.successContainer}>
              <CheckCircle color="#10b981" size={32} />
              <Text style={styles.successText}>Login Successful!</Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue to App</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loginContainer}>
              <TouchableOpacity
                style={[styles.twitterButton, isLoggingIn && styles.twitterButtonDisabled]}
                onPress={loginWithTwitter}
                activeOpacity={0.8}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.buttonText}>Logging in...</Text>
                  </>
                ) : (
                  <>
                    <Twitter color="#FFFFFF" size={24} strokeWidth={2.5} />
                    <Text style={styles.buttonText}>Login with Twitter</Text>
                  </>
                )}
              </TouchableOpacity>
              {isLoggingIn && (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelLogin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={testDeepLink}
                    activeOpacity={0.8}
                  >
                    <TestTube color="#888888" size={16} />
                    <Text style={styles.testButtonText}>Test Deep Link</Text>
                  </TouchableOpacity>
                </>
              )}
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
  twitterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1DA1F2",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 12,
    width: "100%",
    maxWidth: 320,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 20px rgba(29, 161, 242, 0.4)",
      },
      default: {
        shadowColor: "#1DA1F2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  twitterButtonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10b981",
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#10b981",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
      },
      default: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  loginContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888888",
    textDecorationLine: "underline",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#888888",
  },
  debugContainer: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  debugText: {
    fontSize: 12,
    color: "#10b981",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
