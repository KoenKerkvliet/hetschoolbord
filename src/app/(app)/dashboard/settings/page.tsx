"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { UserSectionAccessManager } from "@/components/dashboard/user-section-access";
import { Skeleton } from "@/components/ui/skeleton";
import type { Organization } from "@/lib/types/database";

export default function SettingsPage() {
  return (
    <RouteGuard requiredRoles={["admin", "super_admin"]} redirectTo="/dashboard">
      <SettingsContent />
    </RouteGuard>
  );
}

function SettingsContent() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.organization_id;

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", orgId!)
          .single();
        if (error) throw error;
        if (!cancelled) setOrganization(data);
      } catch (err) {
        console.error("Fout bij laden instellingen:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [orgId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Instellingen</h1>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Instellingen</h1>
      {organization ? (
        <>
          <SettingsForm organization={organization} />
          <UserSectionAccessManager organizationId={organization.id} />
        </>
      ) : (
        <p className="text-muted-foreground">Geen organisatie gekoppeld.</p>
      )}
    </div>
  );
}
