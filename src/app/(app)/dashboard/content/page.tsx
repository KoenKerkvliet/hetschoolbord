"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ContentManager } from "@/components/dashboard/content-manager";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContentItem } from "@/lib/types/database";

export default function ContentPage() {
  const { user, profile } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from("content")
        .select("*")
        .order("sort_order", { ascending: true });
      setContent(data ?? []);
      setLoading(false);
    }
    fetchContent();
  }, [supabase]);

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
      <ContentManager
        initialContent={content}
        organizationId={profile!.organization_id!}
        userId={user!.id}
      />
    </div>
  );
}
