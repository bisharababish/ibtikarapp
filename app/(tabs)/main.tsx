import IbtikarLogo from "@/components/IbtikarLogo";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { runPreview } from "@/utils/api";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { BookOpen, ExternalLink, LogOut, Shield, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  Modal,
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

  // Redirect to login if no user (prevent loops) - ONLY ONCE
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    if (!user && !hasRedirectedRef.current) {
      console.log("⚠️ Main screen: No user, redirecting to login (ONCE)");
      hasRedirectedRef.current = true;
      // Small delay to prevent loop
      const timer = setTimeout(() => {
        router.replace("/");
      }, 100);
      return () => clearTimeout(timer);
    }
    if (user) {
      hasRedirectedRef.current = false;
    }
  }, [user, router]);

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<{
    harmful_count?: number;
    safe_count?: number;
    unknown_count?: number;
  } | null>(null);
  const { items, total: postsTotal, loading: postsLoading, error: postsError, refresh } = usePosts(user?.id);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Animation for main screen elements
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const logoutScale = useRef(new Animated.Value(1)).current;
  const logoutOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const openPalPoliceLink = async () => {
    const url = "https://www.palpolice.ps/contact-awareness-of-cybercrime";
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error("Error opening link:", error);
      Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
    }
  };

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
        console.log("✅ Preview result:", res);
        // Store analysis summary for display
        if (res) {
          setAnalysisSummary({
            harmful_count: res.harmful_count || 0,
            safe_count: res.safe_count || 0,
            unknown_count: res.unknown_count || 0,
          });
          console.log("📊 Analysis summary:", res);
          console.log(`📊 Results: ${res.harmful_count || 0} harmful, ${res.safe_count || 0} safe, ${res.unknown_count || 0} unknown`);
        }
        // Wait longer for database to save (Space API can take 90s, so wait a bit more)
        setTimeout(() => {
          console.log("🔄 Refreshing posts after analysis...");
          refresh();
        }, 3000); // Increased to 3 seconds to ensure DB save after long API calls
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
          } catch { }

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
    // Animate logout button press
    Animated.parallel([
      Animated.sequence([
        Animated.timing(logoutScale, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoutScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(logoutScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoutOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Execute logout after animation - ALWAYS go to root index with colorful UI
      if (logout) {
        logout();
      }
      // Force navigation to root index (not tabs/index) - ensures colorful gradient
      router.replace("/");
    });
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View
          style={{
            transform: [{ scale: logoutScale }],
            opacity: logoutOpacity,
          }}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <LogOut color="#ef4444" size={24} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.profileSection,
            { opacity: fadeInAnim }
          ]}
        >
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
        </Animated.View>

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
                    {analysisSummary.unknown_count && analysisSummary.unknown_count > 0 ? (
                      <Text style={{ color: "#888888", fontSize: 11 }}>
                        Unknown: {analysisSummary.unknown_count}
                      </Text>
                    ) : null}
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

        {/* Safety Resources Section */}
        <Animated.View
          style={[
            styles.safetySection,
            { opacity: fadeInAnim }
          ]}
        >
          <View style={styles.safetyHeader}>
            <Shield color="#a78bfa" size={24} />
            <Text style={styles.safetyTitle}>Safety & Resources</Text>
          </View>

          <TouchableOpacity
            style={styles.safetyCard}
            onPress={openPalPoliceLink}
            activeOpacity={0.7}
          >
            <View style={styles.safetyCardContent}>
              <View style={styles.safetyCardIcon}>
                <Shield color="#10b981" size={28} />
              </View>
              <View style={styles.safetyCardText}>
                <Text style={styles.safetyCardTitle}>Palestinian Police</Text>
                <Text style={styles.safetyCardSubtitle}>Cybercrime Awareness & Reporting</Text>
              </View>
              <ExternalLink color="#666666" size={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.safetyCard}
            onPress={() => setShowDocumentModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.safetyCardContent}>
              <View style={styles.safetyCardIcon}>
                <BookOpen color="#8b5cf6" size={28} />
              </View>
              <View style={styles.safetyCardText}>
                <Text style={styles.safetyCardTitle}>Digital Safety Guide</Text>
                <Text style={styles.safetyCardSubtitle}>Comprehensive guide on digital gender-based violence</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Document Modal */}
      <Modal
        visible={showDocumentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Digital Safety Guide</Text>
            <TouchableOpacity
              onPress={() => setShowDocumentModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.documentTitle}>
              مشروع تمكين المرونة الرقمية: العنف القائم على النوع الاجتماعي عبر الوسائل التكنولوجية – دليل عملي شامل
            </Text>
            <Text style={styles.documentText}>
              هذا الدليل الشامل يقدم معلومات مهمة حول العنف الرقمي القائم على النوع الاجتماعي،
              بما في ذلك التعريفات والأشكال والأسباب والتأثيرات وآليات الاستجابة والتبليغ والحماية الرقمية.
            </Text>
            <Text style={styles.documentSectionTitle}>أشكال العنف الرقمي:</Text>
            <Text style={styles.documentText}>
              • التحرّش الإلكتروني{'\n'}
              • الابتزاز الجنسي/العاطفي{'\n'}
              • الملاحقة الإلكترونية{'\n'}
              • نشر الصور/المعلومات الخاصة دون إذن{'\n'}
              • التنمّر الإلكتروني{'\n'}
              • انتحال الهوية{'\n'}
              • تقييد حرية التعبير{'\n'}
              • الاختراق والتجسّس{'\n'}
              • الديب فيك والصور المركبة
            </Text>
            <Text style={styles.documentSectionTitle}>ماذا تفعلين إذا تعرضتِ لابتزاز أو عنف رقمي؟</Text>
            <Text style={styles.documentText}>
              1. لا تتجاوبي مع المبتز ولا ترسلي أموالًا{'\n'}
              2. احفظي الأدلة فورًا (صور شاشة، روابط، تواريخ){'\n'}
              3. غيّري كلمات المرور وفعّلي المصادقة الثنائية{'\n'}
              4. احظري الحسابات المسيئة وبلّغي عنها{'\n'}
              5. اطلبي دعمًا متخصصًا (نفسي، قانوني، تقني){'\n'}
              6. أبلغي الجهات الرسمية (وحدة الجرائم الإلكترونية)
            </Text>
            <Text style={styles.documentSectionTitle}>للحصول على المساعدة:</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={openPalPoliceLink}
            >
              <Text style={styles.linkButtonText}>
                زيارة موقع الشرطة الفلسطينية - وحدة الجرائم الإلكترونية
              </Text>
              <ExternalLink color="#fff" size={18} />
            </TouchableOpacity>
            <Text style={styles.documentNote}>
              ملاحظة: هذا دليل مختصر. للحصول على الدليل الكامل، يرجى زيارة الموقع الرسمي.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1b4b",
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
    backgroundColor: "#312e81",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: "#312e81",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#4c1d95",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
    backgroundColor: "#1e1b4b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#8b5cf6",
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
    borderTopColor: "#4c1d95",
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  safetySection: {
    marginTop: 32,
    backgroundColor: "#312e81",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#4c1d95",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  safetyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  safetyCard: {
    backgroundColor: "#1e1b4b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#4c1d95",
  },
  safetyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  safetyCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#312e81",
    justifyContent: "center",
    alignItems: "center",
  },
  safetyCardText: {
    flex: 1,
  },
  safetyCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  safetyCardSubtitle: {
    fontSize: 13,
    color: "#888888",
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1e1b4b",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#4c1d95",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#312e81",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4c1d95",
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "right",
    lineHeight: 28,
  },
  documentText: {
    fontSize: 15,
    color: "#CCCCCC",
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "right",
  },
  documentSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#a78bfa",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "right",
  },
  linkButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  documentNote: {
    fontSize: 13,
    color: "#666666",
    fontStyle: "italic",
    marginTop: 20,
    textAlign: "right",
  },
});