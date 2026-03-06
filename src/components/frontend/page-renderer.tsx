"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SectionRenderer } from "@/components/frontend/section-renderer";
import type {
  Page,
  PageRow,
  PageRowSection,
  Section,
} from "@/lib/types/database";

interface PageRendererProps {
  page: Page;
  tabBar?: React.ReactNode;
}

type RowWithSections = PageRow & {
  sections: (PageRowSection & { section: Section })[];
};

export function PageRenderer({ page, tabBar }: PageRendererProps) {
  const supabase = createClient();
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<RowWithSections[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLayout() {
      const { data: pageRows } = await supabase
        .from("page_rows")
        .select("*")
        .eq("page_id", page.id)
        .order("sort_order", { ascending: true });

      if (!pageRows || pageRows.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Bepaal welke secties de gebruiker mag zien
      let accessibleSectionIds: Set<string> | null = null;
      const isAdmin =
        profile?.role === "admin" || profile?.role === "super_admin";

      if (!isAdmin && user) {
        // Check of er uberhaupt access records bestaan
        const { data: anyAccess } = await supabase
          .from("user_section_access")
          .select("id")
          .limit(1);

        if (anyAccess && anyAccess.length > 0) {
          // Access is geconfigureerd, filter op gebruiker
          const { data: userAccess } = await supabase
            .from("user_section_access")
            .select("section_id")
            .eq("profile_id", user.id);

          accessibleSectionIds = new Set(
            (userAccess ?? []).map((a) => a.section_id)
          );
        }
        // Als er geen access records zijn, toon alles (accessibleSectionIds blijft null)
      }

      const rowsWithSections = await Promise.all(
        pageRows.map(async (row) => {
          const { data: rowSections } = await supabase
            .from("page_row_sections")
            .select("*")
            .eq("page_row_id", row.id)
            .order("sort_order", { ascending: true });

          const sectionIds = (rowSections ?? []).map((rs) => rs.section_id);
          const { data: sectionsData } =
            sectionIds.length > 0
              ? await supabase.from("sections").select("*").in("id", sectionIds)
              : { data: [] as Section[] };

          const sectionsMap = new Map(
            (sectionsData ?? []).map((s) => [s.id, s])
          );

          const enriched = (rowSections ?? [])
            .map((rs) => ({
              ...rs,
              section: sectionsMap.get(rs.section_id) as Section,
            }))
            .filter(
              (rs) =>
                rs.section &&
                (accessibleSectionIds === null ||
                  accessibleSectionIds.has(rs.section_id))
            );

          return { ...row, sections: enriched };
        })
      );

      setRows(rowsWithSections);
      setLoading(false);
    }
    fetchLayout();
  }, [page.id, user, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      {page.hero_enabled && (
        <div
          className={`relative ${
            page.hero_full_width ? "w-full" : "mx-auto max-w-5xl"
          }`}
        >
          <div
            className="flex flex-col items-center justify-center gap-2 bg-primary/10 px-6 py-16 text-center"
            style={
              page.hero_image_url
                ? {
                    backgroundImage: `url(${page.hero_image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {page.hero_image_url && (
              <div className="absolute inset-0 bg-black/40" />
            )}
            <div className="relative z-10">
              {page.hero_title && (
                <h1
                  className={`text-3xl font-bold md:text-5xl ${
                    page.hero_image_url ? "text-white" : ""
                  }`}
                >
                  {page.hero_title}
                </h1>
              )}
              {page.hero_subtitle && (
                <p
                  className={`mt-2 text-lg ${
                    page.hero_image_url
                      ? "text-white/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {page.hero_subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab navigatie (alleen bij 2+ pagina's) */}
      {tabBar}

      {/* Rows — afwisselend wit en lichte primary tint */}
      {rows.map((row, idx) => {
        const isAlternate = idx % 2 === 1;
        const bgClass = isAlternate ? "bg-primary/5" : "bg-background";

        if (row.layout === "full") {
          const section = row.sections.find(
            (s) => s.position === "full"
          )?.section;
          if (!section) return null;
          return (
            <div key={row.id} className={`${bgClass} py-6`}>
              <div className="mx-auto max-w-5xl px-6">
                <SectionRenderer section={section} />
              </div>
            </div>
          );
        }

        // Half layout
        const leftSection = row.sections.find(
          (s) => s.position === "left"
        )?.section;
        const rightSection = row.sections.find(
          (s) => s.position === "right"
        )?.section;

        if (!leftSection && !rightSection) return null;

        return (
          <div key={row.id} className={`${bgClass} py-6`}>
            <div className="mx-auto max-w-5xl px-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>{leftSection && <SectionRenderer section={leftSection} />}</div>
                <div>
                  {rightSection && <SectionRenderer section={rightSection} />}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {rows.length === 0 && !page.hero_enabled && (
        <div className="text-center py-12 px-6">
          <p className="text-muted-foreground">
            Deze pagina heeft nog geen inhoud.
          </p>
        </div>
      )}
    </div>
  );
}
