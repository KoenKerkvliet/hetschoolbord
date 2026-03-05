"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { PagesList } from "@/components/dashboard/page-builder";

export default function PagesPage() {
  return (
    <RouteGuard requiredRoles={["admin", "super_admin"]} redirectTo="/dashboard">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Pagina&apos;s</h1>
        <PagesList />
      </div>
    </RouteGuard>
  );
}
