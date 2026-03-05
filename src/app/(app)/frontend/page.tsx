"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { PageRenderer } from "@/components/frontend/page-renderer";
import { ContentDisplay } from "@/components/frontend/content-display";
import type { Page, ContentItem } from "@/lib/types/database";

export default function FrontendPage() {
  return (
    <RouteGuard>
      <FrontendContent />
    </RouteGuard>
  );
}

function FrontendContent() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [pages, setPages] = useState<Page[]>([]);
  const [legacyContent, setLegacyContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!profile?.organization_id) return;

      // Fetch published pages
      const { data: pagesData } = await supabase
        .from("pages")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      setPages(pagesData ?? []);

      // Also fetch legacy content (fallback if no pages exist)
      if (!pagesData || pagesData.length === 0) {
        const { data: contentData } = await supabase
          .from("content")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true });
        setLegacyContent(contentData ?? []);
      }

      setLoading(false);
    }
    fetchData();
  }, [profile, supabase]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  // If there are published pages, show the first one
  if (pages.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageRenderer page={pages[0]} />
      </div>
    );
  }

  // Fallback to legacy content display
  return (
    <ContentDisplay
      organizationId={profile.organization_id!}
      initialContent={legacyContent}
      userRole={profile.role}
    />
  );
}
