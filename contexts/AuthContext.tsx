import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Linking } from "react-native";
import * as LinkingExpo from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { getOAuthStartUrl, getTwitterUser } from "@/utils/api";

// Make sure WebBrowser closes properly after OAuth
WebBrowser.maybeCompleteAuthSession();

interface User {
    id: number;
    name: string;
    email: string;
    username?: string;
    profileImageUrl?: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [user, setUser] = useState<User | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);

    // Handle deep link callbacks from OAuth
    useEffect(() => {
        // Handle initial URL (when app is opened via deep link)
        LinkingExpo.getInitialURL().then((url) => {
            if (url) {
                handleOAuthCallback(url);
            }
        });

        // Listen for deep links while app is running
        // Using React Native's Linking API for event listener
        const subscription = Linking.addEventListener("url", (event) => {
            handleOAuthCallback(event.url);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const handleOAuthCallback = useCallback(async (url: string) => {
        try {
            console.log("🔗 Received deep link:", url);
            const parsed = LinkingExpo.parse(url);
            console.log("📦 Parsed URL:", JSON.stringify(parsed, null, 2));
            
            // Handle different URL formats: ibtikar://oauth/callback or ibtikar:///oauth/callback
            const isOAuthCallback = 
                parsed.scheme === "ibtikar" && 
                (parsed.path === "oauth/callback" || 
                 parsed.path === "/oauth/callback" ||
                 parsed.hostname === "oauth" ||
                 url.includes("oauth/callback"));
            
            if (isOAuthCallback) {
                const success = parsed.queryParams?.success === "true";
                const userId = parsed.queryParams?.user_id;
                const error = parsed.queryParams?.error;
                
                console.log("✅ OAuth callback detected:", { success, userId, error });
                
                if (success && userId) {
                    // OAuth successful - fetch real Twitter user info
                    const userIdNum = parseInt(userId, 10);
                    try {
                        console.log("📞 Fetching Twitter user data for user_id:", userIdNum);
                        const twitterUser = await getTwitterUser(userIdNum);
                        console.log("📦 Twitter API response:", JSON.stringify(twitterUser, null, 2));
                        
                        // Check if rate limited
                        if (twitterUser?.rate_limited) {
                            console.warn("⚠️ Twitter API rate limited, using fallback");
                            setUser({
                                id: userIdNum,
                                name: `User ${userId}`,
                                email: `user${userId}@example.com`,
                            });
                            setIsActive(true);
                            return;
                        }
                        
                        const userData = twitterUser?.data;
                        console.log("👤 User data extracted:", userData);
                        
                        if (userData && userData.name) {
                            setUser({
                                id: userIdNum,
                                name: userData.name,
                                username: userData.username,
                                email: `${userData.username || `user${userId}`}@twitter.com`,
                                profileImageUrl: userData.profile_image_url,
                            });
                            setIsActive(true);
                            console.log("🎉 Login successful for user:", userId, userData.name);
                        } else {
                            // API returned but data is missing
                            console.warn("⚠️ Twitter user data missing or invalid:", {
                                hasUserData: !!userData,
                                hasName: !!(userData?.name),
                                fullResponse: twitterUser
                            });
                            setUser({
                                id: userIdNum,
                                name: `User ${userId}`,
                                email: `user${userId}@example.com`,
                            });
                            setIsActive(true);
                        }
                    } catch (err) {
                        console.error("❌ Failed to fetch Twitter user:", err);
                        console.error("❌ Error details:", err instanceof Error ? err.message : JSON.stringify(err, null, 2));
                        // Fallback to basic user info
                        setUser({
                            id: userIdNum,
                            name: `User ${userId}`,
                            email: `user${userId}@example.com`,
                        });
                        setIsActive(true);
                    }
                } else if (error) {
                    // Handle access_denied gracefully - user cancelled to switch accounts
                    if (error === "access_denied") {
                        console.log("ℹ️ User cancelled OAuth (likely to switch accounts). You can try again.");
                        // Don't show as error - user can retry
                    } else {
                        console.error("❌ OAuth error:", error);
                        // Handle error - show error message to user
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error handling OAuth callback:", error);
        }
    }, []);

    const loginWithTwitter = useCallback(async () => {
        try {
            // Use expo-web-browser for better OAuth handling
        const url = getOAuthStartUrl("1"); // Replace with real user id when available
            console.log("🔐 Opening OAuth URL:", url);
            
            // Open in browser and wait for redirect
            const result = await WebBrowser.openAuthSessionAsync(
                url,
                "ibtikar://oauth/callback"
            );
            
            console.log("🔗 OAuth result:", result);
            
            if (result.type === "success" && result.url) {
                // Handle the callback URL
                const parsed = LinkingExpo.parse(result.url);
                const success = parsed.queryParams?.success === "true";
                const userId = parsed.queryParams?.user_id;
                const error = parsed.queryParams?.error;
                
                if (success && userId) {
                    // OAuth successful - fetch real Twitter user info
                    const userIdNum = parseInt(userId, 10);
                    try {
                        console.log("📞 Fetching Twitter user data for user_id:", userIdNum);
                        const twitterUser = await getTwitterUser(userIdNum);
                        console.log("📦 Twitter API response:", JSON.stringify(twitterUser, null, 2));
                        
                        // Check if rate limited
                        if (twitterUser?.rate_limited) {
                            console.warn("⚠️ Twitter API rate limited, using fallback");
                            setUser({
                                id: userIdNum,
                                name: `User ${userId}`,
                                email: `user${userId}@example.com`,
                            });
                            setIsActive(true);
                            return;
                        }
                        
                        const userData = twitterUser?.data;
                        console.log("👤 User data extracted:", userData);
                        
                        if (userData && userData.name) {
                            setUser({
                                id: userIdNum,
                                name: userData.name,
                                username: userData.username,
                                email: `${userData.username || `user${userId}`}@twitter.com`,
                                profileImageUrl: userData.profile_image_url,
                            });
                            setIsActive(true);
                            console.log("🎉 Login successful for user:", userId, userData.name);
                        } else {
                            // API returned but data is missing
                            console.warn("⚠️ Twitter user data missing or invalid:", {
                                hasUserData: !!userData,
                                hasName: !!(userData?.name),
                                fullResponse: twitterUser
                            });
                            setUser({
                                id: userIdNum,
                                name: `User ${userId}`,
                                email: `user${userId}@example.com`,
                            });
                            setIsActive(true);
                        }
                    } catch (err) {
                        console.error("❌ Failed to fetch Twitter user:", err);
                        console.error("❌ Error details:", err instanceof Error ? err.message : JSON.stringify(err, null, 2));
                        // Fallback to basic user info
                        setUser({
                            id: userIdNum,
                            name: `User ${userId}`,
                            email: `user${userId}@example.com`,
                        });
                        setIsActive(true);
                    }
                } else if (error) {
                    // Handle access_denied gracefully - user cancelled to switch accounts
                    if (error === "access_denied") {
                        console.log("ℹ️ User cancelled OAuth (likely to switch accounts). You can try again.");
                        // Don't show as error - user can retry
                    } else {
                        console.error("❌ OAuth error:", error);
                    }
                }
            } else if (result.type === "cancel") {
                console.log("ℹ️ User cancelled OAuth. You can try again with a different account.");
            } else {
                console.log("⚠️ OAuth result type:", result.type);
            }
        } catch (error) {
            console.error("❌ Failed to open OAuth URL:", error);
            // Fallback to regular Linking if WebBrowser fails
            const url = getOAuthStartUrl("1");
            Linking.openURL(url).catch((err) => {
                console.error("❌ Fallback Linking also failed:", err);
        });
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setIsActive(false);
    }, []);

    const toggleActive = useCallback(() => {
        setIsActive((prev) => !prev);
    }, []);

    return useMemo(
        () => ({
            user,
            isActive,
            loginWithTwitter,
            logout,
            toggleActive,
        }),
        [user, isActive, loginWithTwitter, logout, toggleActive]
    );
});
