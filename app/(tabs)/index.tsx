import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { Twitter } from "lucide-react-native";
import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IbtikarLogo from "@/components/IbtikarLogo";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const { user, loginWithTwitter, isLoggingIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)/main");
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

          <TouchableOpacity
            style={[styles.twitterButton, isLoggingIn && styles.twitterButtonDisabled]}
            onPress={loginWithTwitter}
            activeOpacity={0.8}
            disabled={isLoggingIn}
          >
            <Twitter color="#FFFFFF" size={24} strokeWidth={2.5} />
            <Text style={styles.buttonText}>
              {isLoggingIn ? "Logging in..." : "Login with Twitter"}
            </Text>
          </TouchableOpacity>
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
});