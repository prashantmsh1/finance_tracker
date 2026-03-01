"use client";

import { create } from "zustand";
import type { User } from "@/store/auth-store";

interface PermissionState {
    isReadOnly: boolean;
    impersonatedUser: User | null;
    canWrite: boolean;

    setReadOnly: (readOnly: boolean) => void;
    setImpersonatedUser: (user: User) => void;
    clearImpersonation: () => void;
}

export const usePermissionStore = create<PermissionState>()((set) => ({
    isReadOnly: false,
    impersonatedUser: null,
    canWrite: true,

    setReadOnly: (readOnly: boolean) =>
        set({
            isReadOnly: readOnly,
            canWrite: !readOnly,
        }),

    setImpersonatedUser: (user: User) =>
        set({
            impersonatedUser: user,
            // Admin viewing a user's dashboard always has full access
            canWrite: true,
        }),

    clearImpersonation: () =>
        set((state) => ({
            impersonatedUser: null,
            // Restore canWrite based on the admin's own readOnly flag
            canWrite: !state.isReadOnly,
        })),
}));
