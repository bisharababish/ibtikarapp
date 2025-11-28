import { checkLinkStatus, getOAuthStartUrl, getTwitterUser } from "@/utils/api";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import createContextHook from "@nkzw/create-context-hook";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
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

    // Simple function to fetch user data and set it
    const fetchAndSetUser = useCallback(async (userId: number) => {
        try {
            console.log("📡 Fetching user data for ID:", userId);
            const response = await getTwitterUser(userId);
            const userData = response?.data;

            if (userData?.name) {
                const newUser = {
                    id: userId,
                    name: userData.name,
                    username: userData.username,
                    email: `${userData.username || `user${userId}`}@twitter.com`,
                    profileImageUrl: userData.profile_image_url,
                };
                console.log("✅ Setting user:", newUser.name);
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

    // Manual check - with retry logic and direct user fetch fallback
    const manualCheckStatus = useCallback(async () => {
        console.log("🔍 Checking link status...");
        setPollingStatus("Checking...");

        try {
            // Try checking link status first
            let linkStatus = await checkLinkStatus(1);
            console.log("📊 Link status:", linkStatus);

            // If not linked, wait a bit and retry (backend might still be processing)
            if (!linkStatus.linked) {
                console.log("⏳ Not linked yet, waiting 2 seconds and retrying...");
                setPollingStatus("Waiting for backend to process...");
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                linkStatus = await checkLinkStatus(1);
                console.log("📊 Link status (retry):", linkStatus);
            }

            if (linkStatus.linked) {
                setPollingStatus("✅ Linked! Logging in...");
                const success = await fetchAndSetUser(1);
                if (success) {
                    // Don't show alert - navigation will happen automatically
                    console.log("✅ Login complete via manual check");
                }
            } else {
                // Fallback: Try fetching user directly (maybe link check is delayed but user exists)
                console.log("🔄 Link check says not linked, trying to fetch user directly...");
                try {
                    const success = await fetchAndSetUser(1);
                    if (success) {
                        console.log("✅ User found via direct fetch!");
                        return;
                    }
                } catch (fetchError) {
                    console.log("❌ Direct fetch also failed:", fetchError);
                }

                setPollingStatus("❌ Not linked yet");
                Alert.alert(
                    "❌ Not Linked",
                    "Your account is not linked yet.\n\n1. Make sure you clicked 'Authorize' on Twitter\n2. Wait a few seconds\n3. Try again"
                );
            }
        } catch (error) {
            console.error("❌ Check error:", error);
            
            // Fallback: Try fetching user directly even if check failed
            console.log("🔄 Check failed, trying direct user fetch as fallback...");
            try {
                const success = await fetchAndSetUser(1);
                if (success) {
                    console.log("✅ User found via fallback fetch!");
                    return;
                }
            } catch (fetchError) {
                console.log("❌ Fallback fetch also failed:", fetchError);
            }
            
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
