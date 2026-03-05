"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function RouteGuard({
  children,
  requiredRoles,
  redirectTo,
}: RouteGuardProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (requiredRoles && profile && !requiredRoles.includes(profile.role)) {
      router.replace(redirectTo ?? "/frontend");
      return;
    }
  }, [user, profile, loading, requiredRoles, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!user || !profile) return null;
  if (requiredRoles && !requiredRoles.includes(profile.role)) return null;

  return <>{children}</>;
}
