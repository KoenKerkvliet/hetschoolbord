"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ContentItem, Role } from "@/lib/types/database";

interface ContentDisplayProps {
  organizationId: string;
  initialContent: ContentItem[];
  userRole: Role;
}

export function ContentDisplay({
  organizationId,
  initialContent,
  userRole,
}: ContentDisplayProps) {
  const [content, setContent] = useState<ContentItem[]>(initialContent);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to realtime changes on the content table
    const channel = supabase
      .channel("content-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content",
          filter: `organization_id=eq.${organizationId}`,
        },
        async () => {
          // Refetch all published content on any change
          const { data } = await supabase
            .from("content")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("is_published", true)
            .order("sort_order", { ascending: true });

          if (data) {
            setContent(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, supabase]);

  const showBackButton = userRole !== "viewer";

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Back to dashboard button (non-viewers only) */}
      {showBackButton && (
        <div className="fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" asChild className="bg-black/50 border-white/20 text-white hover:bg-black/70">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      )}

      {/* Content area */}
      {content.length === 0 ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-light text-white/60">
              Het Schoolbord
            </h2>
            <p className="text-white/40">
              Er is nog geen content gepubliceerd.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-screen gap-4 p-8">
          {content.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCard({ item }: { item: ContentItem }) {
  const data = item.data as Record<string, string>;

  return (
    <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
      <h3 className="text-xl font-semibold">{item.title}</h3>
      {item.type === "text" && data.body && (
        <p className="mt-2 text-white/80 whitespace-pre-wrap">{data.body}</p>
      )}
      {item.type === "announcement" && (
        <div className="mt-2">
          <p className="text-lg text-yellow-300">{data.body}</p>
        </div>
      )}
    </div>
  );
}
