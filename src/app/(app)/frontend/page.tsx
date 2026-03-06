"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { PageRenderer } from "@/components/frontend/page-renderer";
import { ContentDisplay } from "@/components/frontend/content-display";
import { generateThemeOverrides } from "@/lib/utils/color";
import { LayoutDashboard } from "lucide-react";
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

  const canAccessDashboard =
    profile?.role === "editor" ||
    profile?.role === "admin" ||
    profile?.role === "super_admin";

  useEffect(() => {
    async function fetchData() {
      try {
        if (!profile?.organization_id) return;

        // Fetch organization (voor themakleuren)
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.organization_id)
          .single();
        setOrganization(orgData);

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
      } catch (err) {
        console.error("Fout bij laden frontend:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  // Genereer CSS custom property overrides op basis van organisatie-instellingen
  const themeOverrides = organization
    ? generateThemeOverrides(
        organization.settings as Record<string, unknown>
      )
    : {};

  // Dashboard navigation button for editor+ users
  const dashboardButton = canAccessDashboard ? (
    <div className="fixed top-4 right-4 z-50">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        <LayoutDashboard className="h-4 w-4" />
        Beheer
      </Link>
    </div>
  ) : null;

  // If there are published pages, show with page navigation
  if (pages.length > 0) {
    return (
      <div className="min-h-screen bg-background" style={themeOverrides}>
        {dashboardButton}
        <PageRendererWithTabs pages={pages} />
      </div>
    );
  }

  // Fallback to legacy content display
  return (
    <div style={themeOverrides}>
      {dashboardButton}
      <ContentDisplay
        organizationId={profile.organization_id!}
        initialContent={legacyContent}
        userRole={profile.role}
      />
    </div>
  );
}

/**
 * Wrapper die pagina-tabbladen toont wanneer er 2+ pagina's zijn.
 * De tabs verschijnen als een dunne balk onder de hero.
 */
function PageRendererWithTabs({ pages }: { pages: Page[] }) {
  const [activePageId, setActivePageId] = useState(pages[0]?.id);

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  const showTabs = pages.length >= 2;

  return (
    <>
      <PageRenderer
        page={activePage}
        tabBar={
          showTabs ? (
            <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
              <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 py-1">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setActivePageId(page.id)}
                    className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      page.id === activePageId
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null
        }
      />
    </>
  );
}
