import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { LogOut, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IbtikarLogo from "@/components/IbtikarLogo";
import { runPreview } from "@/utils/api";
import { usePosts } from "@/hooks/usePosts";

export default function MainScreen() {
  const { user, isActive, toggleActive, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [isActive]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });



  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items, loading: postsLoading, error: postsError, refresh } = usePosts();

  const handleToggle = async () => {
    console.log("Toggle activation:", !isActive);
    setError(null);
    toggleActive();
    if (!isActive) {
      // When turning ON, trigger the backend preview pipeline
      try {
        setLoading(true);
        const res = await runPreview();
        console.log("Preview result:", res);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to start analysis");
      } finally {
        setLoading(false);
        // Refresh analyzed posts after running preview
        void refresh();
      }
    }
  };

  const handleLogout = () => {
    if (logout) {
      logout();
    }
    router.replace("/");
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <LogOut color="#666666" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://api.dicebear.com/7.x/avataaars/png?seed=Ibtikar",
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>

          <Text style={styles.userName}>Ibtikar User</Text>
          <Text style={styles.userHandle}>@ibtikar_user</Text>
          <Text style={styles.userEmail}>user@ibtikar.sa</Text>

          {/* Official Ibtikar Logo */}
          <View style={styles.logoContainer}>
            <IbtikarLogo
              size={100}
              style={styles.logoWrapper}
            />
          </View>
        </View>

        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Animated.View
              style={[
                styles.aiIconContainer,
                {
                  backgroundColor: isActive ? '#8b5cf6' : '#2a2a2a',
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Sparkles
                  color={isActive ? "#a78bfa" : "#666666"}
                  size={40}
                />
              </Animated.View>
            </Animated.View>
            <View style={styles.aiInfo}>
              <Text style={styles.aiTitle}>AI Assistant</Text>
              <Text style={[styles.aiStatus, isActive && styles.aiStatusActive]}>
                {loading
                  ? "Running analysis..."
                  : isActive
                  ? "Currently Active"
                  : "Currently Inactive"}
              </Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Activate</Text>
            <Switch
              value={isActive}
              onValueChange={handleToggle}
              trackColor={{ false: "#333333", true: "#7c3aed" }}
              thumbColor={isActive ? "#a78bfa" : "#666666"}
              ios_backgroundColor="#333333"
            />
          </View>
          {!!error && (
            <Text style={{ color: "#ef4444", marginTop: 12 }} numberOfLines={2}>
              {error}
            </Text>
          )}
          {!!postsError && (
            <Text style={{ color: "#ef4444", marginTop: 8 }} numberOfLines={2}>
              {postsError}
            </Text>
          )}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                Recent analyzed posts
              </Text>
              <TouchableOpacity onPress={() => refresh()} activeOpacity={0.8}>
                <Text style={{ color: "#a78bfa" }}>{postsLoading ? "Refreshing..." : "Refresh"}</Text>
              </TouchableOpacity>
            </View>
            {items.length === 0 ? (
              <Text style={{ color: "#888888" }}>
                {postsLoading ? "Loading..." : "No posts yet. Toggle Activate to analyze your feed."}
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {items.map((p) => (
                  <View
                    key={`${p.id}-${p.post_id}`}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: "#111111",
                      borderWidth: 1,
                      borderColor: "#2a2a2a",
                    }}
                  >
                    <Text style={{ color: "#a1a1aa", marginBottom: 6 }} numberOfLines={1}>
                      @{p.author_id} • {p.lang?.toUpperCase?.() || "—"} • {p.label.toUpperCase()}
                    </Text>
                    <Text style={{ color: "#ffffff" }} numberOfLines={3}>
                      {p.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "flex-end",
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginTop: 20,
    alignItems: "center",
    marginBottom: 8,
  },
  logoWrapper: {
    // No effects as per official guidelines
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#1DA1F2",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10b981",
    borderWidth: 3,
    borderColor: "#000000",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#1DA1F2",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
  },
  aiSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#333333",
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  aiIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  aiInfo: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  aiStatus: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
  },
  aiStatusActive: {
    color: "#a78bfa",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});