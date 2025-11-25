import { getOAuthStartUrl, getTwitterUser } from "@/utils/api";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import createContextHook from "@nkzw/create-context-hook";
// @ts-ignore - Package is installed, TypeScript types may not be resolved
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking } from "react-native";

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
            // Parse URL manually (deep links like ibtikar://oauth/callback?success=true&user_id=1)
            if (!url.startsWith("ibtikar://") || !url.includes("oauth/callback")) {
                return;
            }

            // Extract query string
            const queryString = url.split("?")[1] || "";
            const params: Record<string, string> = {};
            queryString.split("&").forEach((param) => {
                const [key, value] = param.split("=");
                if (key && value) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                }
            });

            const success = params.success === "true";
            const userId = params.user_id;
            const error = params.error;

            if (error === "access_denied") {
                setIsLoggingIn(false);
                return;
            }

            if (!success || !userId) {
                setIsLoggingIn(false);
                return;
            }

            const userIdNum = parseInt(userId || "0", 10);

            if (isNaN(userIdNum)) {
                setIsLoggingIn(false);
                return;
            }

            // Get user data
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
                setIsActive(false);
            } else {
                setUser({
                    id: userIdNum,
                    name: `User ${userIdNum}`,
                    email: `user${userIdNum}@example.com`,
                });
                setIsActive(false);
            }

            setIsLoggingIn(false);
        } catch (error) {
            console.error("Callback error:", error);
            setIsLoggingIn(false);
        }
    }, []);

    // Listen for deep links (handles OAuth callback from backend)
    useEffect(() => {
        // Check for initial URL when app opens
        Linking.getInitialURL().then((url) => {
            if (url && url.startsWith("ibtikar://oauth/callback")) {
                console.log("🔗 Initial deep link:", url);
                handleCallback(url);
            }
        });

        // Listen for deep links while app is running
        const subscription = Linking.addEventListener("url", (event) => {
            if (event.url && event.url.startsWith("ibtikar://oauth/callback")) {
                console.log("🔗 Deep link received:", event.url);
                handleCallback(event.url);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [handleCallback]);

    // Simple login function - works for any Twitter account
    const loginWithTwitter = useCallback(async () => {
        if (isLoggingIn) return;

        setIsLoggingIn(true);

        try {
            // Step 1: Open Twitter logout to clear session
            // User needs to click "Log out" button, then we proceed to OAuth
            try {
                await WebBrowser.openBrowserAsync("https://twitter.com/logout");
                // Wait longer (5 seconds) for user to click "Log out" and process
                await new Promise(resolve => setTimeout(resolve, 5000));
                await WebBrowser.dismissBrowser();
            } catch {
                // Ignore errors, continue to OAuth
            }

            // Step 2: Get OAuth URL from backend (backend handles user creation)
            const oauthUrl = getOAuthStartUrl("1");

            // Step 3: Open OAuth in app browser
            console.log("🔐 Opening OAuth session...");
            const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);
            console.log("🔗 OAuth result:", result.type);

            // Handle result
            if (result.type === "success") {
                // @ts-ignore - result.url exists when type is "success"
                const callbackUrl = result.url;
                console.log("🔗 OAuth callback URL:", callbackUrl?.substring(0, 100));

                if (callbackUrl && callbackUrl.startsWith("ibtikar://")) {
                    console.log("✅ Got deep link from OAuth");
                    await handleCallback(callbackUrl);
                } else {
                    console.log("⚠️ OAuth completed but no deep link in result");
                    console.log("ℹ️ Deep link should be caught by listener - check console for '🔗 Deep link received'");
                    // Deep link should be caught by the listener
                    // Give it a moment, then reset if nothing happens
                    setTimeout(() => {
                        if (isLoggingIn) {
                            console.log("⚠️ No deep link received after 3 seconds");
                            setIsLoggingIn(false);
                        }
                    }, 3000);
                }
            } else if (result.type === "cancel" || result.type === "dismiss") {
                console.log("ℹ️ User cancelled OAuth");
                setIsLoggingIn(false);
            } else {
                console.log("⚠️ Unexpected OAuth result:", result.type);
                setIsLoggingIn(false);
            }
        } catch (error) {
            console.error("Login error:", error);
            setIsLoggingIn(false);
        }
    }, [handleCallback, isLoggingIn, redirectUri]);

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
            isLoggingIn,
            loginWithTwitter,
            logout,
            toggleActive,
        }),
        [user, isActive, isLoggingIn, loginWithTwitter, logout, toggleActive]
    );
});

