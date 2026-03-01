"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { usePermissionStore } from "@/store/permission-store";
import { useDashboardStats, useCategoryBreakdown, useMonthlyTrends } from "@/hooks/use-dashboard";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, TrendingUp, TrendingDown, Wallet, Plus, Eye } from "lucide-react";

import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const CHART_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#06b6d4",
    "#3b82f6",
    "#a855f7",
    "#d946ef",
];

const MONTHS = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const canWrite = usePermissionStore((s) => s.canWrite);
    const isReadOnly = usePermissionStore((s) => s.isReadOnly);
    const router = useRouter();

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

    const dashParams = useMemo(
        () => ({
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
        }),
        [selectedMonth, selectedYear],
    );

    const { data: statsData, isLoading: statsLoading } = useDashboardStats(dashParams);
    const { data: breakdownData, isLoading: breakdownLoading } = useCategoryBreakdown(dashParams);
    const { data: trendsData, isLoading: trendsLoading } = useMonthlyTrends();

    if (!user) return null;

    const stats = statsData?.stats;
    const balance = parseFloat(stats?.balance || "0");
    const totalIncome = parseFloat(stats?.totalIncome || "0");
    const totalExpense = parseFloat(stats?.totalExpense || "0");

    // Pie chart data
    const pieData = (breakdownData?.breakdown || []).map((item) => ({
        name: item.categoryName,
        value: parseFloat(item.total),
        count: item.count,
    }));

    // Line/Bar chart data
    const trendsChartData = (trendsData?.trends || []).map((item) => ({
        month: item.monthLabel,
        income: parseFloat(item.income),
        expense: parseFloat(item.expense),
        net: parseFloat(item.income) - parseFloat(item.expense),
    }));

    // Generate year options (current year ± 2)
    const currentYear = now.getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

    return (
        <div className="space-y-6">
            {/* Welcome header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-6 sm:p-8 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border border-border/50 bg-card">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl dark:bg-pink-500/10" />
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="bg-linear-to-br from-foreground to-foreground/80 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">
                            Welcome back, {user.name}
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Here&apos;s an overview of your finances and recent activity.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isReadOnly && (
                            <Badge
                                variant="outline"
                                className="border-amber-500/50 bg-amber-500/10 text-amber-600 backdrop-blur-sm dark:border-amber-400/30 dark:text-amber-400">
                                <Eye className="mr-1.5 size-3.5" />
                                Read-Only
                            </Badge>
                        )}
                        <Badge
                            variant="secondary"
                            className="bg-background/50 capitalize backdrop-blur-sm">
                            {user.role}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 mb-4">
                <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
                <div className="flex items-center gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px] bg-background/50 backdrop-blur-sm transition-colors hover:bg-background/80">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m) => (
                                <SelectItem
                                    key={m.value}
                                    value={m.value}
                                    className="cursor-pointer">
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px] bg-background/50 backdrop-blur-sm transition-colors hover:bg-background/80">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y} className="cursor-pointer">
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-primary/5">
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-900/50 dark:text-indigo-400">
                            <Wallet className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div
                                    className={`text-3xl font-bold tracking-tight ${
                                        balance >= 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}>
                                    ${balance.toFixed(2)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    For selected period
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-primary/5">
                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Income</CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-900/50 dark:text-emerald-400">
                            <TrendingUp className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                    ${totalIncome.toFixed(2)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Total income this period
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-primary/5">
                    <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition-transform group-hover:scale-110 dark:bg-red-900/50 dark:text-red-400">
                            <TrendingDown className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                                    ${totalExpense.toFixed(2)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Total expenses this period
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-primary/5">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/50 dark:text-blue-400">
                            <ArrowLeftRight className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold tracking-tight">
                                    {stats?.totalTransactions || 0}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Total this period
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pie Chart — Category Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Expense by Category</CardTitle>
                        <CardDescription>
                            Category-wise spending breakdown for the selected period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {breakdownLoading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <Skeleton className="h-[250px] w-[250px] rounded-full" />
                            </div>
                        ) : pieData.length === 0 ? (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                                No expense data for this period.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={110}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) =>
                                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                                        }
                                        labelLine={false}>
                                        {pieData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value?: number) => [
                                            `$${(value ?? 0).toFixed(2)}`,
                                            "Amount",
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Bar Chart — Income vs Expenses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Income vs Expenses</CardTitle>
                        <CardDescription>
                            Monthly comparison over the last 12 months
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trendsLoading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <Skeleton className="h-[280px] w-full" />
                            </div>
                        ) : trendsChartData.length === 0 ? (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                                No data available yet.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={trendsChartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        className="fill-muted-foreground"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        className="fill-muted-foreground"
                                        tickFormatter={(v) => `$${v}`}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) =>
                                            `$${(value ?? 0).toFixed(2)}`
                                        }
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="income"
                                        fill="#22c55e"
                                        name="Income"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="expense"
                                        fill="#ef4444"
                                        name="Expense"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Line Chart — Monthly Trends */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Monthly Trends</CardTitle>
                    <CardDescription>
                        Income and expense trends over the last 12 months
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {trendsLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <Skeleton className="h-[280px] w-full" />
                        </div>
                    ) : trendsChartData.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                            No data available yet. Start adding transactions!
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendsChartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12 }}
                                    className="fill-muted-foreground"
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    className="fill-muted-foreground"
                                    tickFormatter={(v) => `$${v}`}
                                />
                                <Tooltip
                                    formatter={(value?: number) => `$${(value ?? 0).toFixed(2)}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ fill: "#22c55e", r: 4 }}
                                    name="Income"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ fill: "#ef4444", r: 4 }}
                                    name="Expense"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="net"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: "#6366f1", r: 4 }}
                                    name="Net"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <h2 className="text-xl font-semibold tracking-tight mt-10 mb-4">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-3">
                <Button
                    variant="outline"
                    className="group relative h-auto flex-col items-start gap-4 overflow-hidden border-border/50 bg-card p-6 text-left hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                    disabled={!canWrite}
                    onClick={() => router.push("/dashboard/transactions")}>
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-900/50 dark:text-indigo-400">
                        <Plus className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">Add Transaction</h3>
                        <p className="font-normal text-muted-foreground mt-1 whitespace-normal">
                            Record a new income or expense.
                        </p>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="group relative h-auto flex-col items-start gap-4 overflow-hidden border-border/50 bg-card p-6 text-left hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                    onClick={() => router.push("/dashboard/transactions")}>
                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/50 dark:text-blue-400">
                        <ArrowLeftRight className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">View Transactions</h3>
                        <p className="font-normal text-muted-foreground mt-1 whitespace-normal">
                            Search and filter past transactions.
                        </p>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="group relative h-auto flex-col items-start gap-4 overflow-hidden border-border/50 bg-card p-6 text-left hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                    onClick={() => router.push("/dashboard/categories")}>
                    <div className="absolute inset-0 bg-linear-to-br from-pink-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-pink-100 text-pink-600 transition-transform group-hover:scale-110 dark:bg-pink-900/50 dark:text-pink-400">
                        <Wallet className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">Manage Categories</h3>
                        <p className="font-normal text-muted-foreground mt-1 whitespace-normal">
                            Customize your spending buckets.
                        </p>
                    </div>
                </Button>
            </div>
        </div>
    );
}
