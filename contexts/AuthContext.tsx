import { checkLinkStatus, getOAuthStartUrl, getTwitterUser } from "@/utils/api";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import createContextHook from "@nkzw/create-context-hook";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import * as WebBrowser from "expo-web-browser";
import { useCallback, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";

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

    // Simple function to fetch user data and set it
    const fetchAndSetUser = useCallback(async (userId: number) => {
        try {
            console.log("📡 Fetching user data for ID:", userId);
            const response = await getTwitterUser(userId);
            const userData = response?.data;

            // Use cached data if rate limited (response.cached will be true)
            if (userData?.name || (response?.cached && userData)) {
                const newUser = {
                    id: userId,
                    name: userData.name || `User ${userId}`,
                    username: userData.username,
                    email: `${userData.username || `user${userId}`}@twitter.com`,
                    profileImageUrl: userData.profile_image_url,
                };
                if (response?.cached) {
                    console.log("✅ Setting user (cached data):", newUser.name);
                } else {
                    console.log("✅ Setting user:", newUser.name);
                }
                setUser(newUser);
                setIsActive(false);
                setIsLoggingIn(false);
                setPollingStatus("");
                return true;
            } else if (response?.rate_limited) {
                // Rate limited and no cached data - show message but don't fail
                console.log("⚠️ Rate limited, but no cached user data available");
                Alert.alert(
                    "Rate Limited",
                    "Twitter API rate limit reached. User data will be available once the limit resets. The app will continue to work."
                );
                // Still set a basic user so the app doesn't break
                const newUser = {
                    id: userId,
                    name: `User ${userId}`,
                    email: `user${userId}@example.com`,
                };
                setUser(newUser);
                setIsActive(false);
                setIsLoggingIn(false);
                setPollingStatus("");
                return true;
            } else {
                const newUser = {
                    id: userId,
                    name: `User ${userId}`,
                    email: `user${userId}@example.com`,
                };
                console.log("✅ Setting user (fallback):", newUser.name);
                setUser(newUser);
                setIsActive(false);
                setIsLoggingIn(false);
                setPollingStatus("");
                return true;
            }
        } catch (error) {
            console.error("❌ Error fetching user:", error);
            setIsLoggingIn(false);
            setPollingStatus("");
            Alert.alert("❌ Error", "Failed to fetch user data. Please try again.");
            return false;
        }
    }, []);

    // Simple login - just open Twitter OAuth
    const loginWithTwitter = useCallback(async () => {
        if (isLoggingIn) return;

        console.log("🚀 Starting Twitter login...");
        setIsLoggingIn(true);
        setPollingStatus("Opening Twitter...");

        try {
            const oauthUrl = getOAuthStartUrl("1");
            console.log("📡 OAuth URL:", oauthUrl);

            // Open URL - works for both web and mobile
            const canOpen = await Linking.canOpenURL(oauthUrl);
            if (canOpen) {
                await Linking.openURL(oauthUrl);
                setPollingStatus("Authorize on Twitter, then click the button below");
            } else {
                throw new Error("Cannot open URL");
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            setIsLoggingIn(false);
            setPollingStatus("");
            Alert.alert("❌ Error", "Failed to open Twitter login. Please try again.");
        }
    }, [isLoggingIn]);

    // Manual check - simple and direct
    const manualCheckStatus = useCallback(async () => {
        console.log("🔍 Checking link status...");
        setPollingStatus("Checking...");

        try {
            const linkStatus = await checkLinkStatus(1);
            console.log("📊 Link status:", linkStatus);

            if (linkStatus.linked) {
                setPollingStatus("✅ Linked! Logging in...");
                const success = await fetchAndSetUser(1);
                if (success) {
                    Alert.alert("✅ Success!", "You're logged in!");
                }
            } else {
                setPollingStatus("❌ Not linked yet");
                Alert.alert(
                    "❌ Not Linked",
                    "Your account is not linked yet.\n\n1. Make sure you clicked 'Authorize' on Twitter\n2. Wait a few seconds\n3. Try again"
                );
            }
        } catch (error) {
            console.error("❌ Check error:", error);
            setPollingStatus(`❌ Error: ${error}`);
            Alert.alert("❌ Error", `Failed to check status: ${error}`);
        }
    }, [fetchAndSetUser]);

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
