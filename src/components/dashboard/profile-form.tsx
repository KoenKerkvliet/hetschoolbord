"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

const roleLabels: Record<string, string> = {
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
  super_admin: "Super Admin",
};

interface ProfileFormProps {
  profile: Profile;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);

    if (error) {
      toast.error("Opslaan mislukt", { description: error.message });
    } else {
      toast.success("Profiel bijgewerkt");
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Mijn profiel
          <Badge variant="secondary">{roleLabels[profile.role]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>E-mailadres</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Weergavenaam</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Opslaan..." : "Opslaan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
