"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiFetch, type CategoriesResponse, type CategoryItem } from "@/lib/api";

const categoryKeys = {
    all: ["categories"] as const,
    list: () => [...categoryKeys.all, "list"] as const,
};

/**
 * Hook to fetch all categories. Cached for 5 minutes since categories rarely change.
 */
export function useCategories() {
    return useQuery({
        queryKey: categoryKeys.list(),
        queryFn: () => apiFetch<CategoriesResponse>("/api/categories"),
        staleTime: 5 * 60_000, // 5 minutes
    });
}

/**
 * Hook to create a new category.
 */
export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: useCallback(
            (data: { name: string; type: "income" | "expense" }) =>
                apiFetch<{ category: CategoryItem }>("/api/categories", {
                    method: "POST",
                    body: JSON.stringify(data),
                }),
            [],
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
        },
    });
}

/**
 * Hook to update a category.
 */
export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: useCallback(
            ({ id, ...data }: { id: string; name?: string; type?: "income" | "expense" }) =>
                apiFetch<{ category: CategoryItem }>(`/api/categories/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                }),
            [],
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
        },
    });
}

/**
 * Hook to delete a category.
 */
export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: useCallback(
            (id: string) =>
                apiFetch<{ message: string }>(`/api/categories/${id}`, {
                    method: "DELETE",
                }),
            [],
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
        },
    });
}

/**
 * Hook to seed default categories (admin only).
 */
export function useSeedCategories() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: useCallback(
            () =>
                apiFetch<{ message: string }>("/api/categories/seed", {
                    method: "POST",
                }),
            [],
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
        },
    });
}
