/**
 * Centralized API fetch utility with error handling.
 * All API calls go through this wrapper.
 */

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new ApiError(data.error || "Request failed", res.status);
    }

    return res.json();
}

// --- Type definitions for API responses ---

export interface TransactionItem {
    id: string;
    amount: string;
    type: "income" | "expense";
    date: string;
    description: string | null;
    categoryId: string | null;
    categoryName: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface TransactionsResponse {
    transactions: TransactionItem[];
    pagination: Pagination;
}

export interface CategoryItem {
    id: string;
    name: string;
    type: "income" | "expense";
    createdAt: string;
}

export interface CategoriesResponse {
    categories: CategoryItem[];
}

export interface DashboardStats {
    totalTransactions: number;
    totalIncome: string;
    totalExpense: string;
    balance: string;
}

export interface DashboardStatsResponse {
    stats: DashboardStats;
}

export interface CategoryBreakdownItem {
    categoryId: string | null;
    categoryName: string;
    total: string;
    count: number;
}

export interface CategoryBreakdownResponse {
    breakdown: CategoryBreakdownItem[];
}

export interface MonthlyTrendItem {
    month: string;
    monthLabel: string;
    income: string;
    expense: string;
}

export interface MonthlyTrendsResponse {
    trends: MonthlyTrendItem[];
}

export interface TransactionFilters {
    page?: number;
    limit?: number;
    search?: string;
    type?: "income" | "expense" | "";
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    userId?: string;
}
