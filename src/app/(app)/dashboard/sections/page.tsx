"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { SectionManager } from "@/components/dashboard/section-manager";

export default function SectionsPage() {
  return (
    <RouteGuard requiredRoles={["admin", "super_admin"]} redirectTo="/dashboard">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Secties</h1>
        <SectionManager />
      </div>
    </RouteGuard>
  );
}
