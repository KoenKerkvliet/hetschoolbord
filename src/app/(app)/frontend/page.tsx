import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentDisplay } from "@/components/frontend/content-display";

export default async function FrontendPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) redirect("/login");

  // Fetch initial published content
  const { data: initialContent } = await supabase
    .from("content")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  return (
    <ContentDisplay
      organizationId={profile.organization_id}
      initialContent={initialContent ?? []}
      userRole={profile.role}
    />
  );
}
