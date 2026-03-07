"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useFetchOnMount } from "@/lib/hooks/use-fetch-on-mount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  UserMinus,
  Building2,
} from "lucide-react";
import type { Organization, Profile, Role } from "@/lib/types/database";

const roleLabels: Record<string, string> = {
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
  super_admin: "Super Admin",
};

const roleOptions: { value: Role; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export function OrganizationManager() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  // Delete confirmation state
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);

  // Expanded state
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  useFetchOnMount(() => {
    if (authLoading) return;
    fetchData();
  }, [authLoading]);

  async function fetchData() {
    try {
      const [orgsRes, profilesRes] = await Promise.all([
        supabase
          .from("organizations")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("profiles")
          .select("*")
          .order("display_name", { ascending: true }),
      ]);
      setOrganizations(orgsRes.data ?? []);
      setProfiles(profilesRes.data ?? []);
    } catch (err) {
      console.error("Fout bij laden organisaties:", err);
    } finally {
      setLoading(false);
    }
  }

  // Slug genereren uit naam
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function openCreateDialog() {
    setEditingOrg(null);
    setOrgName("");
    setOrgSlug("");
    setDialogOpen(true);
  }

  function openEditDialog(org: Organization) {
    setEditingOrg(org);
    setOrgName(org.name);
    setOrgSlug(org.slug);
    setDialogOpen(true);
  }

  async function handleSaveOrg() {
    if (!orgName.trim()) return;

    const slug = orgSlug.trim() || generateSlug(orgName);

    if (editingOrg) {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName })
        .eq("id", editingOrg.id);
      if (error) {
        toast.error("Fout bij bijwerken organisatie", {
          description: error.message,
        });
        return;
      }
      toast.success("Organisatie bijgewerkt");
    } else {
      const { error } = await supabase.from("organizations").insert({
        name: orgName,
        slug,
      });
      if (error) {
        toast.error("Fout bij aanmaken organisatie", {
          description: error.message,
        });
        return;
      }
      toast.success("Organisatie aangemaakt");
    }

    setDialogOpen(false);
    setEditingOrg(null);
    fetchData();
  }

  async function handleDeleteOrg() {
    if (!deleteOrg) return;

    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", deleteOrg.id);

    if (error) {
      toast.error("Fout bij verwijderen organisatie", {
        description: error.message,
      });
    } else {
      toast.success("Organisatie verwijderd");
      if (expandedOrg === deleteOrg.id) setExpandedOrg(null);
      fetchData();
    }
    setDeleteOrg(null);
  }

  async function handleChangeRole(profileId: string, newRole: Role) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);

    if (error) {
      toast.error("Fout bij wijzigen rol", { description: error.message });
    } else {
      toast.success("Rol bijgewerkt");
      fetchData();
    }
  }

  async function handleUnlinkUser(profileId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ organization_id: null })
      .eq("id", profileId);

    if (error) {
      toast.error("Fout bij ontkoppelen gebruiker", {
        description: error.message,
      });
    } else {
      toast.success("Gebruiker ontkoppeld");
      fetchData();
    }
  }

  async function handleLinkUser(profileId: string, orgId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ organization_id: orgId })
      .eq("id", profileId);

    if (error) {
      toast.error("Fout bij koppelen gebruiker", {
        description: error.message,
      });
    } else {
      toast.success("Gebruiker gekoppeld aan organisatie");
      fetchData();
    }
  }

  // Helpers
  function getOrgProfiles(orgId: string): Profile[] {
    return profiles.filter((p) => p.organization_id === orgId);
  }

  const unassignedProfiles = profiles.filter((p) => !p.organization_id);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Organisaties</h1>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organisaties</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe organisatie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingOrg
                  ? "Organisatie bewerken"
                  : "Nieuwe organisatie"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (!editingOrg) {
                      setOrgSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="Bijv. Basisschool De Linde"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="basisschool-de-linde"
                  disabled={!!editingOrg}
                />
                <p className="text-xs text-muted-foreground">
                  {editingOrg
                    ? "De slug kan niet worden gewijzigd."
                    : "Wordt automatisch gegenereerd uit de naam."}
                </p>
              </div>
              <Button onClick={handleSaveOrg} className="w-full">
                {editingOrg ? "Opslaan" : "Aanmaken"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organisatie lijst */}
      {organizations.length === 0 ? (
        <p className="text-muted-foreground">
          Nog geen organisaties. Maak een organisatie aan om te beginnen.
        </p>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => {
            const orgProfiles = getOrgProfiles(org.id);
            const isExpanded = expandedOrg === org.id;

            return (
              <Card key={org.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 text-left"
                      onClick={() =>
                        setExpandedOrg(isExpanded ? null : org.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <CardTitle className="text-base">{org.name}</CardTitle>
                      <Badge variant="outline">{org.slug}</Badge>
                      <Badge variant="secondary">
                        {orgProfiles.length} gebruiker
                        {orgProfiles.length !== 1 ? "s" : ""}
                      </Badge>
                    </button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(org)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteOrg(org)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    {orgProfiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Geen gebruikers in deze organisatie.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 pr-4 font-medium">
                                Naam
                              </th>
                              <th className="text-left py-2 pr-4 font-medium">
                                Rol
                              </th>
                              <th className="text-right py-2 font-medium">
                                Acties
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {orgProfiles.map((p) => (
                              <tr
                                key={p.id}
                                className="border-b last:border-0"
                              >
                                <td className="py-2 pr-4">
                                  {p.display_name || "Naamloos"}
                                </td>
                                <td className="py-2 pr-4">
                                  <Select
                                    value={p.role}
                                    onValueChange={(v) =>
                                      handleChangeRole(p.id, v as Role)
                                    }
                                  >
                                    <SelectTrigger className="w-36 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roleOptions.map((opt) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="py-2 text-right">
                                  {p.id !== profile?.id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUnlinkUser(p.id)}
                                      title="Ontkoppelen"
                                    >
                                      <UserMinus className="mr-1 h-3 w-3" />
                                      Ontkoppelen
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Niet-gekoppelde gebruikers */}
      {unassignedProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Niet-gekoppelde gebruikers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deze gebruikers zijn niet gekoppeld aan een organisatie. Kies een
              organisatie om ze te koppelen.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Naam</th>
                    <th className="text-left py-2 pr-4 font-medium">Rol</th>
                    <th className="text-left py-2 font-medium">Organisatie</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedProfiles.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {p.display_name || "Naamloos"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">
                          {roleLabels[p.role] || p.role}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Select
                          onValueChange={(orgId) =>
                            handleLinkUser(p.id, orgId)
                          }
                        >
                          <SelectTrigger className="w-48 h-8">
                            <SelectValue placeholder="Kies organisatie..." />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete bevestiging */}
      <AlertDialog
        open={!!deleteOrg}
        onOpenChange={(open) => !open && setDeleteOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Organisatie verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{deleteOrg?.name}</strong> wilt
              verwijderen? Alle gebruikers worden losgekoppeld van deze
              organisatie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrg}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
