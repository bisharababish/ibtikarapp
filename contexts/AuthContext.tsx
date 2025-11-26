import { checkLinkStatus, getOAuthStartUrl, getTwitterUser } from "@/utils/api";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import createContextHook from "@nkzw/create-context-hook";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

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
    const [pollingStatus, setPollingStatus] = useState<string>("");

    // Track if we're processing a callback to prevent duplicates
    const processingCallback = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use different redirect URI for web vs mobile
    const redirectUri = Platform.OS === "web"
        ? (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "http://localhost:8081")
        : "ibtikar://oauth/callback";

    // Handle OAuth callback
    const handleCallback = useCallback(async (url: string) => {
        // Prevent duplicate processing
        if (processingCallback.current) {
            console.log("⚠️ Already processing a callback, skipping duplicate");
            return;
        }

        try {
            processingCallback.current = true;

            console.log("=".repeat(80));
            console.log("🔗 STEP 6: OAuth callback received");
            console.log("   URL:", url);
            console.log("=".repeat(80));

            // Show alert that callback is being processed (mobile only)
            if (Platform.OS !== "web") {
                Alert.alert("✅ Callback Received", "Processing OAuth callback...");
            }

            // Parse URL - handle both ibtikar:// and web URLs
            let params: Record<string, string> = {};

            // For ibtikar:// URLs
            if (url.startsWith("ibtikar://")) {
                if (!url.includes("oauth/callback")) {
                    console.log("⚠️ Invalid callback URL format");
                    return;
                }
                const queryString = url.split("?")[1] || "";
                queryString.split("&").forEach((param) => {
                    const [key, value] = param.split("=");
                    if (key && value) {
                        params[decodeURIComponent(key)] = decodeURIComponent(value);
                    }
                });
            }
            // For web URLs (http://... or https://...)
            else if (url.startsWith("http://") || url.startsWith("https://")) {
                const urlObj = new URL(url);
                urlObj.searchParams.forEach((value, key) => {
                    params[key] = value;
                });
            }
            // For direct param objects (from web callback)
            else {
                console.log("⚠️ Unexpected URL format:", url);
                return;
            }

            console.log("✅ STEP 7: Valid callback URL format");
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

            // Clear timeout and reset login state
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setIsLoggingIn(false);
            setPollingStatus("");

            console.log("=".repeat(80));
            console.log("✅ STEP 13: Login complete!");
            console.log("   User state has been set");
            console.log("   User ID:", userIdNum);
            console.log("   User Name:", userData?.name || `User ${userIdNum}`);
            console.log("   Redirect should happen automatically via useEffect in LoginScreen");
            console.log("=".repeat(80));

            // Show success alert (mobile only)
            if (Platform.OS !== "web") {
                Alert.alert("✅ Login Successful!", `Welcome ${userData?.name || `User ${userIdNum}`}!`);
            }
        } catch (error) {
            console.log("=".repeat(80));
            console.error("❌ Callback error:", error);
            console.log("=".repeat(80));
            setIsLoggingIn(false);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        } finally {
            processingCallback.current = false;
        }
    }, []);

    // On web, check URL parameters on page load (for OAuth callback)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const checkWebCallback = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const success = urlParams.get("success");
            const userId = urlParams.get("user_id");

            console.log("🌐 Web: Checking URL params on page load");
            console.log("   Success:", success);
            console.log("   User ID:", userId);
            console.log("   Full URL:", window.location.href);

            // Check if we're coming back from OAuth (URL has success/user_id params)
            if (success === "true" && userId) {
                console.log("🌐 Web: Found OAuth callback params!");
                console.log("   Processing callback with URL params");

                // Process callback with full URL
                handleCallback(window.location.href);

                // Clean up URL immediately after processing
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };

        // Check on mount and after a short delay (in case params load async)
        checkWebCallback();
        const delayedCheck = setTimeout(checkWebCallback, 100);

        return () => clearTimeout(delayedCheck);
    }, [handleCallback]);

    // Listen for deep links (mobile)
    useEffect(() => {
        if (Platform.OS === "web") return; // Skip for web

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
            console.log("=".repeat(80));

            // Reset login state when deep link is received
            if (event.url.includes("oauth/callback")) {
                console.log("✅ OAuth callback detected in deep link");
                if (Platform.OS !== "web") {
                    Alert.alert("🔗 Deep Link Received", `Processing callback...`);
                }
            }
            handleCallback(event.url);
        });

        return () => {
            subscription.remove();
        };
    }, [handleCallback]);

    // Simple login function
    const loginWithTwitter = useCallback(async () => {
        if (isLoggingIn) {
            console.log("⚠️ Login already in progress, ignoring request");
            return;
        }

        console.log("=".repeat(80));
        console.log("🚀 STEP 1: Starting Twitter login...");
        console.log("=".repeat(80));

        setIsLoggingIn(true);
        setPollingStatus("");

        // Set a timeout to reset login state if it takes too long
        timeoutRef.current = setTimeout(() => {
            console.log("⏰ Login timeout - resetting login state");
            setIsLoggingIn(false);
            timeoutRef.current = null;
        }, 30000);

        try {
            // Get OAuth URL from backend
            console.log("📡 STEP 2: Getting OAuth URL from backend...");
            const oauthUrl = getOAuthStartUrl("1");
            console.log("✅ OAuth URL received:", oauthUrl);
            console.log("📱 STEP 3: Opening OAuth session in browser...");
            console.log("   Redirect URI:", redirectUri);

            // Check if we're on web
            const isWeb = Platform.OS === "web" || (typeof window !== "undefined" && typeof window.location !== "undefined");

            if (isWeb) {
                console.log("🌐 Web platform detected: Using direct redirect");
                console.log("   OAuth URL:", oauthUrl);

                if (typeof window !== "undefined" && window.location) {
                    // IMPORTANT: Don't clear timeout here - let the callback handler do it
                    window.location.href = oauthUrl;
                    // Function returns here - callback will be handled by URL params on return
                    return;
                } else {
                    console.error("❌ Window.location not available!");
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    setIsLoggingIn(false);
                    throw new Error("Window.location not available for web redirect");
                }
            }

            // MOBILE FLOW: Use auth session
            console.log("📱 Mobile platform: Using auth session");

            let result;
            try {
                result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);
            } catch (error) {
                console.error("❌ Error opening auth session:", error);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                setIsLoggingIn(false);
                setPollingStatus("");
                Alert.alert("❌ Error", "Failed to open Twitter login. Please try again.");
                return;
            }

            console.log("=".repeat(80));
            console.log("📱 STEP 4: OAuth session result received");
            console.log("   Result type:", result.type);
            console.log("=".repeat(80));

            // Handle result
            if (result.type === "success" && result.url) {
                console.log("✅ STEP 5: OAuth success, processing callback...");
                await handleCallback(result.url);
            } else if (result.type === "cancel" || result.type === "dismiss") {
                console.log("❌ STEP 5: User cancelled OAuth");
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                setIsLoggingIn(false);
                setPollingStatus("");
            } else {
                // Fallback: Start polling
                console.log("⚠️ STEP 5: Starting polling fallback...");
                setPollingStatus("Checking if account is linked...");

                // Check immediately first
                try {
                    const immediateCheck = await checkLinkStatus(1);
                    if (immediateCheck.linked) {
                        console.log("✅ Immediate check: Account is linked!");
                        await handleCallback(`ibtikar://oauth/callback?success=true&user_id=1`);
                        return;
                    }
                } catch (e) {
                    console.error("❌ Immediate check failed:", e);
                }

                Alert.alert(
                    "✅ Authorization Complete",
                    "If you completed authorization, click the GREEN BUTTON to check status.",
                    [{ text: "OK" }]
                );

                // Start polling
                let pollCount = 0;
                const maxPolls = 30;

                const pollInterval = setInterval(async () => {
                    pollCount++;
                    setPollingStatus(`Checking... (${pollCount}s)`);

                    try {
                        const linkStatus = await checkLinkStatus(1);

                        if (linkStatus.linked) {
                            console.log("✅ Account is linked! Processing login...");
                            setPollingStatus("✅ Account linked! Logging in...");
                            clearInterval(pollInterval);
                            Alert.alert("✅ Account Linked!", "Logging you in...");
                            await handleCallback(`ibtikar://oauth/callback?success=true&user_id=1`);
                        } else if (pollCount >= maxPolls) {
                            console.log("⏰ Polling timeout");
                            setPollingStatus("❌ Timeout - Click GREEN BUTTON");
                            clearInterval(pollInterval);
                        }
                    } catch (error) {
                        console.error("❌ Error checking link status:", error);
                        if (pollCount >= maxPolls) {
                            clearInterval(pollInterval);
                        }
                    }
                }, 1000);
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setIsLoggingIn(false);
            setPollingStatus("");
        }
    }, [handleCallback, isLoggingIn, redirectUri]);

    const logout = useCallback(() => {
        console.log("🚪 Logging out user");
        setUser(null);
        setIsActive(false);
        setIsLoggingIn(false);
        setPollingStatus("");
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const cancelLogin = useCallback(() => {
        console.log("❌ Cancelling login");
        setIsLoggingIn(false);
        setPollingStatus("");
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const manualCheckStatus = useCallback(async () => {
        console.log("🔍 Manual status check triggered");
        setPollingStatus("Checking...");

        try {
            const linkStatus = await checkLinkStatus(1);
            console.log("📊 Manual check - Link status:", JSON.stringify(linkStatus, null, 2));

            if (linkStatus.linked) {
                setPollingStatus("✅ Account linked! Logging in...");
                Alert.alert("✅ Account Linked!", "Logging you in...");
                await handleCallback(`ibtikar://oauth/callback?success=true&user_id=1`);
            } else {
                setPollingStatus("❌ Not linked yet");
                Alert.alert(
                    "❌ Not Linked Yet",
                    "Make sure you clicked 'Authorize' on Twitter, then try again.",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            setPollingStatus(`❌ Error: ${error}`);
            console.error("❌ Manual check error:", error);
            Alert.alert("❌ Error", `Failed to check status: ${error}`);
        }
    }, [handleCallback]);

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
            pollingStatus,
            manualCheckStatus,
        }),
        [user, isActive, isLoggingIn, loginWithTwitter, logout, toggleActive, cancelLogin, pollingStatus, manualCheckStatus]
    );
});