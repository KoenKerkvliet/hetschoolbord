"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Organization } from "@/lib/types/database";

interface SettingsFormProps {
  organization: Organization;
}

export function SettingsForm({ organization }: SettingsFormProps) {
  const [name, setName] = useState(organization.name);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("organizations")
      .update({ name })
      .eq("id", organization.id);

    if (error) {
      toast.error("Opslaan mislukt", { description: error.message });
    } else {
      toast.success("Instellingen opgeslagen");
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>School informatie</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Schoolnaam</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={organization.slug} disabled />
            <p className="text-xs text-muted-foreground">
              De slug kan niet worden gewijzigd.
            </p>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Opslaan..." : "Opslaan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
