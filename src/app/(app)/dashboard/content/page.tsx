import { createClient } from "@/lib/supabase/server";
import { ContentManager } from "@/components/dashboard/content-manager";

export default async function ContentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: content } = await supabase
    .from("content")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content</h1>
      <ContentManager
        initialContent={content ?? []}
        organizationId={profile!.organization_id!}
        userId={user!.id}
      />
    </div>
  );
}
