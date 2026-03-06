"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RefreshCw } from "lucide-react";

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
  const { user, profile, loading, authError, refreshProfile } = useAuth();
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

  // Stap 1: Auth is nog aan het laden → laadscherm
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  // Stap 2: Geen user → redirect loopt via useEffect, toon niets
  if (!user) return null;

  // Stap 3: User bestaat maar profiel ontbreekt → NOOIT een wit scherm!
  // Toon foutmelding met retry-knop zodat de gebruiker kan herstellen.
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground text-center">
          {authError || "Er ging iets mis bij het laden van je profiel."}
        </p>
        <button
          onClick={() => refreshProfile()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Opnieuw proberen
        </button>
      </div>
    );
  }

  // Stap 4: Verkeerde rol → redirect loopt via useEffect, toon niets
  if (requiredRoles && !requiredRoles.includes(profile.role)) return null;

  // Stap 5: Alles OK → toon de content
  return <>{children}</>;
}
