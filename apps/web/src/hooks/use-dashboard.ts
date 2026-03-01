"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
    apiFetch,
    type DashboardStatsResponse,
    type CategoryBreakdownResponse,
    type MonthlyTrendsResponse,
} from "@/lib/api";

const dashboardKeys = {
    all: ["dashboard"] as const,
    stats: (params?: { month?: number; year?: number; userId?: string }) =>
        [...dashboardKeys.all, "stats", params] as const,
    categoryBreakdown: (params?: { month?: number; year?: number; userId?: string }) =>
        [...dashboardKeys.all, "categoryBreakdown", params] as const,
    trends: (userId?: string) => [...dashboardKeys.all, "trends", userId] as const,
};

/**
 * Hook to fetch dashboard summary stats.
 */
export function useDashboardStats(params?: { month?: number; year?: number; userId?: string }) {
    const queryString = useMemo(() => {
        const urlParams = new URLSearchParams();
        if (params?.month) urlParams.set("month", String(params.month));
        if (params?.year) urlParams.set("year", String(params.year));
        if (params?.userId) urlParams.set("userId", params.userId);
        return urlParams.toString();
    }, [params?.month, params?.year, params?.userId]);

    return useQuery({
        queryKey: dashboardKeys.stats(params),
        queryFn: () => apiFetch<DashboardStatsResponse>(`/api/dashboard/stats?${queryString}`),
        staleTime: 60_000,
    });
}

/**
 * Hook to fetch category-wise expense breakdown.
 */
export function useCategoryBreakdown(params?: { month?: number; year?: number; userId?: string }) {
    const queryString = useMemo(() => {
        const urlParams = new URLSearchParams();
        if (params?.month) urlParams.set("month", String(params.month));
        if (params?.year) urlParams.set("year", String(params.year));
        if (params?.userId) urlParams.set("userId", params.userId);
        return urlParams.toString();
    }, [params?.month, params?.year, params?.userId]);

    return useQuery({
        queryKey: dashboardKeys.categoryBreakdown(params),
        queryFn: () =>
            apiFetch<CategoryBreakdownResponse>(`/api/dashboard/categories?${queryString}`),
        staleTime: 60_000,
    });
}

/**
 * Hook to fetch monthly income/expense trends (last 12 months).
 */
export function useMonthlyTrends(userId?: string) {
    const queryString = useMemo(() => {
        const urlParams = new URLSearchParams();
        if (userId) urlParams.set("userId", userId);
        return urlParams.toString();
    }, [userId]);

    return useQuery({
        queryKey: dashboardKeys.trends(userId),
        queryFn: () => apiFetch<MonthlyTrendsResponse>(`/api/dashboard/trends?${queryString}`),
        staleTime: 60_000,
    });
}
