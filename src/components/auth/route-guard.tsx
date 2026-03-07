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

  // Redirect-logica: alleen uitvoeren NADAT loading klaar is
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

  // ─── OPTIMISTISCH RENDEREN ───
  // Auth-check loopt nog, maar we HEBBEN een gecacht profiel.
  // Toon de content alvast zodat de gebruiker geen laadscherm ziet.
  // Als de auth-check later faalt, handelt de useEffect redirect af.
  if (loading && profile) {
    // Check rolbeperking ook optimistisch
    if (requiredRoles && !requiredRoles.includes(profile.role)) {
      // Verkeerde rol → toon loading (redirect volgt na auth-check)
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Laden...</p>
        </div>
      );
    }
    // ✅ Profiel gecacht + rol OK → toon content meteen
    return <>{children}</>;
  }

  // ─── GEEN CACHE, NOG AAN HET LADEN ───
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  // ─── AUTH-CHECK AFGEROND ───

  // Geen user → redirect loopt via useEffect
  if (!user) return null;

  // User bestaat maar profiel ontbreekt → foutscherm met retry
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

  // Verkeerde rol → redirect loopt via useEffect
  if (requiredRoles && !requiredRoles.includes(profile.role)) return null;

  // ✅ Alles OK → toon content
  return <>{children}</>;
}
