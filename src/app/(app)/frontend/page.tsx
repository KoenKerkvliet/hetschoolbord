"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { ContentDisplay } from "@/components/frontend/content-display";
import type { ContentItem } from "@/lib/types/database";

export default function FrontendPage() {
  return (
    <RouteGuard>
      <FrontendContent />
    </RouteGuard>
  );
}

function FrontendContent() {
  const { profile } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchContent() {
      if (!profile?.organization_id) return;
      const { data } = await supabase
        .from("content")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      setContent(data ?? []);
      setLoading(false);
    }
    fetchContent();
  }, [profile, supabase]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-white/40">Laden...</p>
      </div>
    );
  }

  return (
    <ContentDisplay
      organizationId={profile.organization_id!}
      initialContent={content}
      userRole={profile.role}
    />
  );
}
