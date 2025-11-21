import IbtikarLogo from "@/components/IbtikarLogo";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { runPreview } from "@/utils/api";
import { useRouter } from "expo-router";
import { LogOut, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [analysisSummary, setAnalysisSummary] = useState<{
    harmful_count?: number;
    safe_count?: number;
    unknown_count?: number;
  } | null>(null);
  const { items, total: postsTotal, loading: postsLoading, error: postsError, refresh } = usePosts(user?.id);

  const handleToggle = async () => {
    console.log("Toggle activation:", !isActive);
    setError(null);

    if (!isActive && !user?.id) {
      setError("User ID is required. Please log in again.");
      return;
    }

    toggleActive();
    if (!isActive) {
      // When turning ON, trigger the backend preview pipeline
      try {
        setLoading(true);
        const userId = user?.id;
        if (!userId) {
          throw new Error("User ID is missing");
        }
        console.log("Running preview with user_id:", userId, "User object:", user);
        const res = await runPreview(userId);
        console.log("Preview result:", res);
        // Store analysis summary for display
        if (res) {
          setAnalysisSummary({
            harmful_count: res.harmful_count,
            safe_count: res.safe_count,
            unknown_count: res.unknown_count,
          });
          console.log("📊 Analysis summary:", res);
        }
        // Wait a moment for database to save, then refresh posts
        setTimeout(() => {
          console.log("🔄 Refreshing posts after analysis...");
          refresh();
        }, 2000); // Increased to 2 seconds to ensure DB save
      } catch (e: any) {
        console.error("Preview error:", e);
        // Try to extract more detailed error message
        let errorMsg = e?.message || "Failed to start analysis";
        if (errorMsg.includes("HTTP 500")) {
          errorMsg = "Server error. This might be due to:\n• Twitter API connection issue\n• Database problem\n• Model API unavailable\n\nPlease try again in a moment.";
        } else if (errorMsg.includes("HTTP 429") || errorMsg.includes("rate_limited") || errorMsg.includes("rate limit")) {
          // Try to extract reset time from error details
          let resetInfo = "";
          try {
            const errorText = e?.message || "";
            const resetMatch = errorText.match(/reset_time[:\s]+([^,\n}]+)/i);
            if (resetMatch) {
              resetInfo = `\n\nReset time: ${resetMatch[1]}`;
            }
          } catch {}
          
          errorMsg = `Rate limit exceeded. The API has temporarily limited requests.\n\nPlease wait 5-10 minutes before trying again.${resetInfo}`;
        }
        setError(errorMsg);
        // Revert toggle if error occurred
        toggleActive();
      } finally {
        setLoading(false);
        // Refresh analyzed posts after running preview
        if (user?.id) {
          void refresh();
        }
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
                uri: user.profileImageUrl || "https://api.dicebear.com/7.x/avataaars/png?seed=Ibtikar",
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>

          <Text style={styles.userName}>{user.name || "Ibtikar User"}</Text>
          <Text style={styles.userHandle}>@{user.username || "ibtikar_user"}</Text>
          <Text style={styles.userEmail}>{user.email || "user@ibtikar.sa"}</Text>

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
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                  Analyzed Posts
                </Text>
                {postsTotal > 0 && (
                  <Text style={{ color: "#888888", fontSize: 12, marginTop: 2 }}>
                    Total: {postsTotal} post{postsTotal !== 1 ? "s" : ""}
                  </Text>
                )}
                {analysisSummary && (
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                    <Text style={{ color: "#ef4444", fontSize: 11 }}>
                      Harmful: {analysisSummary.harmful_count ?? 0}
                    </Text>
                    <Text style={{ color: "#10b981", fontSize: 11 }}>
                      Safe: {analysisSummary.safe_count ?? 0}
                    </Text>
                    {analysisSummary.unknown_count && analysisSummary.unknown_count > 0 && (
                      <Text style={{ color: "#888888", fontSize: 11 }}>
                        Unknown: {analysisSummary.unknown_count}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => refresh()} activeOpacity={0.8}>
                <Text style={{ color: "#a78bfa" }}>{postsLoading ? "Refreshing..." : "Refresh"}</Text>
              </TouchableOpacity>
            </View>
            {items.length === 0 ? (
              <Text style={{ color: "#888888" }}>
                {postsLoading ? "Loading..." : "No posts analyzed yet. Toggle Activate to analyze your feed."}
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {items.map((p) => {
                  const isHarmful = (p.label || "").toLowerCase() === "harmful" || (p.label || "").toLowerCase() === "toxic";
                  const isSafe = (p.label || "").toLowerCase() === "safe";
                  const isUnknown = !isHarmful && !isSafe;
                  
                  const borderColor = isHarmful ? "#ef4444" : isSafe ? "#10b981" : "#888888";
                  const bgColor = isHarmful ? "#1a0a0a" : isSafe ? "#0a1a0a" : "#1a1a1a";
                  const labelColor = isHarmful ? "#ef4444" : isSafe ? "#10b981" : "#888888";
                  const labelIcon = isHarmful ? "⚠️" : isSafe ? "✅" : "❓";
                  const labelText = isHarmful ? "HARMFUL" : isSafe ? "SAFE" : "UNKNOWN";
                  
                  return (
                  <View
                    key={`${p.id}-${p.post_id}`}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: bgColor,
                      borderWidth: 1,
                      borderColor: borderColor,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: labelColor, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                          {labelIcon} @{p.author_id} • {p.lang?.toUpperCase?.() || "—"} • {labelText}
                        </Text>
                        {p.source && (
                          <Text style={{ color: "#666666", fontSize: 10, marginTop: 2 }}>
                            Source: {p.source.toUpperCase()} • ID: {p.post_id}
                          </Text>
                        )}
                      </View>
                      {p.score !== undefined && (
                        <Text style={{ color: labelColor, fontSize: 11, fontWeight: "700", marginLeft: 8 }}>
                          {(p.score * 100).toFixed(2)}%
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: "#ffffff", fontSize: 14, marginBottom: 8 }}>
                      {p.text}
                    </Text>
                    <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: "#2a1a1a" }}>
                      {p.score !== undefined && (
                        <>
                          <Text style={{ color: "#a1a1aa", fontSize: 10, marginBottom: 4 }}>
                            Confidence: {(p.score * 100).toFixed(2)}% (Class: {isHarmful ? "1" : "0"})
                          </Text>
                          <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                            <Text style={{ color: isSafe ? "#10b981" : "#666666", fontSize: 9 }}>
                              Safe: {((1 - p.score) * 100).toFixed(2)}%
                            </Text>
                            <Text style={{ color: isHarmful ? "#ef4444" : "#666666", fontSize: 9 }}>
                              Harmful: {(p.score * 100).toFixed(2)}%
                            </Text>
                          </View>
                        </>
                      )}
                      <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                        {p.post_created_at && (
                          <Text style={{ color: "#666666", fontSize: 9 }}>
                            Posted: {new Date(p.post_created_at).toLocaleDateString()}
                          </Text>
                        )}
                        {p.created_at && (
                          <Text style={{ color: "#666666", fontSize: 9 }}>
                            Analyzed: {new Date(p.created_at).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      </View>
                    </View>
                  );
                })}
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