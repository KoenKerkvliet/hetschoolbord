"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

const roleLabels: Record<string, string> = {
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function FrontendProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  if (!user || !profile) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile!.id);

    if (error) {
      toast.error("Opslaan mislukt", { description: error.message });
    } else {
      toast.success("Profiel bijgewerkt");
      await refreshProfile();
    }

    setSaving(false);
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setResetSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      toast.error("Wachtwoord herstellen mislukt", {
        description: error.message,
      });
    } else {
      toast.success("Herstel-e-mail verzonden", {
        description:
          "Check je inbox voor een link om je wachtwoord te wijzigen.",
      });
    }

    setResetSending(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Profiel gegevens */}
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
              <Input value={user.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Weergavenaam</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Je naam"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Opslaan..." : "Opslaan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Wachtwoord herstellen */}
      <Card>
        <CardHeader>
          <CardTitle>Wachtwoord</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ontvang een e-mail om je wachtwoord te wijzigen.
          </p>
          <Button
            variant="outline"
            onClick={handlePasswordReset}
            disabled={resetSending}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {resetSending ? "Verzenden..." : "Wachtwoord herstellen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
