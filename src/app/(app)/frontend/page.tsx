"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { FrontendHeader } from "@/components/frontend/frontend-header";
import { PageRenderer } from "@/components/frontend/page-renderer";
import { ContentDisplay } from "@/components/frontend/content-display";
import { generateThemeOverrides } from "@/lib/utils/color";
import { RefreshCw } from "lucide-react";
import type { Page, ContentItem, Organization } from "@/lib/types/database";

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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | undefined>();

  const orgId = profile?.organization_id;

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        if (!orgId) {
          setLoading(false);
          return;
        }

        setFetchError(null);

        // Fetch organization (voor themakleuren)
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", orgId)
          .single();
        if (!cancelled) setOrganization(orgData);

        // Fetch published pages
        const { data: pagesData } = await supabase
          .from("pages")
          .select("*")
          .eq("organization_id", orgId)
          .eq("is_published", true)
          .order("sort_order", { ascending: true });

        if (!cancelled) {
          setPages(pagesData ?? []);
          // Stel de eerste pagina in als actief (als er pagina's zijn)
          if (pagesData && pagesData.length > 0 && !activePageId) {
            setActivePageId(pagesData[0].id);
          }
        }

        // Also fetch legacy content (fallback if no pages exist)
        if (!pagesData || pagesData.length === 0) {
          const { data: contentData } = await supabase
            .from("content")
            .select("*")
            .eq("organization_id", orgId)
            .eq("is_published", true)
            .order("sort_order", { ascending: true });
          if (!cancelled) setLegacyContent(contentData ?? []);
        }
      } catch (err) {
        console.error("Fout bij laden frontend:", err);
        if (!cancelled)
          setFetchError("Er ging iets mis bij het laden van de content.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // Laadscherm
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  // Fout bij ophalen data
  if (fetchError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground text-center">{fetchError}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Opnieuw proberen
        </button>
      </div>
    );
  }

  // Fallback als profile niet beschikbaar is
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  // Genereer CSS custom property overrides
  const themeOverrides = organization
    ? generateThemeOverrides(
        organization.settings as Record<string, unknown>
      )
    : {};

  const activePage =
    pages.find((p) => p.id === activePageId) ?? pages[0] ?? null;

  // Met gepubliceerde pagina's
  if (pages.length > 0 && activePage) {
    return (
      <div className="min-h-screen bg-background" style={themeOverrides}>
        <FrontendHeader
          pages={pages}
          activePageId={activePageId}
          onPageChange={setActivePageId}
        />
        <PageRenderer page={activePage} />
      </div>
    );
  }

  // Fallback naar legacy content
  return (
    <div style={themeOverrides}>
      <FrontendHeader />
      <ContentDisplay
        organizationId={profile.organization_id!}
        initialContent={legacyContent}
        userRole={profile.role}
      />
    </div>
  );
}
