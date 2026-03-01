"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ArrowRight, ShieldCheck, Eye, User as UserIcon } from "lucide-react";

interface UserItem {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "read-only";
    createdAt: string;
}

export default function ManageUsersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && user.role !== "admin") {
            router.replace("/dashboard");
            return;
        }

        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/users");
                if (!res.ok) throw new Error("Failed to fetch users");
                const data = await res.json();
                setUsers(data.users);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [user, router]);

    if (!user || user.role !== "admin") return null;

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin":
                return (
                    <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20">
                        <ShieldCheck className="mr-1 size-3" />
                        Admin
                    </Badge>
                );
            case "read-only":
                return (
                    <Badge
                        variant="outline"
                        className="border-amber-500/50 text-amber-600 dark:text-amber-400">
                        <Eye className="mr-1 size-3" />
                        Read-only
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <UserIcon className="mr-1 size-3" />
                        User
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                    <Users className="size-7" />
                    Manage Users
                </h1>
                <p className="text-muted-foreground mt-1">
                    View and manage all registered users. Click on a user to view their dashboard.
                </p>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-[60%]" />
                                    <Skeleton className="h-3 w-[80%]" />
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((u) => {
                        const initials = u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                        return (
                            <Card
                                key={u.id}
                                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                                onClick={() => router.push(`/dashboard/users/${u.id}`)}>
                                <CardHeader className="flex flex-row items-center gap-4 pb-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">
                                            {u.name}
                                        </CardTitle>
                                        <CardDescription className="truncate">
                                            {u.email}
                                        </CardDescription>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CardHeader>
                                <CardContent className="flex items-center justify-between">
                                    {getRoleBadge(u.role)}
                                    <span className="text-xs text-muted-foreground">
                                        Joined{" "}
                                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </span>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {!isLoading && users.length === 0 && !error && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="size-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No users found</h3>
                        <p className="text-muted-foreground text-sm">
                            Users will appear here once they register.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
