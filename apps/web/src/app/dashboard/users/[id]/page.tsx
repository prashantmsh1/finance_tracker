"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { usePermissionStore } from "@/store/permission-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    ArrowLeftRight,
    TrendingUp,
    TrendingDown,
    Wallet,
    Plus,
    Eye,
    ShieldCheck,
    User as UserIcon,
} from "lucide-react";

interface ViewedUser {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "read-only";
    createdAt: string;
}

interface UserSummary {
    totalTransactions: number;
    totalIncome: string;
    totalExpense: string;
}

export default function UserDashboardPage() {
    const { user: adminUser } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const { setImpersonatedUser, clearImpersonation } = usePermissionStore();

    const [viewedUser, setViewedUser] = useState<ViewedUser | null>(null);
    const [summary, setSummary] = useState<UserSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (adminUser && adminUser.role !== "admin") {
            router.replace("/dashboard");
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/users/${userId}`);
                if (!res.ok) throw new Error("Failed to fetch user");
                const data = await res.json();
                setViewedUser(data.user);
                setSummary(data.summary);

                // Set impersonation in permission store
                setImpersonatedUser(data.user);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();

        // Clear impersonation on unmount
        return () => {
            clearImpersonation();
        };
    }, [userId, adminUser, router, setImpersonatedUser, clearImpersonation]);

    const handleBack = () => {
        clearImpersonation();
        router.push("/dashboard/users");
    };

    if (!adminUser || adminUser.role !== "admin") return null;

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "admin":
                return <ShieldCheck className="mr-1 size-3" />;
            case "read-only":
                return <Eye className="mr-1 size-3" />;
            default:
                return <UserIcon className="mr-1 size-3" />;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-32" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Users
                </Button>
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-sm">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!viewedUser) return null;

    const balance =
        parseFloat(summary?.totalIncome || "0") - parseFloat(summary?.totalExpense || "0");

    return (
        <div className="space-y-6">
            {/* Impersonation Banner */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        <Eye className="size-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Viewing as {viewedUser.name}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            {viewedUser.email} · Admin full-access view
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleBack}>
                    <ArrowLeft className="mr-2 size-3.5" />
                    Back to Admin
                </Button>
            </div>

            {/* User info header */}
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {viewedUser.name}&apos;s Dashboard
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground text-sm">{viewedUser.email}</span>
                        <Badge variant="secondary" className="capitalize text-xs">
                            {getRoleIcon(viewedUser.role)}
                            {viewedUser.role}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Balance</CardTitle>
                        <Wallet className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-2xl font-bold ${
                                balance >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}>
                            ${balance.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Current balance</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Income</CardTitle>
                        <TrendingUp className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            ${parseFloat(summary?.totalIncome || "0").toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total income</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                        <TrendingDown className="size-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            ${parseFloat(summary?.totalExpense || "0").toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total expenses</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <ArrowLeftRight className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalTransactions || 0}</div>
                        <p className="text-xs text-muted-foreground">Total transactions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions (admin has full access) */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Manage {viewedUser.name}&apos;s finances with admin privileges.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button>
                        <Plus className="mr-2 size-4" />
                        Add Transaction
                    </Button>
                    <Button variant="outline">
                        <Plus className="mr-2 size-4" />
                        Add Category
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
