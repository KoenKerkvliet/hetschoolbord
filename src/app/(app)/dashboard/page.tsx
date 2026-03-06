"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Boxes, PanelsTopLeft, FileText } from "lucide-react";

export default function DashboardPage() {
  const { profile } = useAuth();
  const [sectionCount, setSectionCount] = useState<number | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) return;
    const supabase = createClient();

    async function fetchStats() {
      try {
        const orgId = profile!.organization_id!;
        const [sections, items, pages] = await Promise.all([
          supabase
            .from("sections")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", orgId),
          supabase
            .from("section_items")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("pages")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("is_published", true),
        ]);
        setSectionCount(sections.count ?? 0);
        setItemCount(items.count ?? 0);
        setPageCount(pages.count ?? 0);
      } catch {
        // Stats niet beschikbaar
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [profile?.organization_id]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blokken</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{sectionCount}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Content items
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{itemCount}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Gepubliceerde pagina&apos;s
            </CardTitle>
            <PanelsTopLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{pageCount}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
