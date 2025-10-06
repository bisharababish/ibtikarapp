import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useMemo } from "react";

interface User {
    name: string;
    email: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [user, setUser] = useState<User | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);

    const loginWithTwitter = useCallback(() => {
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
