"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { usePermissionStore } from "@/store/permission-store";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const impersonatedUser = usePermissionStore((s) => s.impersonatedUser);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-primary border-muted" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {/* Top header bar */}
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 !h-4" />
                        {impersonatedUser && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Viewing as</span>
                                <span className="font-semibold">{impersonatedUser.name}</span>
                            </div>
                        )}
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-4 md:p-6">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
