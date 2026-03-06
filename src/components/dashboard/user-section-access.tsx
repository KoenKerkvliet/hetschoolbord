"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Profile, Section } from "@/lib/types/database";

interface UserSectionAccessManagerProps {
  organizationId: string;
}

export function UserSectionAccessManager({
  organizationId,
}: UserSectionAccessManagerProps) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [accessMap, setAccessMap] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  async function fetchData() {
    const [profilesRes, sectionsRes, accessRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .order("display_name", { ascending: true }),
      supabase.from("sections").select("*").order("title", { ascending: true }),
      supabase.from("user_section_access").select("*"),
    ]);

    setProfiles(profilesRes.data ?? []);
    setSections(sectionsRes.data ?? []);

    const accessSet = new Set<string>();
    (accessRes.data ?? []).forEach((row) => {
      accessSet.add(`${row.profile_id}:${row.section_id}`);
    });
    setAccessMap(accessSet);
    setLoading(false);
  }

  async function toggleAccess(profileId: string, sectionId: string) {
    const key = `${profileId}:${sectionId}`;

    if (accessMap.has(key)) {
      // Verwijder toegang
      const { error } = await supabase
        .from("user_section_access")
        .delete()
        .eq("profile_id", profileId)
        .eq("section_id", sectionId);
      if (error) {
        toast.error("Fout bij bijwerken toegang");
        return;
      }
      const newMap = new Set(accessMap);
      newMap.delete(key);
      setAccessMap(newMap);
    } else {
      // Voeg toegang toe
      const { error } = await supabase
        .from("user_section_access")
        .insert({ profile_id: profileId, section_id: sectionId });
      if (error) {
        toast.error("Fout bij bijwerken toegang");
        return;
      }
      const newMap = new Set(accessMap);
      newMap.add(key);
      setAccessMap(newMap);
    }
  }

  async function toggleAllForSection(sectionId: string) {
    const allHaveAccess = profiles.every((p) =>
      accessMap.has(`${p.id}:${sectionId}`)
    );

    if (allHaveAccess) {
      // Verwijder toegang voor iedereen
      const { error } = await supabase
        .from("user_section_access")
        .delete()
        .eq("section_id", sectionId);
      if (error) {
        toast.error("Fout bij bijwerken");
        return;
      }
      const newMap = new Set(accessMap);
      profiles.forEach((p) => newMap.delete(`${p.id}:${sectionId}`));
      setAccessMap(newMap);
    } else {
      // Voeg toegang toe voor iedereen die het nog niet heeft
      const toInsert = profiles
        .filter((p) => !accessMap.has(`${p.id}:${sectionId}`))
        .map((p) => ({ profile_id: p.id, section_id: sectionId }));

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from("user_section_access")
          .insert(toInsert);
        if (error) {
          toast.error("Fout bij bijwerken");
          return;
        }
      }

      const newMap = new Set(accessMap);
      profiles.forEach((p) => newMap.add(`${p.id}:${sectionId}`));
      setAccessMap(newMap);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Laden...</p>;
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Gebruikers &amp; blokken zichtbaarheid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Maak eerst blokken aan via de Blokken pagina.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Gebruikers &amp; blokken zichtbaarheid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Geen gebruikers gevonden in deze organisatie.
          </p>
        </CardContent>
      </Card>
    );
  }

  const roleLabels: Record<string, string> = {
    viewer: "Viewer",
    editor: "Editor",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Gebruikers &amp; blokken zichtbaarheid
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Vink aan welke blokken zichtbaar zijn voor elke gebruiker op de
          frontend. Als er geen vinkjes staan, zien alle gebruikers alle
          blokken.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Gebruiker</th>
                <th className="text-left py-2 pr-4 font-medium">Rol</th>
                {sections.map((section) => (
                  <th key={section.id} className="text-center py-2 px-2 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">{section.title}</span>
                      <input
                        type="checkbox"
                        className="h-3 w-3 cursor-pointer"
                        checked={profiles.every((p) =>
                          accessMap.has(`${p.id}:${section.id}`)
                        )}
                        onChange={() => toggleAllForSection(section.id)}
                        title="Selecteer alles"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    {profile.display_name || "Naamloos"}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline" className="text-xs">
                      {roleLabels[profile.role] || profile.role}
                    </Badge>
                  </td>
                  {sections.map((section) => (
                    <td key={section.id} className="text-center py-2 px-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer"
                        checked={accessMap.has(
                          `${profile.id}:${section.id}`
                        )}
                        onChange={() =>
                          toggleAccess(profile.id, section.id)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
