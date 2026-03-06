"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getContrastForeground } from "@/lib/utils/color";
import type { Organization } from "@/lib/types/database";

interface SettingsFormProps {
  organization: Organization;
}

export function SettingsForm({ organization }: SettingsFormProps) {
  const settings = organization.settings as Record<string, unknown>;
  const [name, setName] = useState(organization.name);
  const [primaryColor, setPrimaryColor] = useState<string>(
    (settings.primary_color as string) || "#1a1a1a"
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    (settings.secondary_color as string) || "#f5f5f5"
  );
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        settings: {
          ...settings,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        },
      })
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

          {/* Themakleuren */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <h3 className="text-sm font-medium">Themakleuren</h3>
              <p className="text-xs text-muted-foreground">
                Pas de kleuren aan die op het schoolbord worden gebruikt.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primaire kleur</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1a1a1a"
                  className="w-28 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secundaire kleur</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input p-1"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#f5f5f5"
                  className="w-28 font-mono text-sm"
                />
              </div>
            </div>

            {/* Live voorbeeld */}
            <div className="rounded-md border p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Voorbeeld:</p>
              <div className="flex gap-2">
                <div
                  className="rounded px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: primaryColor,
                    color: getContrastForeground(primaryColor),
                  }}
                >
                  Primair
                </div>
                <div
                  className="rounded px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: secondaryColor,
                    color: getContrastForeground(secondaryColor),
                  }}
                >
                  Secundair
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Opslaan..." : "Opslaan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
