"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { usePermissionStore } from "@/store/permission-store";
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useSeedCategories,
} from "@/hooks/use-categories";
import type { CategoryItem } from "@/lib/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    FolderTree,
    Plus,
    Pencil,
    Trash2,
    TrendingUp,
    TrendingDown,
    Loader2,
    Eye,
} from "lucide-react";

export default function CategoriesPage() {
    const { user } = useAuth();
    const canWrite = usePermissionStore((s) => s.canWrite);
    const isReadOnly = usePermissionStore((s) => s.isReadOnly);

    const { data, isLoading, error } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();
    const seedMutation = useSeedCategories();

    // Form state
    const [formOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
    const [name, setName] = useState("");
    const [type, setType] = useState<"income" | "expense">("expense");
    const [formError, setFormError] = useState("");

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = useCallback(() => {
        setEditingCategory(null);
        setName("");
        setType("expense");
        setFormError("");
        setFormOpen(true);
    }, []);

    const handleEdit = useCallback((category: CategoryItem) => {
        setEditingCategory(category);
        setName(category.name);
        setType(category.type);
        setFormError("");
        setFormOpen(true);
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setFormError("");

            if (!name.trim()) {
                setFormError("Category name is required.");
                return;
            }

            try {
                if (editingCategory) {
                    await updateMutation.mutateAsync({
                        id: editingCategory.id,
                        name: name.trim(),
                        type,
                    });
                } else {
                    await createMutation.mutateAsync({ name: name.trim(), type });
                }
                setFormOpen(false);
            } catch (err) {
                setFormError(err instanceof Error ? err.message : "Something went wrong");
            }
        },
        [name, type, editingCategory, createMutation, updateMutation],
    );

    const handleDeleteClick = useCallback((id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            setDeleteDialogOpen(false);
            setDeletingId(null);
        } catch {
            // Error is handled by mutation
        }
    }, [deletingId, deleteMutation]);

    const handleSeed = useCallback(async () => {
        try {
            await seedMutation.mutateAsync();
        } catch {
            // Error handled by mutation
        }
    }, [seedMutation]);

    if (!user) return null;

    const categories = data?.categories || [];
    const incomeCategories = categories.filter((c) => c.type === "income");
    const expenseCategories = categories.filter((c) => c.type === "expense");

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                        <FolderTree className="size-7" />
                        Categories
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your transaction categories.
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
                    {user.role === "admin" && (
                        <Button
                            variant="outline"
                            onClick={handleSeed}
                            disabled={seedMutation.isPending}>
                            {seedMutation.isPending && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Seed Defaults
                        </Button>
                    )}
                    {canWrite && (
                        <Button onClick={handleAdd}>
                            <Plus className="mr-2 size-4" />
                            Add Category
                        </Button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-sm">{error.message}</p>
                    </CardContent>
                </Card>
            )}

            {/* Seed success */}
            {seedMutation.isSuccess && (
                <Card className="border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
                    <CardContent className="pt-6">
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            ✓ Default categories seeded successfully!
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[1, 2, 3].map((j) => (
                                    <Skeleton key={j} className="h-10 w-full" />
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FolderTree className="size-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No categories yet</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            {user.role === "admin"
                                ? 'Click "Seed Defaults" to populate default categories, or add your own.'
                                : "Categories will appear here once they are created."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Expense Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingDown className="size-5 text-red-500" />
                                Expense Categories
                            </CardTitle>
                            <CardDescription>{expenseCategories.length} categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {expenseCategories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="secondary"
                                                className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs">
                                                Expense
                                            </Badge>
                                            <span className="font-medium text-sm">{cat.name}</span>
                                        </div>
                                        {canWrite && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleEdit(cat)}>
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(cat.id)}>
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {expenseCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        No expense categories yet.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Income Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="size-5 text-emerald-500" />
                                Income Categories
                            </CardTitle>
                            <CardDescription>{incomeCategories.length} categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {incomeCategories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="secondary"
                                                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                                                Income
                                            </Badge>
                                            <span className="font-medium text-sm">{cat.name}</span>
                                        </div>
                                        {canWrite && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => handleEdit(cat)}>
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(cat.id)}>
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {incomeCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        No income categories yet.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add/Edit Category Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Edit Category" : "Add Category"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? "Update the category details."
                                : "Create a new transaction category."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {formError}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Name</Label>
                            <Input
                                id="cat-name"
                                placeholder="e.g. Food & Dining"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-type">Type</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => setType(v as "income" | "expense")}>
                                <SelectTrigger id="cat-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">Expense</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                                {editingCategory ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure? Transactions using this category will become
                            uncategorized.
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
