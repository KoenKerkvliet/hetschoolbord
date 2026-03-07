"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { FrontendHeader } from "@/components/frontend/frontend-header";
import { FrontendProfileForm } from "@/components/frontend/frontend-profile-form";

export default function FrontendProfilePage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-background">
        <FrontendHeader />
        <main className="py-8 px-6">
          <FrontendProfileForm />
        </main>
      </div>
    </RouteGuard>
  );
}
