"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { usePermissionStore } from "@/store/permission-store";
import { useTransactions, useDeleteTransaction } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { TransactionForm } from "@/components/transaction-form";
import type { TransactionItem, TransactionFilters } from "@/lib/api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    ArrowLeftRight,
    Plus,
    Search,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Loader2,
    Eye,
} from "lucide-react";

export default function TransactionsPage() {
    const { user } = useAuth();
    const canWrite = usePermissionStore((s) => s.canWrite);
    const isReadOnly = usePermissionStore((s) => s.isReadOnly);

    // Filters state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchDebounced, setSearchDebounced] = useState("");
    const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Debounce search
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        const timer = setTimeout(() => {
            setSearchDebounced(value);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    // Build filters
    const filters: TransactionFilters = useMemo(
        () => ({
            page,
            limit: 10,
            search: searchDebounced || undefined,
            type: typeFilter || undefined,
            categoryId: categoryFilter || undefined,
            sortBy,
            sortOrder,
        }),
        [page, searchDebounced, typeFilter, categoryFilter, sortBy, sortOrder],
    );

    const { data, isLoading, error } = useTransactions(filters);
    const { data: categoriesData } = useCategories();
    const deleteMutation = useDeleteTransaction();

    const handleEdit = useCallback((transaction: TransactionItem) => {
        setEditingTransaction(transaction);
        setFormOpen(true);
    }, []);

    const handleAdd = useCallback(() => {
        setEditingTransaction(null);
        setFormOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            setDeleteDialogOpen(false);
            setDeletingId(null);
        } catch {
            // Error handled by mutation
        }
    }, [deletingId, deleteMutation]);

    const handleDeleteClick = useCallback((id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    }, []);

    const handleTypeFilterChange = useCallback((value: string) => {
        setTypeFilter(value === "all" ? "" : (value as "income" | "expense"));
        setPage(1);
    }, []);

    const handleCategoryFilterChange = useCallback((value: string) => {
        setCategoryFilter(value === "all" ? "" : value);
        setPage(1);
    }, []);

    const handleSortChange = useCallback((column: string) => {
        setSortBy((prev) => {
            if (prev === column) {
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                return prev;
            }
            setSortOrder("desc");
            return column;
        });
    }, []);

    if (!user) return null;

    const transactions = data?.transactions || [];
    const pagination = data?.pagination;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                        <ArrowLeftRight className="size-7" />
                        Transactions
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your income and expense transactions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isReadOnly && (
                        <Badge
                            variant="outline"
                            className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                            <Eye className="mr-1 size-3" />
                            Read-Only
                        </Badge>
                    )}
                    {canWrite && (
                        <Button onClick={handleAdd}>
                            <Plus className="mr-2 size-4" />
                            Add Transaction
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by description..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        <Select value={typeFilter || "all"} onValueChange={handleTypeFilterChange}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={categoryFilter || "all"}
                            onValueChange={handleCategoryFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categoriesData?.categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-sm">{error.message}</p>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 flex-1" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <ArrowLeftRight className="size-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No transactions found</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                                {searchDebounced || typeFilter || categoryFilter
                                    ? "Try adjusting your filters."
                                    : "Start by adding your first transaction."}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:text-foreground"
                                        onClick={() => handleSortChange("date")}>
                                        Date{" "}
                                        {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead
                                        className="text-right cursor-pointer hover:text-foreground"
                                        onClick={() => handleSortChange("amount")}>
                                        Amount{" "}
                                        {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    {canWrite && (
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(tx.date).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {tx.description || "—"}
                                        </TableCell>
                                        <TableCell>
                                            {tx.categoryName ? (
                                                <Badge variant="outline" className="text-xs">
                                                    {tx.categoryName}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    tx.type === "income"
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                                }>
                                                {tx.type === "income" ? (
                                                    <TrendingUp className="mr-1 size-3" />
                                                ) : (
                                                    <TrendingDown className="mr-1 size-3" />
                                                )}
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-medium ${
                                                tx.type === "income"
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-red-600 dark:text-red-400"
                                            }`}>
                                            {tx.type === "income" ? "+" : "-"}$
                                            {parseFloat(tx.amount).toFixed(2)}
                                        </TableCell>
                                        {canWrite && (
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => handleEdit(tx)}>
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteClick(tx.id)}>
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} transactions
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}>
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= pagination.totalPages}>
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Transaction Form Dialog */}
            <TransactionForm
                open={formOpen}
                onOpenChange={setFormOpen}
                transaction={editingTransaction}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Delete Transaction</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this transaction? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteMutation.isPending}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
