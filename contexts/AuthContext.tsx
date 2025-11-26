import { getOAuthStartUrl, getTwitterUser, checkLinkStatus } from "@/utils/api";
import createContextHook from "@nkzw/create-context-hook";
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
    const [pollingStatus, setPollingStatus] = useState<string>("");

    const redirectUri = Platform.OS === "web" 
        ? (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "http://localhost:8081")
        : "ibtikar://oauth/callback";

    // Simple callback handler
    const handleCallback = useCallback(async (url: string) => {
        try {
            console.log("🔗 Processing callback:", url);
            
            // Parse URL
            const urlObj = new URL(url.replace("ibtikar://", "http://"));
            const success = urlObj.searchParams.get("success") === "true";
            const userId = urlObj.searchParams.get("user_id");
            const error = urlObj.searchParams.get("error");

            if (error) {
                console.log("❌ OAuth error:", error);
                setIsLoggingIn(false);
                Alert.alert("❌ Login Failed", `Error: ${error}`);
                return;
            }

            if (!success || !userId) {
                console.log("❌ Missing success or user_id");
                setIsLoggingIn(false);
                return;
            }

            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                console.log("❌ Invalid user_id");
                setIsLoggingIn(false);
                return;
            }

            console.log("📡 Fetching user data for ID:", userIdNum);
            const response = await getTwitterUser(userIdNum);
            const userData = response?.data;

            if (userData?.name) {
                setUser({
                    id: userIdNum,
                    name: userData.name,
                    username: userData.username,
                    email: `${userData.username || `user${userIdNum}`}@twitter.com`,
                    profileImageUrl: userData.profile_image_url,
                });
            } else {
                setUser({
                    id: userIdNum,
                    name: `User ${userIdNum}`,
                    email: `user${userIdNum}@example.com`,
                });
            }

            setIsLoggingIn(false);
            setPollingStatus("");
            setIsActive(false);
            console.log("✅ Login complete!");
        } catch (error) {
            console.error("❌ Callback error:", error);
            setIsLoggingIn(false);
            setPollingStatus("");
            Alert.alert("❌ Error", "Failed to complete login. Please try again.");
        }
    }, []);

    // Check URL params on web
    useEffect(() => {
        if (Platform.OS === "web" && typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const success = params.get("success");
            const userId = params.get("user_id");
            if (success === "true" && userId) {
                handleCallback(`ibtikar://oauth/callback?success=true&user_id=${userId}`);
                window.history.replaceState({}, "", window.location.pathname);
            }
        }
    }, [handleCallback]);

    // Listen for deep links
    useEffect(() => {
        const handleDeepLink = (url: string | null) => {
            if (url && url.includes("oauth/callback")) {
                console.log("🔗 Deep link received:", url);
                handleCallback(url);
            }
        };

        Linking.getInitialURL().then(handleDeepLink);
        const subscription = Linking.addEventListener("url", (event) => handleDeepLink(event.url));

        return () => subscription.remove();
    }, [handleCallback]);

    // Simple login function
    const loginWithTwitter = useCallback(async () => {
        if (isLoggingIn) return;

        console.log("🚀 Starting Twitter login...");
        setIsLoggingIn(true);
        setPollingStatus("Opening Twitter...");

        try {
            const oauthUrl = getOAuthStartUrl("1");
            console.log("📡 OAuth URL:", oauthUrl);

            // Web: redirect directly
            if (Platform.OS === "web" && typeof window !== "undefined") {
                window.location.href = oauthUrl;
                return;
            }

            // Mobile: use auth session
            const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);
            console.log("🔗 OAuth result:", result.type);

            if (result.type === "success" && result.url) {
                await handleCallback(result.url);
            } else if (result.type === "cancel") {
                console.log("ℹ️ User cancelled");
                setIsLoggingIn(false);
                setPollingStatus("");
            } else {
                // Session closed - wait a bit then show manual check option
                console.log("⚠️ Session closed, waiting for callback...");
                setPollingStatus("Waiting for callback...");
                setTimeout(() => {
                    if (isLoggingIn) {
                        setPollingStatus("Click the button below if you authorized");
                    }
                }, 3000);
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            setIsLoggingIn(false);
            setPollingStatus("");
            Alert.alert("❌ Error", "Failed to open Twitter login. Please try again.");
        }
    }, [handleCallback, isLoggingIn, redirectUri]);

    // Manual check - simple and direct
    const manualCheckStatus = useCallback(async () => {
        console.log("🔍 Manual check triggered");
        setPollingStatus("Checking...");

        try {
            const linkStatus = await checkLinkStatus(1);
            console.log("📊 Link status:", linkStatus);

            if (linkStatus.linked) {
                setPollingStatus("✅ Linked! Logging in...");
                await handleCallback(`ibtikar://oauth/callback?success=true&user_id=1`);
            } else {
                setPollingStatus("❌ Not linked yet");
                Alert.alert(
                    "❌ Not Linked",
                    "Your account is not linked yet.\n\n1. Make sure you clicked 'Authorize' on Twitter\n2. Wait a few seconds\n3. Try again",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error("❌ Check error:", error);
            setPollingStatus(`❌ Error: ${error}`);
            Alert.alert("❌ Error", `Failed to check status: ${error}`);
        }
    }, [handleCallback]);

    const cancelLogin = useCallback(() => {
        console.log("❌ Cancelling login");
        setIsLoggingIn(false);
        setPollingStatus("");
    }, []);

    const logout = useCallback(() => {
        console.log("🚪 Logging out");
        setUser(null);
        setIsActive(false);
        setIsLoggingIn(false);
        setPollingStatus("");
    }, []);

    const toggleActive = useCallback(() => {
        setIsActive((prev) => !prev);
    }, []);

    return useMemo(
        () => ({
            user,
            isActive,
            isLoggingIn,
            pollingStatus,
            loginWithTwitter,
            logout,
            toggleActive,
            manualCheckStatus,
            cancelLogin,
        }),
        [user, isActive, isLoggingIn, pollingStatus, loginWithTwitter, logout, toggleActive, manualCheckStatus, cancelLogin]
    );
});
