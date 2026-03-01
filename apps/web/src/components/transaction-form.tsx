"use client";

import { useState, useCallback, useEffect } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import type { TransactionItem } from "@/lib/api";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TransactionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction?: TransactionItem | null;
    userId?: string; // For admin creating on behalf of another user
}

export function TransactionForm({ open, onOpenChange, transaction, userId }: TransactionFormProps) {
    const isEditing = !!transaction;
    const { data: categoriesData } = useCategories();
    const createMutation = useCreateTransaction();
    const updateMutation = useUpdateTransaction();

    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"income" | "expense">("expense");
    const [categoryId, setCategoryId] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    // Populate form when editing
    useEffect(() => {
        if (transaction) {
            setAmount(transaction.amount);
            setType(transaction.type);
            setCategoryId(transaction.categoryId || "");
            setDate(new Date(transaction.date).toISOString().split("T")[0]);
            setDescription(transaction.description || "");
        } else {
            setAmount("");
            setType("expense");
            setCategoryId("");
            setDate(new Date().toISOString().split("T")[0]);
            setDescription("");
        }
        setError("");
    }, [transaction, open]);

    const filteredCategories = (categoriesData?.categories || []).filter(
        (cat) => cat.type === type,
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError("");

            if (!amount || !date) {
                setError("Amount and date are required.");
                return;
            }

            if (parseFloat(amount) <= 0) {
                setError("Amount must be a positive number.");
                return;
            }

            try {
                if (isEditing && transaction) {
                    await updateMutation.mutateAsync({
                        id: transaction.id,
                        amount,
                        type,
                        categoryId: categoryId || null,
                        date,
                        description: description || null,
                    });
                } else {
                    await createMutation.mutateAsync({
                        amount,
                        type,
                        categoryId: categoryId || undefined,
                        date,
                        description: description || undefined,
                        userId: userId || undefined,
                    });
                }
                onOpenChange(false);
            } catch (err: any) {
                setError(err.message || "Something went wrong");
            }
        },
        [
            amount,
            type,
            categoryId,
            date,
            description,
            isEditing,
            transaction,
            userId,
            createMutation,
            updateMutation,
            onOpenChange,
        ],
    );

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the transaction details below."
                            : "Fill in the details to add a new transaction."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => {
                                setType(v as "income" | "expense");
                                setCategoryId("");
                            }}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                                {filteredCategories.length === 0 && (
                                    <div className="py-2 px-3 text-sm text-muted-foreground">
                                        No categories found. Create one first.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                            id="description"
                            placeholder="e.g. Lunch at restaurant"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {isEditing ? "Update" : "Add"} Transaction
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
