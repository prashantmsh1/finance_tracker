"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type User } from "@/store/auth-store";
import { usePermissionStore } from "@/store/permission-store";

export type { User };

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, clearUser, setLoading } = useAuthStore();
    const setReadOnly = usePermissionStore((s) => s.setReadOnly);

    useEffect(() => {
        // Background session validation against the server
        const checkSession = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    // Sync read-only flag based on user role
                    setReadOnly(data.user.role === "read-only");
                } else {
                    // Cookie expired or invalid — clear persisted state
                    clearUser();
                }
            } catch (error) {
                console.error("Failed to fetch session:", error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, [setUser, clearUser, setLoading, setReadOnly]);

    return <>{children}</>;
}

export function useAuth() {
    const user = useAuthStore((s) => s.user);
    const isLoading = useAuthStore((s) => s.isLoading);
    const storeSetUser = useAuthStore((s) => s.setUser);
    const storeClearUser = useAuthStore((s) => s.clearUser);
    const setReadOnly = usePermissionStore((s) => s.setReadOnly);
    const router = useRouter();

    const login = (userData: User) => {
        storeSetUser(userData);
        setReadOnly(userData.role === "read-only");
        router.push("/dashboard");
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            storeClearUser();
            setReadOnly(false);
            router.push("/login");
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };

    return { user, isLoading, login, logout };
}
