"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/auth-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      requiredRoles={["editor", "admin", "super_admin"]}
      redirectTo="/frontend"
    >
      <DashboardShell>{children}</DashboardShell>
    </RouteGuard>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <SidebarProvider>
      <AppSidebar profile={profile} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
