"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
    apiFetch,
    type TransactionsResponse,
    type TransactionItem,
    type TransactionFilters,
} from "@/lib/api";

// Query key factory for cache management
const transactionKeys = {
    all: ["transactions"] as const,
    lists: () => [...transactionKeys.all, "list"] as const,
    list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
    details: () => [...transactionKeys.all, "detail"] as const,
    detail: (id: string) => [...transactionKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated transactions with filters.
 */
export function useTransactions(filters: TransactionFilters = {}) {
    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.page) params.set("page", String(filters.page));
        if (filters.limit) params.set("limit", String(filters.limit));
        if (filters.search) params.set("search", filters.search);
        if (filters.type) params.set("type", filters.type);
        if (filters.categoryId) params.set("categoryId", filters.categoryId);
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);
        if (filters.sortBy) params.set("sortBy", filters.sortBy);
        if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
        if (filters.userId) params.set("userId", filters.userId);
        return params.toString();
    }, [filters]);

    return useQuery({
        queryKey: transactionKeys.list(filters),
        queryFn: () => apiFetch<TransactionsResponse>(`/api/transactions?${queryString}`),
        staleTime: 60_000, // 1 minute
    });
}

/**
 * Hook to fetch a single transaction by ID.
 */
export function useTransaction(id: string) {
    return useQuery({
        queryKey: transactionKeys.detail(id),
        queryFn: () => apiFetch<{ transaction: TransactionItem }>(`/api/transactions/${id}`),
        enabled: !!id,
    });
}

/**
 * Hook to create a new transaction.
 */
export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: useCallback(
            (data: {
                amount: string;
                type: "income" | "expense";
                date: string;
                description?: string;
                categoryId?: string;
                userId?: string;
            }) =>
                apiFetch<{ transaction: TransactionItem }>("/api/transactions", {
                    method: "POST",
                    body: JSON.stringify(data),
                }),
            [],
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
            // Also invalidate dashboard data since totals changed
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

/**
 * Hook to update an existing transaction.
 */
export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: useCallback(
            ({ id, ...data }: { id: string; [key: string]: unknown }) =>
                apiFetch<{ transaction: TransactionItem }>(`/api/transactions/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                }),
            [],
        ),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

/**
 * Hook to delete a transaction.
 */
export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: useCallback(
            (id: string) =>
                apiFetch<{ message: string }>(`/api/transactions/${id}`, {
                    method: "DELETE",
                }),
            [],
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}
