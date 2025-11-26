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
  const { user, loginWithTwitter, isLoggingIn, cancelLogin, pollingStatus, manualCheckStatus } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // Debug: Log when isLoggingIn changes
  useEffect(() => {
    console.log("🔍 LoginScreen: isLoggingIn =", isLoggingIn);
    console.log("🔍 LoginScreen: pollingStatus =", pollingStatus);
  }, [isLoggingIn, pollingStatus]);

  // Auto-redirect when user is set
  useEffect(() => {
    if (user) {
      setDebugInfo(`✅ User logged in! ID: ${user.id}, Name: ${user.name}`);
      console.log("=".repeat(80));
      console.log("🔄 REDIRECT: User detected, navigating to main");
      console.log("   User ID:", user.id);
      console.log("   User Name:", user.name);
      console.log("=".repeat(80));
      
      // Navigate to main screen
      router.replace("/(tabs)/main");
      console.log("✅ Redirected to /(tabs)/main");
    }
  }, [user, router]);

  // Manual redirect function
  const handleContinue = () => {
    if (user) {
      console.log("🔄 Manual redirect triggered");
      router.replace("/(tabs)/main");
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
                  <View style={styles.statusContainer}>
                    <ActivityIndicator size="large" color="#1DA1F2" style={{ marginBottom: 16 }} />
                    {pollingStatus ? (
                      <Text style={styles.pollingText}>{pollingStatus}</Text>
                    ) : (
                      <Text style={styles.pollingText}>Waiting for authorization...</Text>
                    )}
                    <Text style={styles.instructionText}>
                      After authorizing on Twitter, click the button below:
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.authorizedButton}
                    onPress={manualCheckStatus}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.authorizedButtonText}>
                      ✅ I Authorized - Check Status
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.helpText}>
                    If you completed authorization on Twitter, click the green button above.
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelLogin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Login</Text>
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
  pollingContainer: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  pollingText: {
    fontSize: 13,
    color: "#10b981",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
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
  statusContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 12,
    opacity: 0.9,
  },
  authorizedButton: {
    backgroundColor: "#10b981",
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 35,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 25px rgba(16, 185, 129, 0.6)",
      },
      default: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 12,
      },
    }),
  },
  authorizedButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    textAlign: "center",
  },
  helpText: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
