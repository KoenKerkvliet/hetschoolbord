"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { SettingsForm } from "@/components/dashboard/settings-form";
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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrg() {
      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();
      setOrganization(data);
      setLoading(false);
    }
    fetchOrg();
  }, [profile, supabase]);

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
        <SettingsForm organization={organization} />
      ) : (
        <p className="text-muted-foreground">Geen organisatie gekoppeld.</p>
      )}
    </div>
  );
}
