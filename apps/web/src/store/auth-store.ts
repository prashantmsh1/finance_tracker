"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user" | "read-only";
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    lastLoginAt: number | null;
    setUser: (user: User) => void;
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            lastLoginAt: null,

            setUser: (user: User) => set({ user, isLoading: false, lastLoginAt: Date.now() }),

            clearUser: () => set({ user: null, isLoading: false, lastLoginAt: null }),

            setLoading: (loading: boolean) => set({ isLoading: loading }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                lastLoginAt: state.lastLoginAt,
            }),
            onRehydrateStorage: () => {
                return (state) => {
                    if (state) {
                        // If persisted data is older than 7 days, clear it
                        if (state.lastLoginAt && Date.now() - state.lastLoginAt > SEVEN_DAYS_MS) {
                            state.clearUser();
                        } else {
                            // Hydration done — mark loading as false
                            state.setLoading(false);
                        }
                    }
                };
            },
        },
    ),
);
