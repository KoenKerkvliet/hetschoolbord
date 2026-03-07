"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SectionItemsEditor } from "@/components/dashboard/section-items-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import type { Section } from "@/lib/types/database";

export default function ContentPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
          .from("sections")
          .select("*")
          .eq("organization_id", orgId!)
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!cancelled) setSections(data ?? []);
      } catch (err) {
        console.error("Fout bij laden content:", err);
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
        <h1 className="text-2xl font-bold">Content</h1>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content</h1>

      {sections.length === 0 ? (
        <p className="text-muted-foreground">
          Nog geen blokken aangemaakt. Een admin kan blokken aanmaken via de
          Blokken pagina.
        </p>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <button
                  className="flex items-center gap-2 text-left w-full"
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === section.id ? null : section.id
                    )
                  }
                >
                  {expandedSection === section.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <Badge variant="secondary">
                    {section.type === "snelkoppelingen" ? (
                      <LinkIcon className="mr-1 h-3 w-3" />
                    ) : (
                      <MessageSquare className="mr-1 h-3 w-3" />
                    )}
                    {section.type}
                  </Badge>
                </button>
              </CardHeader>
              {expandedSection === section.id && (
                <CardContent>
                  <SectionItemsEditor
                    sectionId={section.id}
                    sectionType={section.type}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
