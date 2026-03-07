"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { OrganizationManager } from "@/components/dashboard/organization-manager";

export default function OrganizationsPage() {
  return (
    <RouteGuard requiredRoles={["super_admin"]} redirectTo="/dashboard">
      <OrganizationManager />
    </RouteGuard>
  );
}
