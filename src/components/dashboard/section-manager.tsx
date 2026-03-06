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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import { SectionItemsEditor } from "@/components/dashboard/section-items-editor";
import type { Section } from "@/lib/types/database";

export function SectionManager() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionType, setSectionType] = useState("snelkoppelingen");
  const [sectionColumns, setSectionColumns] = useState(4);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useFetchOnMount(() => {
    fetchSections();
  }, [profile?.organization_id]);

  async function fetchSections() {
    if (!profile?.organization_id) return;
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: true });
    setSections(data ?? []);
    setLoading(false);
  }

  async function handleSaveSection() {
    if (!sectionTitle.trim() || !profile?.organization_id) return;

    if (editingSection) {
      const updateData: Record<string, unknown> = { title: sectionTitle };
      if (editingSection.type === "snelkoppelingen") {
        updateData.columns = sectionColumns;
      }
      const { error } = await supabase
        .from("sections")
        .update(updateData)
        .eq("id", editingSection.id);
      if (error) {
        toast.error("Fout bij bijwerken blok");
        return;
      }
      toast.success("Blok bijgewerkt");
    } else {
      const { error } = await supabase.from("sections").insert({
        title: sectionTitle,
        type: sectionType,
        columns: sectionType === "snelkoppelingen" ? sectionColumns : 1,
        organization_id: profile.organization_id,
      });
      if (error) {
        toast.error("Fout bij aanmaken blok");
        return;
      }
      toast.success("Blok aangemaakt");
    }

    setDialogOpen(false);
    setSectionTitle("");
    setEditingSection(null);
    fetchSections();
  }

  async function handleDeleteSection(id: string) {
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) {
      toast.error("Fout bij verwijderen blok");
      return;
    }
    toast.success("Blok verwijderd");
    if (expandedSection === id) setExpandedSection(null);
    fetchSections();
  }

  function openEditDialog(section: Section) {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionType(section.type);
    setSectionColumns(section.columns ?? 4);
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingSection(null);
    setSectionTitle("");
    setSectionType("snelkoppelingen");
    setSectionColumns(4);
    setDialogOpen(true);
  }

  if (loading) {
    return <p className="text-muted-foreground">Laden...</p>;
  }

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuw blok
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "Blok bewerken" : "Nieuw blok"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="Bijv. Snelkoppelingen, Mededelingen"
              />
            </div>
            {!editingSection && (
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={sectionType}
                  onValueChange={(v) => setSectionType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="snelkoppelingen">
                      Snelkoppelingen
                    </SelectItem>
                    <SelectItem value="mededelingen">Mededelingen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(sectionType === "snelkoppelingen" || editingSection?.type === "snelkoppelingen") && (
              <div className="space-y-2">
                <Label>Kolommen</Label>
                <Select
                  value={String(sectionColumns)}
                  onValueChange={(v) => setSectionColumns(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 per rij</SelectItem>
                    <SelectItem value="3">3 per rij</SelectItem>
                    <SelectItem value="4">4 per rij</SelectItem>
                    <SelectItem value="5">5 per rij</SelectItem>
                    <SelectItem value="6">6 per rij</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Aantal cards naast elkaar op de frontend.
                </p>
              </div>
            )}
            <Button onClick={handleSaveSection} className="w-full">
              {editingSection ? "Opslaan" : "Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {sections.length === 0 ? (
        <p className="text-muted-foreground">
          Nog geen blokken. Maak een blok aan om te beginnen.
        </p>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2 text-left"
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === section.id ? null : section.id
                      )
                    }
                  >
                    {expandedSection === section.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <Badge variant="secondary">
                      {section.type === "snelkoppelingen" ? (
                        <LinkIcon className="mr-1 h-3 w-3" />
                      ) : (
                        <MessageSquare className="mr-1 h-3 w-3" />
                      )}
                      {section.type}
                    </Badge>
                    {section.type === "snelkoppelingen" && (
                      <Badge variant="outline">
                        {section.columns ?? 4} kolommen
                      </Badge>
                    )}
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(section)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedSection === section.id && (
                <CardContent>
                  <SectionItemsEditor
                    sectionId={section.id}
                    sectionType={section.type}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
