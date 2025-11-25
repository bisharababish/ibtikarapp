import { BASE_URL } from "@/constants/config";
import { getOAuthStartUrl, getTwitterUser } from "@/utils/api";
import createContextHook from "@nkzw/create-context-hook";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useMemo, useState } from "react";

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
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    // Use explicit custom scheme - no localhost
    const redirectUri = "ibtikar://oauth/callback";

    // Handle OAuth callback from deep link
    const handleOAuthCallback = useCallback(async (params: Record<string, string>) => {
        try {
            console.log("🔗 OAuth callback received:", params);

            const success = params.success === "true";
            const userIdParam = params.user_id;
            const error = params.error;

            console.log("📦 OAuth callback data:", { success, userId: userIdParam, error });

            // Handle errors
            if (error === "access_denied") {
                console.log("ℹ️ User cancelled OAuth");
                setIsLoggingIn(false);
                return;
            }

            if (!success || !userIdParam) {
                console.error("❌ OAuth failed:", { success, userId: userIdParam, error });
                setIsLoggingIn(false);
                return;
            }

            // OAuth successful - get user ID
            const userIdNum = parseInt(userIdParam, 10);

            if (isNaN(userIdNum)) {
                console.error("❌ Invalid user ID:", userIdParam);
                setIsLoggingIn(false);
                return;
            }

            console.log("✅ OAuth successful, fetching user data for user_id:", userIdNum);

            // Fetch user data from backend
            try {
                const response = await getTwitterUser(userIdNum);
                const userData = response?.data;

                if (userData && userData.name) {
                    const newUser: User = {
                        id: userIdNum,
                        name: userData.name,
                        username: userData.username,
                        email: `${userData.username || `user${userIdNum}`}@twitter.com`,
                        profileImageUrl: userData.profile_image_url,
                    };

                    setUser(newUser);
                    setIsActive(false);
                    setIsLoggingIn(false);
                    console.log("🎉 Login successful:", newUser.name);
                } else {
                    console.warn("⚠️ User data missing, using fallback");
                    setUser({
                        id: userIdNum,
                        name: `User ${userIdNum}`,
                        email: `user${userIdNum}@example.com`,
                    });
                    setIsActive(false);
                    setIsLoggingIn(false);
                }
            } catch (err) {
                console.error("❌ Failed to fetch user data:", err);
                // Fallback user
                setUser({
                    id: userIdNum,
                    name: `User ${userIdNum}`,
                    email: `user${userIdNum}@example.com`,
                });
                setIsActive(false);
                setIsLoggingIn(false);
            }
        } catch (error) {
            console.error("❌ Error handling OAuth callback:", error);
            setIsLoggingIn(false);
        }
    }, []);

    // Login with Twitter - ALWAYS shows login/signup screen
    const loginWithTwitter = useCallback(async () => {
        if (isLoggingIn) {
            console.log("⚠️ Login already in progress");
            return;
        }

        setIsLoggingIn(true);

        try {
            console.log("🚀 Starting Twitter login...");
            console.log("🔗 Redirect URI:", redirectUri);

            // STEP 1: Clear backend tokens (allows account switching)
            try {
                const clearResponse = await fetch(`${BASE_URL}/v1/oauth/x/clear?user_id=1`, {
                    method: "GET",
                });
                if (clearResponse.ok) {
                    console.log("✅ Cleared backend tokens");
                }
            } catch (err) {
                console.log("⚠️ Error clearing tokens:", err);
            }

            // STEP 2: Dismiss any existing browser sessions to clear Twitter cookies
            // This is CRITICAL to force the login screen every time
            // Add timeout to prevent hanging
            try {
                const dismissPromise = WebBrowser.dismissBrowser();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 500)
                );
                await Promise.race([dismissPromise, timeoutPromise]);
                console.log("✅ Dismissed existing browser session");
            } catch {
                // No browser to dismiss or timeout - that's fine, continue
                console.log("ℹ️ No existing browser session to dismiss");
            }

            // STEP 3: Build OAuth URL with aggressive cache-busting
            // Backend already includes force_login=true which forces login screen
            console.log("🔐 Step 3: Building OAuth URL...");
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const randomNum = Math.floor(Math.random() * 1000000);
            const oauthUrl = `${getOAuthStartUrl("1")}&_t=${timestamp}&_r=${randomId}&_cb=${randomNum}`;
            console.log("✅ OAuth URL built:", oauthUrl.substring(0, 100) + "...");

            console.log("🔐 Step 4: Opening OAuth session...");
            console.log("ℹ️ Backend uses force_login=true to show SIGN IN page every time");

            // STEP 4: Open OAuth session
            // force_login=true in backend URL ensures login screen is shown
            const result = await WebBrowser.openAuthSessionAsync(
                oauthUrl,
                redirectUri
            );

            console.log("🔗 OAuth result:", result.type);

            if (result.type === "success" && result.url) {
                // Parse the callback URL parameters
                // Extract query string from URL
                const queryString = result.url.split('?')[1] || '';
                const params: Record<string, string> = {};

                // Parse query parameters manually for React Native compatibility
                queryString.split('&').forEach((param) => {
                    const [key, value] = param.split('=');
                    if (key && value) {
                        params[decodeURIComponent(key)] = decodeURIComponent(value);
                    }
                });

                await handleOAuthCallback(params);
            } else if (result.type === "cancel" || result.type === "dismiss") {
                console.log("ℹ️ User cancelled OAuth");
                setIsLoggingIn(false);
            } else {
                console.log("⚠️ Unexpected OAuth result:", result);
                setIsLoggingIn(false);
            }
        } catch (error) {
            console.error("❌ Twitter login error:", error);
            setIsLoggingIn(false);
        }
    }, [handleOAuthCallback, isLoggingIn, redirectUri]);

    // Logout function
    const logout = useCallback(() => {
        console.log("🚪 Logging out...");
        setUser(null);
        setIsActive(false);
    }, []);

    // Toggle active state
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
