import IbtikarLogo from "@/components/IbtikarLogo";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { runPreview } from "@/utils/api";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { LogOut, Sparkles } from "lucide-react-native";
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
  }, [isActive, pulseAnim, rotateAnim]);

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
  }, [fadeInAnim]);

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
        if (errorMsg.includes("HTTP 520") || errorMsg.includes("520")) {
          errorMsg = "Server connection error. The backend server is currently unavailable.\n\nThis usually means:\n• The server is temporarily down\n• There's a connection issue\n\nPlease try again in a few minutes.";
        } else if (errorMsg.includes("HTTP 500")) {
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
        } else if (errorMsg.includes("HTTP 502") || errorMsg.includes("HTTP 503") || errorMsg.includes("HTTP 504")) {
          errorMsg = "Service temporarily unavailable. The server is either overloaded or under maintenance.\n\nPlease try again in a few minutes.";
        } else if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError") || errorMsg.includes("network")) {
          errorMsg = "Network connection error. Please check your internet connection and try again.";
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
            <LogOut color="#D90000" size={24} />
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
                  backgroundColor: isActive ? '#00A3A3' : '#333333',
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Sparkles
                  color={isActive ? "#F6DE55" : "#AAAAAA"}
                  size={44}
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
              trackColor={{ false: "#E5E5E5", true: "#00A3A3" }}
              thumbColor={isActive ? "#F6DE55" : "#AAAAAA"}
              ios_backgroundColor="#E5E5E5"
            />
          </View>
          {!!error && (
            <Text style={{ color: "#D90000", marginTop: 12 }} numberOfLines={2}>
              {error}
            </Text>
          )}
          {!!postsError && (
            <Text style={{ color: "#D90000", marginTop: 8 }} numberOfLines={2}>
              {postsError}
            </Text>
          )}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#000000", fontSize: 16, fontWeight: "600" }}>
                  Analyzed Posts
                </Text>
                {postsTotal > 0 && (
                  <Text style={{ color: "#333333", fontSize: 12, marginTop: 2 }}>
                    Total: {postsTotal} post{postsTotal !== 1 ? "s" : ""}
                  </Text>
                )}
                {analysisSummary && (
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                    <Text style={{ color: "#D90000", fontSize: 11 }}>
                      Harmful: {analysisSummary.harmful_count ?? 0}
                    </Text>
                    <Text style={{ color: "#38B000", fontSize: 11 }}>
                      Safe: {analysisSummary.safe_count ?? 0}
                    </Text>
                    {analysisSummary.unknown_count && analysisSummary.unknown_count > 0 ? (
                      <Text style={{ color: "#333333", fontSize: 11 }}>
                        Unknown: {analysisSummary.unknown_count}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => refresh()}
                activeOpacity={0.7}
                style={{
                  backgroundColor: "#00A3A3",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#000000",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>
                  {postsLoading ? "Refreshing..." : "Refresh"}
                </Text>
              </TouchableOpacity>
            </View>
            {items.length === 0 ? (
              <Text style={{ color: "#333333" }}>
                {postsLoading ? "Loading..." : "No posts analyzed yet. Toggle Activate to analyze your feed."}
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {items.map((p) => {
                  const isHarmful = (p.label || "").toLowerCase() === "harmful" || (p.label || "").toLowerCase() === "toxic";
                  const isSafe = (p.label || "").toLowerCase() === "safe";
                  const isUnknown = !isHarmful && !isSafe;

                  const borderColor = isHarmful ? "#D90000" : isSafe ? "#38B000" : "#E5E5E5";
                  const bgColor = isHarmful ? "#FAFAFA" : isSafe ? "#FAFAFA" : "#FFFFFF";
                  const labelColor = isHarmful ? "#D90000" : isSafe ? "#38B000" : "#666666";
                  const labelIcon = isHarmful ? "⚠️" : isSafe ? "✅" : "❓";
                  const labelText = isHarmful ? "HARMFUL" : isSafe ? "SAFE" : "UNKNOWN";

                  return (
                    <View
                      key={`${p.id}-${p.post_id}`}
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        backgroundColor: bgColor,
                        borderWidth: 2,
                        borderColor: borderColor,
                        shadowColor: borderColor,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 4,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: labelColor, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                            {labelIcon} @{p.author_id} • {p.lang?.toUpperCase?.() || "—"} • {labelText}
                          </Text>
                          {p.source && (
                            <Text style={{ color: "#333333", fontSize: 10, marginTop: 2 }}>
                              Source: {p.source.toUpperCase()} • ID: {p.post_id}
                            </Text>
                          )}
                        </View>
                        {!isUnknown && p.score !== undefined && (
                          <Text style={{ color: labelColor, fontSize: 11, fontWeight: "700", marginLeft: 8 }}>
                            {(p.score * 100).toFixed(2)}%
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: "#000000", fontSize: 14, marginBottom: 8 }}>
                        {p.text}
                      </Text>
                      <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E5E5E5" }}>
                        {!isUnknown && p.score !== undefined ? (
                          <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                            <Text style={{ color: isSafe ? "#38B000" : "#333333", fontSize: 9 }}>
                              Safe: {((1 - p.score) * 100).toFixed(2)}%
                            </Text>
                            <Text style={{ color: isHarmful ? "#D90000" : "#333333", fontSize: 9 }}>
                              Harmful: {(p.score * 100).toFixed(2)}%
                            </Text>
                          </View>
                        ) : null}
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                          {p.post_created_at && (
                            <Text style={{ color: "#333333", fontSize: 9 }}>
                              Posted: {new Date(p.post_created_at).toLocaleDateString()}
                            </Text>
                          )}
                          {p.created_at && (
                            <Text style={{ color: "#333333", fontSize: 9 }}>
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
            <MaterialIcons name="security" size={26} color="#00A3A3" />
            <Text style={styles.safetyTitle}>Safety & Resources</Text>
          </View>

          <TouchableOpacity
            style={styles.safetyCard}
            onPress={openPalPoliceLink}
            activeOpacity={0.7}
          >
            <View style={styles.safetyCardContent}>
              <View style={styles.safetyCardIcon}>
                <MaterialIcons name="security" size={32} color="#38B000" />
              </View>
              <View style={styles.safetyCardText}>
                <Text style={styles.safetyCardTitle}>Palestinian Police</Text>
                <Text style={styles.safetyCardSubtitle}>Cybercrime Awareness & Reporting</Text>
              </View>
              <MaterialIcons name="open-in-new" size={20} color="#333333" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.safetyCard}
            onPress={() => setShowDocumentModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.safetyCardContent}>
              <View style={styles.safetyCardIcon}>
                <MaterialIcons name="menu-book" size={32} color="#007BBF" />
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
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
            <Text style={styles.documentTitle}>
              مشروع تمكين المرونة الرقمية: العنف القائم على النوع الاجتماعي عبر الوسائل التكنولوجية – دليل عملي شامل
            </Text>

            <Text style={styles.documentSectionTitle}>الغرض من الدليل</Text>
            <Text style={styles.documentText}>
              مادة تعليمية/تدريبية طويلة ودسمة، تجمع التعريفات والأشكال والأسباب والأبعاد والتأثيرات والإحصاءات المحلية (فلسطين) وآليات الاستجابة والتبليغ والحماية الرقمية، بما في ذلك خطوات تفعيل المصادقة الثنائية (2-Step/2FA) على المنصات الشائعة.
            </Text>

            <Text style={styles.documentSectionTitle}>مقدمة</Text>
            <Text style={styles.documentText}>
              مع تطور التكنولوجيا وانتشار وسائل التواصل الاجتماعي، ظهر العنف الرقمي القائم على النوع الاجتماعي بوصفه امتدادًا للعنف الواقع خارج الشبكة. هذا العنف يسبب أضرارًا نفسية واجتماعية ومادية وقانونية، ويحد من مشاركة النساء والفتيات والفاعلات في الشأن العام، ويُقيد حرية التعبير في الفضاء الرقمي تمامًا كما يحدث في الواقع.
            </Text>

            <Text style={styles.documentSectionTitle}>تعريفات أساسية</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>العنف الرقمي القائم على النوع الاجتماعي (TF-GBV):</Text> أي سلوك عدواني أو تهديد أو تحرش أو انتهاك للخصوصية تُستخدم فيه تكنولوجيا المعلومات والاتصالات (الإنترنت، الهواتف، التطبيقات، البريد الإلكتروني... إلخ) ويستهدف النساء والفتيات أو الأفراد بناءً على النوع الاجتماعي، بهدف التخويف أو الإسكات أو الإيذاء.{'\n\n'}
              <Text style={styles.documentBold}>التضليل القائم على النوع الاجتماعي:</Text> حملات أو مضامين مضللة/مفبركة تستغل الصور النمطية والوصم لإقصاء النساء عن الفضاء العام والتشكيك في كفاءتهن، غالبًا عبر صور مُقتطعة أو تعليقات مسيئة على المظهر/السلوك/الحياة الخاصة.{'\n\n'}
              <Text style={styles.documentBold}>الابتزاز الإلكتروني (Sextortion/Blackmail):</Text> تهديد بنشر معلومات/صور خاصة لانتزاع المال أو السيطرة أو إكراه الضحية على سلوك معين.{'\n\n'}
              <Text style={styles.documentBold}>الملاحقة الرقمية (Cyberstalking):</Text> رصد وتتبع ومراقبة الضحية عبر أدوات رقمية بشكل متكرر وممنهج.{'\n\n'}
              <Text style={styles.documentBold}>الصور/الفيديوهات المُركّبة (Deepfakes):</Text> مواد مُولَّدة أو مُعدّلة بالذكاء الاصطناعي تُستخدم للإساءة أو التشهير أو الابتزاز.
            </Text>

            <Text style={styles.documentSectionTitle}>أشكال العنف الرقمي القائم على النوع الاجتماعي</Text>
            <Text style={styles.documentText}>
              • <Text style={styles.documentBold}>التحرّش الإلكتروني:</Text> رسائل ذات طابع جنسي غير مرغوب، تعليقات مهينة، إرسال صور غير لائقة.{'\n'}
              • <Text style={styles.documentBold}>الابتزاز الجنسي/العاطفي:</Text> تهديد بنشر محتوى خاص مقابل المال أو السيطرة أو الإذعان.{'\n'}
              • <Text style={styles.documentBold}>الملاحقة الإلكترونية:</Text> مراقبة الحسابات، تتبّع التواجد والنشاط، اقتحام الحياة الخاصة.{'\n'}
              • <Text style={styles.documentBold}>نشر الصور/المعلومات الخاصة دون إذن:</Text> بهدف التشهير أو الانتقام.{'\n'}
              • <Text style={styles.documentBold}>التنمّر الإلكتروني:</Text> إهانات وسخرية وحملات منظمة للتشويه والإقصاء.{'\n'}
              • <Text style={styles.documentBold}>انتحال الهوية:</Text> فتح حسابات مزيفة باسم الضحية لنشر محتوى مسيء أو مراسلة معارفها.{'\n'}
              • <Text style={styles.documentBold}>تقييد حرية التعبير:</Text> تنظيم هجمات لإسكات النساء المُعبّرات عن آرائهن وإخراجهن من الفضاء العام.{'\n'}
              • <Text style={styles.documentBold}>الاختراق والتجسّس:</Text> سرقة كلمات المرور، الوصول للصور والرسائل والموقع الجغرافي.{'\n'}
              • <Text style={styles.documentBold}>الديب فيك والصور المركبة:</Text> خلق مواد زائفة تستخدم جسد/وجه الضحية لأغراض جنسية أو تشهيرية.
            </Text>

            <Text style={styles.documentSectionTitle}>أسباب التفشي</Text>
            <Text style={styles.documentText}>
              • وصول واسع للتكنولوجيا مع فجوة في الوعي والأمان الرقمي.{'\n'}
              • تمييز متجذّر وصور نمطية ضد النساء والفتيات.{'\n'}
              • ضعف/قصور تشريعات أو التطبيق العملي لها.{'\n'}
              • ثقافة لوم الضحية والتستر على المُعتدين.{'\n'}
              • استغلال ثغرات أمنية وتقنيات الهندسة الاجتماعية.
            </Text>

            <Text style={styles.documentSectionTitle}>الأبعاد المؤثرة</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>أ) البُعد الثقافي:</Text>{'\n'}
              التقليل من خطورة العنف الرقمي أو تبريره. استدعاء مفاهيم مثل {'"'}{'الشرف'}{'"'} للضغط على الضحايا ومنع الإبلاغ. لوم الناجية بدلًا من دعمها.{'\n\n'}
              <Text style={styles.documentBold}>ب) البُعد التكنولوجي:</Text>{'\n'}
              ثغرات أمنية واختراقات وروابط خادعة (Phishing). أدوات تتبّع المواقع والبيانات الوِصفية للصور. تطور الذكاء الاصطناعي والديب فيك الذي يعقّد الإثبات ويضاعف الأذى.{'\n\n'}
              <Text style={styles.documentBold}>ج) البُعد القانوني:</Text>{'\n'}
              قوانين غير محدّثة أو فجوات في التجريم/الإثبات. إهمال الأثر النفسي وطول إجراءات التقاضي.
            </Text>

            <Text style={styles.documentSectionTitle}>الإحصائيات (فلسطين)</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>وفقًا لـ ActionAid Palestine (2023):</Text>{'\n'}
              • 10% من النساء المتزوجات (15–64 سنة) تعرضن للعنف الرقمي عبر التواصل الاجتماعي.{'\n'}
              • 12% من غير المتزوجات تعرضن للعنف عبر وسائل التواصل.{'\n'}
              • 8% تعرضن له عبر الاتصالات الهاتفية.{'\n\n'}
              <Text style={styles.documentBold}>وفقًا لـ 7amleh (2018):</Text>{'\n'}
              • واحدة من كل أربع نساء أغلقت حساباتها بسبب العنف الرقمي.{'\n'}
              • ثلث المشاركات تعرضن لمحاولات اختراق.{'\n'}
              • ثلث آخر تلقى صورًا أو فيديوهات جنسية غير مرغوبة.
            </Text>

            <Text style={styles.documentSectionTitle}>التأثيرات على الضحايا</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>أ) نفسيًا:</Text> قلق، اكتئاب، اضطرابات النوم، توتر مزمن، أعراض صدمة (PTSD) في الحالات الشديدة. فقدان الثقة بالنفس، شعور دائم بالتهديد، جلد الذات.{'\n\n'}
              <Text style={styles.documentBold}>ب) اجتماعيًا:</Text> نزاعات أسرية، عزلة اجتماعية، تقييد العلاقات. انسحاب قسري من الإنترنت أو استخدام هويات مستعارة.{'\n\n'}
              <Text style={styles.documentBold}>ج) تعليميًا/مهنيًا:</Text> تراجع بالأداء، تغيّب/انسحاب من الدراسة أو العمل. فقدان فرص وظيفية أو مشاريع بسبب التشهير.{'\n\n'}
              <Text style={styles.documentBold}>د) أمنيًا/جسديًا:</Text> تعقّب في العالم الواقعي بعد تسريب بيانات (رقم، عنوان، مكان عمل)، مخاطر استهداف مباشر.{'\n\n'}
              <Text style={styles.documentBold}>هـ) قانونيًا/اقتصاديًا:</Text> تكاليف قانونية وتقنية، خسائر مالية نتيجة الابتزاز أو سرقة الحسابات.
            </Text>

            <Text style={styles.documentSectionTitle}>الفئات الأكثر عرضة</Text>
            <Text style={styles.documentText}>
              النساء والفتيات عموماً، وبشكل خاص:{'\n'}
              • الناشطات/المدافعات/العاملات في الشأن العام.{'\n'}
              • الصحفيات وصانعات المحتوى والمؤثرات.{'\n'}
              • الطالبات وصاحبات المشاريع الصغيرة/الأعمال المنزلية.{'\n'}
              • من لديهن تجارب سابقة مع العنف الأسري أو المجتمعي.{'\n'}
              • المراهقات والشابات بسبب قلة الخبرة الرقمية.{'\n'}
              • من يبحثن عن علاقات عاطفية عبر الإنترنت.
            </Text>

            <Text style={styles.documentSectionTitle}>ماذا تفعلين إذا تعرضتِ لابتزاز أو عنف رقمي؟</Text>
            <Text style={styles.documentText}>
              1. <Text style={styles.documentBold}>لا تتجاوبي مع المبتز ولا ترسلي أموالًا.</Text>{'\n'}
              2. <Text style={styles.documentBold}>احفظي الأدلة فورًا:</Text> صور شاشة، روابط، تواريخ، عناوين حسابات، سجلات محادثات. استخدمي جهازًا آمنًا للحفظ.{'\n'}
              3. <Text style={styles.documentBold}>غيّري كلمات المرور وفعّلي المصادقة الثنائية</Text> على جميع الحسابات.{'\n'}
              4. <Text style={styles.documentBold}>احظري الحسابات المسيئة وبلّغي عنها</Text> داخل المنصة.{'\n'}
              5. <Text style={styles.documentBold}>اطلبي دعمًا متخصصًا:</Text>{'\n'}
              • دعم نفسي واجتماعي (خطوط ساخنة/منظمات محلية).{'\n'}
              • دعم قانوني (محامٍ/ة، مؤسسات مسانِدة).{'\n'}
              • دعم تقني (خبير أمان رقمي/منصات مساعدة).{'\n'}
              6. <Text style={styles.documentBold}>الإبلاغ للجهات الرسمية</Text> (وحدة الجرائم الإلكترونية/النيابة العامة) وفق الإجراءات المتاحة في بلدك.{'\n'}
              7. <Text style={styles.documentBold}>حماية فورية للأجهزة:</Text> فحص برمجيات خبيثة، إلغاء جلسات تسجيل الدخول المفتوحة، مراجعة تطبيقات لديها صلاحيات زائدة، فصل النسخ الاحتياطية غير الآمنة.
            </Text>

            <Text style={styles.documentSectionTitle}>كيف نمنع التعرض مستقبلاً؟ (حزمة أدوات الأمان الرقمي)</Text>
            <Text style={styles.documentText}>
              • كلمات مرور قوية وفريدة لكل خدمة، مع مدير كلمات مرور موثوق.{'\n'}
              • المصادقة الثنائية (2FA) دائمًا (تطبيق رموز أو مفاتيح أمان).{'\n'}
              • ضبط إعدادات الخصوصية في المنصات وحصر الظهور للجمهور المناسب.{'\n'}
              • عدم فتح الروابط المجهولة أو تنزيل مرفقات غير متوقعة.{'\n'}
              • تحديثات دورية للنظام والتطبيقات والمضادّات.{'\n'}
              • مراجعة صلاحيات التطبيقات على الهاتف (الكاميرا/المايك/الموقع).{'\n'}
              • تقليل البصمة الرقمية: تجنّب مشاركة بيانات حساسة أو صور خاصة عبر أجهزة متصلة.
            </Text>

            <Text style={styles.documentSectionTitle}>تفعيل المصادقة الثنائية (2-Step/2FA)</Text>
            <Text style={styles.documentText}>
              يُفضَّل استخدام تطبيق مُوَلِّد رموز (Authenticator) بدل الرسائل النصية عند الإمكان.{'\n\n'}
              <Text style={styles.documentBold}>أ) فيسبوك (Facebook):</Text>{'\n'}
              افتحي الإعدادات والخصوصية {'>'} الإعدادات. انتقلي إلى الحماية وتسجيل الدخول. ضمن استخدام المصادقة الثنائية، اختاري تطبيق مصادقة أو رسائل نصية أو مفتاح أمان. اتبعي التعليمات لإكمال الربط واحفظي رموز الاسترجاع.{'\n\n'}
              <Text style={styles.documentBold}>ب) إنستغرام (Instagram):</Text>{'\n'}
              من الملف الشخصي {'>'} القائمة ☰ {'>'} المركز لإدارة الحسابات (Accounts Center) أو الأمان. اختاري المصادقة الثنائية. فعّلي تطبيق المصادقة أو الرسائل النصية أو واتساب حيثما يتاح. احفظي رموز الاسترجاع في مكان آمن.{'\n\n'}
              <Text style={styles.documentBold}>ج) سناب شات (Snapchat):</Text>{'\n'}
              افتحي الإعدادات في الملف الشخصي. اختاري التحقق بخطوتين/Two-Factor Authentication. فعّلي SMS ثم أضيفي تطبيق توليد الرموز كخيار احتياطي إن أمكن. أنشئي رموز الاسترداد واحتفظي بها.{'\n\n'}
              <Text style={styles.documentBold}>د) تيك توك (TikTok):</Text>{'\n'}
              الملف الشخصي ثم الإعدادات والخصوصية من ثم الأمان. ادخلي إلى التحقق بخطوتين. اختاري كلمة مرور + وسيلة ثانية (تطبيق رموز أو SMS أو بريد/إشعار، حسب المتاح في منطقتك). أكملِي الإعداد واحفظي رموز الاسترداد.{'\n\n'}
              <Text style={styles.documentBold}>تلميحات مهمة:</Text>{'\n'}
              لا تعتمِدي على رقم واحد فقط؛ أضيفي طرقًا احتياطية (تطبيق رموز + بريد احتياطي). لا تشاركي رموز المصادقة أو رموز الاسترجاع مع أي طرف.
            </Text>

            <Text style={styles.documentSectionTitle}>التنمّر الإلكتروني</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>ما هو التنمّر الإلكتروني؟</Text>{'\n'}
              سلوك عدائي متكرر يُنفَّذ عبر الوسائل الرقمية ويهدف إلى إلحاق الأذى النفسي أو الاجتماعي أو السمعة بالضحية.{'\n\n'}
              <Text style={styles.documentBold}>خطة استجابة سريعة:</Text>{'\n'}
              1. وثّقي فوراً: صور شاشة، روابط، تواريخ، أسماء الحسابات.{'\n'}
              2. أوقفي التصعيد: لا تردي على الرسائل المسيئة.{'\n'}
              3. احمي حسابك: غيّري كلمات المرور، فعّلي المصادقة الثنائية.{'\n'}
              4. احظري وبلّغي: احظري الحسابات المسيئة وبلّغي المحتوى عبر آليات المنصة.{'\n'}
              5. اطّلبي دعمًا: تحدثي مع شخص تثقين به، واطلبي مساندة نفسية أو قانونية إذا تطلب الأمر.
            </Text>

            <Text style={styles.documentSectionTitle}>انتحال الشخصية</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>ما هو انتحال الشخصية؟</Text>{'\n'}
              إنشاء حساب أو استخدام معلومات شخصية لشخص آخر بهدف الانتحال — أي التمثيل كأنك أنت الشخص الحقيقي — من أجل خداع الناس أو الإساءة أو ابتزاز أو التشهير.{'\n\n'}
              <Text style={styles.documentBold}>ماذا تفعلين فوراً لو اكتشفتِ انتحالًا؟</Text>{'\n'}
              1. وثّقي الأدلة فورًا: صور شاشة، روابط، توقيت.{'\n'}
              2. أبلغي المنصة: استخدمي آلية التبليغ واطلبي إزالة الحساب.{'\n'}
              3. أخبري الدائرة القريبة: أصدقاء/عائلة/زملاء.{'\n'}
              4. أمّني حساباتك الحقيقية: غيّري كلمات المرور، فعّلي المصادقة الثنائية.{'\n'}
              5. استشيري فنية/قانونية: خبير أمان رقمي ومحامٍ/ة أو منظمة حقوقية مختصة.
            </Text>

            <Text style={styles.documentSectionTitle}>الديب فيك (Deepfake)</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>ما هو الديب فيك؟</Text>{'\n'}
              تقنية تزييف عميق تستخدم الذكاء الاصطناعي لإخراج مقاطع مرئية جديدة أو التعديل عليها بحيث يبدو الفيديو كأنه يقوم بعرض أشياء لا تمت للواقع بصلة.{'\n\n'}
              <Text style={styles.documentBold}>مخاطر التزييف العميق:</Text>{'\n'}
              • نشر محتوى مزيف ومضلل.{'\n'}
              • ممارسة التلاعب والاحتيال.{'\n'}
              • تشويه السمعة والاعتبار.{'\n'}
              • إنجاح مخططات الابتزاز.{'\n'}
              • نشر الكراهية وتشجيع العنف.{'\n\n'}
              <Text style={styles.documentBold}>كيفية الوقاية:</Text>{'\n'}
              • تطوير آليات كشف التزييف العميق.{'\n'}
              • نشر الوعي بين الجماهير.{'\n'}
              • التأكد من المحتوى المنشور.{'\n'}
              • تجنب التعامل مع الغرباء.{'\n'}
              • الامتناع عن التردد على المواقع المشبوهة.
            </Text>

            <Text style={styles.documentSectionTitle}>سرقة الحسابات (Account Takeover)</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>ما هي سرقة الحسابات؟</Text>{'\n'}
              الوصول غير المصرح به إلى حساب رقمي بحيث يتحكم المهاجم بحسابك أو يستخدمه لإرسال رسائل/سرقة بيانات/ابتزاز.{'\n\n'}
              <Text style={styles.documentBold}>علامات تدل أن حسابك مخترق:</Text>{'\n'}
              • نشاط/رسائل لم تقومي بها.{'\n'}
              • تغيير كلمة المرور أو البريد دون علمك.{'\n'}
              • إشعارات تسجيل دخول من أماكن/أجهزة غريبة.{'\n'}
              • فقدان الوصول للحساب.{'\n\n'}
              <Text style={styles.documentBold}>ماذا تفعلين فوراً إذا اشتبهتِ بالاختراق؟</Text>{'\n'}
              1. افصلي الأجهزة عن الإنترنت مؤقتًا.{'\n'}
              2. وثّقي الأدلة: صور شاشة لإشعارات الدخول.{'\n'}
              3. غيّري كلمة المرور فورًا للحساب المتأثر ولكل الحسابات الأخرى.{'\n'}
              4. فعّلي المصادقة الثنائية القوية.{'\n'}
              5. افحصي جهازك ببرنامج مضادّ برمجيات خبيثة.{'\n'}
              6. سجّلي الخروج من كل جلسات الدخول.{'\n'}
              7. أبلغي المنصة عن الاختراق.{'\n'}
              8. استشيري جهة قانونية أو وحدة الجرائم الإلكترونية إذا حصل سرق أموال أو ابتزاز.
            </Text>

            <Text style={styles.documentSectionTitle}>أهم 3 معلومات لا يجب مشاركتها على الإنترنت</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>1. المعلومات الشخصية الحساسة:</Text>{'\n'}
              تجنبي نشر نسخ من بطاقة الهوية، جواز السفر، العنوان، رقم الهاتف، تاريخ الميلاد الكامل، أو بيانات الحساب البنكي.{'\n\n'}
              <Text style={styles.documentBold}>2. معلومات العمل:</Text>{'\n'}
              لا تشاركي تفاصيل العمل أو مشاريع الشركة أو المنتجات الجديدة على الإنترنت.{'\n\n'}
              <Text style={styles.documentBold}>3. الموقع الجغرافي:</Text>{'\n'}
              تجنبي نشر موقعك بشكل مستمر لأنه قد يعرضك للخطر.
            </Text>

            <Text style={styles.documentSectionTitle}>كيف نحتوي شخص تعرض للتنمّر أو الابتزاز؟</Text>
            <Text style={styles.documentText}>
              1. <Text style={styles.documentBold}>الاستماع والتواجد العاطفي:</Text> خلي الشخص يعرف أنه ليس وحيدًا.{'\n'}
              2. <Text style={styles.documentBold}>التحقق من الحالة النفسية:</Text> لاحظي علامات التوتر أو القلق.{'\n'}
              3. <Text style={styles.documentBold}>إزالة شعور اللوم:</Text> ذكّريها أن المسؤولية على المعتدي وليس الضحية.{'\n'}
              4. <Text style={styles.documentBold}>وضع خطة عملية:</Text> توثيق الأدلة، حماية الحسابات، الإبلاغ.{'\n'}
              5. <Text style={styles.documentBold}>الدعم النفسي والتواصل المستمر:</Text> متابعة الضحية بعد الإجراءات التقنية.{'\n'}
              6. <Text style={styles.documentBold}>تعزيز الثقة والتمكين:</Text> ذكّريها بحقوقها الرقمية وقدرتها على حماية نفسها.{'\n'}
              7. <Text style={styles.documentBold}>البيئة المحيطة والدعم الاجتماعي:</Text> إشراك أفراد موثوقين إذا أراد الشخص ذلك.
            </Text>

            <Text style={styles.documentSectionTitle}>✅ أفعل / ❌ لا تفعل</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>✅ أفعل:</Text>{'\n'}
              • وثّقي الأدلة: صور شاشة، روابط، تواريخ.{'\n'}
              • فعّلي المصادقة الثنائية واستخدمي كلمات مرور قوية.{'\n'}
              • احظري المبتز وبلّغي عنه عبر المنصة.{'\n'}
              • اطلبي دعم قانوني، نفسي أو تقني.{'\n'}
              • أبلغي وحدة الجرائم الإلكترونية عند الحاجة.{'\n\n'}
              <Text style={styles.documentBold}>❌ لا تفعل:</Text>{'\n'}
              • لا تحذفي الأدلة حتى لو كان المحتوى حساسًا.{'\n'}
              • لا تشاركي كلمات المرور أو رموز الاسترجاع.{'\n'}
              • لا تدخلي في حوار مع المبتز بعد أول تهديد.{'\n'}
              • لا ترسلي أي أموال أو محتوى إضافي.{'\n'}
              • لا تضغطي على روابط أو مرفقات مشبوهة.{'\n'}
              • لا تلومي نفسك – المسؤولية دائمًا على المعتدي.
            </Text>

            <Text style={styles.documentSectionTitle}>الإطار القانوني المحلي (فلسطين)</Text>
            <Text style={styles.documentText}>
              <Text style={styles.documentBold}>قانون الجرائم الإلكترونية (قانون العقوبات المعدل 2017):</Text>{'\n'}
              يعاقب على الاختراق غير المصرح به، سرقة البيانات، الابتزاز الرقمي، والتشهير عبر الإنترنت. يجرّم نشر الصور/الفيديوهات الخاصة دون إذن.{'\n\n'}
              <Text style={styles.documentBold}>قوانين حماية النساء والأطفال:</Text>{'\n'}
              تحمي من التحرش والاعتداء الجنسي والعنف الأسري. تشمل عقوبات على الابتزاز الجنسي والعاطفي عبر الإنترنت.{'\n\n'}
              <Text style={styles.documentBold}>نصيحة:</Text> دوّني كل الأدلة قبل التوجه للجهات القانونية، واحرصي على استشارة محامٍ/محامية متخصص/ة بالجرائم الإلكترونية.
            </Text>

            <Text style={styles.documentSectionTitle}>الخاتمة</Text>
            <Text style={styles.documentText}>
              يمثل العنف الرقمي القائم على النوع الاجتماعي خطراً متزايداً يهدد السلامة النفسية والاجتماعية للنساء والفتيات في فلسطين. مواجهته تتطلب وعيًا جماعيًا، تشريعات واضحة، تدريب كوادر متخصصة، وتعزيز مهارات الحماية الرقمية لدى الفئات الأكثر عرضة. نشر الثقافة الرقمية الآمنة هو خط الدفاع الأول لحماية مجتمع أكثر عدلاً وأماناً.
            </Text>

            <Text style={styles.documentSectionTitle}>للحصول على المساعدة:</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={openPalPoliceLink}
            >
              <Text style={styles.linkButtonText}>
                زيارة موقع الشرطة الفلسطينية - وحدة الجرائم الإلكترونية
              </Text>
              <MaterialIcons name="open-in-new" size={18} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "flex-end",
  },
  logoutButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D90000",
    shadowColor: "#D90000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
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
    borderWidth: 4,
    borderColor: "#00A3A3",
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#38B000",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#00A3A3",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: "400",
    color: "#333333",
  },
  aiSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    borderWidth: 2,
    borderColor: "#00A3A3",
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
    borderWidth: 3,
    borderColor: "#00A3A3",
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  aiInfo: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  aiStatus: {
    fontSize: 14,
    fontWeight: "400",
    color: "#333333",
  },
  aiStatusActive: {
    color: "#00A3A3",
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "#E5E5E5",
    opacity: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  safetySection: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    borderWidth: 2,
    borderColor: "#00A3A3",
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    color: "#000000",
  },
  safetyCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#00A3A3",
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  safetyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  safetyCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00A3A3",
  },
  safetyCardText: {
    flex: 1,
  },
  safetyCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  safetyCardSubtitle: {
    fontSize: 13,
    color: "#333333",
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 2,
    borderBottomColor: "#00A3A3",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00A3A3",
  },
  modalCloseText: {
    color: "#000000",
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
    color: "#000000",
    marginBottom: 20,
    textAlign: "right",
    lineHeight: 28,
  },
  documentText: {
    fontSize: 15,
    color: "#333333",
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "right",
  },
  documentSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00A3A3",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "right",
  },
  linkButton: {
    backgroundColor: "#00A3A3",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: "#00A3A3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  documentNote: {
    fontSize: 13,
    color: "#333333",
    fontStyle: "italic",
    marginTop: 20,
    textAlign: "right",
  },
  documentBold: {
    fontWeight: "700",
    color: "#000000",
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