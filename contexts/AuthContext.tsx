import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { getOAuthStartUrl } from "@/utils/api";

interface User {
    name: string;
    email: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [user, setUser] = useState<User | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);

    const loginWithTwitter = useCallback(() => {
        // Open backend OAuth flow in external browser (backend handles callback server-side)
        const url = getOAuthStartUrl("1"); // Replace with real user id when available
        Linking.openURL(url).catch(() => {
            // Fallback to setting a local session so UI can proceed even if browser fails
            setUser({
                name: "User Name",
                email: "user@example.com",
            });
        });
        // Optimistically set a local session; backend will fetch tokens via callback
        setUser({
            name: "User Name",
            email: "user@example.com",
        });
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
