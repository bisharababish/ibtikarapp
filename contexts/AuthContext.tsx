import { getOAuthStartUrl, getTwitterUser } from "@/utils/api";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import createContextHook from "@nkzw/create-context-hook";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Alert, Platform } from "react-native";

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
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    const redirectUri = "ibtikar://oauth/callback";

    // Handle OAuth callback
    const handleCallback = useCallback(async (url: string) => {
        try {
            console.log("=".repeat(80));
            console.log("🔗 STEP 6: OAuth callback received");
            console.log("   URL:", url);
            console.log("=".repeat(80));
            
            // Show alert that callback is being processed
            if (Platform.OS !== "web") {
                Alert.alert("✅ Callback Received", "Processing OAuth callback...");
            }
            
            // Parse URL manually (deep links like ibtikar://oauth/callback?success=true&user_id=1)
            if (!url.startsWith("ibtikar://") || !url.includes("oauth/callback")) {
                console.log("⚠️ Invalid callback URL format");
                console.log("   Expected: ibtikar://oauth/callback?...");
                console.log("   Got:", url);
                return;
            }

            console.log("✅ STEP 7: Valid callback URL format");

            // Extract query string
            const queryString = url.split("?")[1] || "";
            const params: Record<string, string> = {};
            queryString.split("&").forEach((param) => {
                const [key, value] = param.split("=");
                if (key && value) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                }
            });

            console.log("📋 STEP 8: Parsed callback parameters");
            console.log("   Params:", JSON.stringify(params, null, 2));

            const success = params.success === "true";
            const userId = params.user_id;
            const error = params.error;

            if (error === "access_denied") {
                console.log("❌ STEP 9: User denied access");
                setIsLoggingIn(false);
                return;
            }

            if (!success || !userId) {
                console.log("❌ STEP 9: Callback missing success or user_id");
                console.log("   Success:", success);
                console.log("   User ID:", userId);
                setIsLoggingIn(false);
                return;
            }

            const userIdNum = parseInt(userId || "0", 10);

            if (isNaN(userIdNum)) {
                console.log("❌ STEP 9: Invalid user_id:", userId);
                setIsLoggingIn(false);
                return;
            }

            console.log("✅ STEP 9: Callback validated");
            console.log("   User ID:", userIdNum);
            console.log("📡 STEP 10: Fetching user data from backend...");

            // Get user data
            const response = await getTwitterUser(userIdNum);
            const userData = response?.data;

            console.log("✅ STEP 11: User data received");
            console.log("   User data:", JSON.stringify(userData, null, 2));

            if (userData?.name) {
                const newUser = {
                    id: userIdNum,
                    name: userData.name,
                    username: userData.username,
                    email: `${userData.username || `user${userIdNum}`}@twitter.com`,
                    profileImageUrl: userData.profile_image_url,
                };
                console.log("✅ STEP 12: Setting user state");
                console.log("   User:", JSON.stringify(newUser, null, 2));
                setUser(newUser);
                setIsActive(false);
            } else {
                const newUser = {
                    id: userIdNum,
                    name: `User ${userIdNum}`,
                    email: `user${userIdNum}@example.com`,
                };
                console.log("✅ STEP 12: Setting user state (fallback)");
                console.log("   User:", JSON.stringify(newUser, null, 2));
                setUser(newUser);
                setIsActive(false);
            }

            setIsLoggingIn(false);
            console.log("=".repeat(80));
            console.log("✅ STEP 13: Login complete!");
            console.log("   User state has been set");
            console.log("   User ID:", userIdNum);
            console.log("   User Name:", userData?.name || `User ${userIdNum}`);
            console.log("   Redirect should happen automatically via useEffect in LoginScreen");
            console.log("=".repeat(80));
            
            // Show success alert
            if (Platform.OS !== "web") {
                Alert.alert("✅ Login Successful!", `Welcome ${userData?.name || `User ${userIdNum}`}!`);
            }
        } catch (error) {
            console.log("=".repeat(80));
            console.error("❌ Callback error:", error);
            console.log("=".repeat(80));
            setIsLoggingIn(false);
        }
    }, []);

    // Listen for deep links
    useEffect(() => {
        console.log("🔗 Setting up deep link listeners...");
        
        Linking.getInitialURL().then((url) => {
            if (url) {
                console.log("=".repeat(80));
                console.log("🔗 Initial deep link detected (app opened via deep link)");
                console.log("   URL:", url);
                console.log("=".repeat(80));
                handleCallback(url);
            } else {
                console.log("ℹ️ No initial deep link");
            }
        });

        const subscription = Linking.addEventListener("url", (event) => {
            console.log("=".repeat(80));
            console.log("🔗 Deep link event received (app already running)");
            console.log("   URL:", event.url);
            console.log("   This should process the OAuth callback");
            console.log("=".repeat(80));
            // Reset login state when deep link is received
            if (event.url.includes("oauth/callback")) {
                console.log("✅ OAuth callback detected in deep link");
                // Show alert to confirm deep link was received
                if (Platform.OS !== "web") {
                    Alert.alert("🔗 Deep Link Received", `Callback URL: ${event.url.substring(0, 50)}...`);
                }
                // Reset login state immediately when callback is received
                setIsLoggingIn(false);
            }
            handleCallback(event.url);
        });

        return () => {
            subscription.remove();
        };
    }, [handleCallback]);
    
    // Periodically check if we're stuck in login state (every 5 seconds while logging in)
    useEffect(() => {
        if (!isLoggingIn) return;
        
        const checkInterval = setInterval(() => {
            console.log("⏳ Still logging in... waiting for callback");
            console.log("   If you completed authorization, check your backend logs");
            console.log("   The deep link should trigger automatically");
        }, 5000);
        
        return () => clearInterval(checkInterval);
    }, [isLoggingIn]);

    // Simple login function - works for any Twitter account
    const loginWithTwitter = useCallback(async () => {
        if (isLoggingIn) {
            console.log("⚠️ Login already in progress, ignoring request");
            return;
        }

        console.log("=".repeat(80));
        console.log("🚀 STEP 1: Starting Twitter login...");
        console.log("=".repeat(80));
        
        setIsLoggingIn(true);

        // Set a timeout to reset login state if it takes too long (30 seconds)
        const timeoutId = setTimeout(() => {
            console.log("⏰ Login timeout - resetting login state");
            console.log("   If you completed authorization, the deep link should still work");
            setIsLoggingIn(false);
        }, 30000);

        try {
            // Get OAuth URL from backend (backend handles user creation and uses force_login=true)
            console.log("📡 STEP 2: Getting OAuth URL from backend...");
            const oauthUrl = getOAuthStartUrl("1");
            console.log("✅ OAuth URL received:", oauthUrl);
            console.log("📱 STEP 3: Opening OAuth session in browser...");
            console.log("   Redirect URI:", redirectUri);
            console.log("   ⚠️ After authorizing, you should be redirected back automatically");
            console.log("   ⚠️ If stuck, the deep link listener will catch the callback");

            // Open OAuth in app browser
            const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);
            
            clearTimeout(timeoutId);
            
            console.log("=".repeat(80));
            console.log("📱 STEP 4: OAuth session result received");
            console.log("   Result type:", result.type);
            console.log("   URL present:", result.url ? "Yes" : "No");
            if (result.url) {
                console.log("   Callback URL:", result.url);
            }
            console.log("=".repeat(80));

            // Handle result
            if (result.type === "success" && result.url) {
                console.log("✅ STEP 5: OAuth success, processing callback...");
                await handleCallback(result.url);
            } else if (result.type === "cancel" || result.type === "dismiss") {
                // User cancelled the OAuth flow
                console.log("❌ STEP 5: User cancelled OAuth");
                console.log("   Result type:", result.type);
                setIsLoggingIn(false);
            } else {
                // Other result types - still try to handle callback if URL exists
                if (result.url) {
                    console.log("⚠️ STEP 5: Unexpected result type but URL exists, processing callback...");
                    console.log("   Result type:", result.type);
                    await handleCallback(result.url);
            } else {
                console.log("⚠️ STEP 5: No URL in result, but deep link listener should catch it");
                console.log("   Result type:", result.type);
                console.log("   Waiting for deep link...");
                // Show alert that we're waiting for deep link
                if (Platform.OS !== "web") {
                    Alert.alert(
                        "⏳ Waiting for Callback",
                        "OAuth completed but waiting for deep link callback. If you authorized, the callback should arrive soon.",
                        [{ text: "OK" }]
                    );
                }
                // Don't set isLoggingIn to false here - let the deep link handler do it
                // The deep link listener will catch the callback when it arrives
            }
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.log("=".repeat(80));
            console.error("❌ Login error:", error);
            console.log("=".repeat(80));
            setIsLoggingIn(false);
        }
    }, [handleCallback, isLoggingIn, redirectUri]);

    const logout = useCallback(() => {
        console.log("🚪 Logging out user");
        setUser(null);
        setIsActive(false);
        setIsLoggingIn(false); // Reset login state on logout
    }, []);
    
    const cancelLogin = useCallback(() => {
        console.log("❌ Cancelling login");
        setIsLoggingIn(false);
    }, []);

    const toggleActive = useCallback(() => {
        setIsActive((prev) => !prev);
    }, []);

    return useMemo(
        () => ({
            user,
            isActive,
            isLoggingIn,
            loginWithTwitter,
            logout,
            toggleActive,
            cancelLogin,
        }),
        [user, isActive, isLoggingIn, loginWithTwitter, logout, toggleActive, cancelLogin]
    );
});

