"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import type { Section, SectionItem } from "@/lib/types/database";

export function SectionManager() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionType, setSectionType] = useState("snelkoppelingen");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  async function fetchSections() {
    const { data } = await supabase
      .from("sections")
      .select("*")
      .order("created_at", { ascending: true });
    setSections(data ?? []);
    setLoading(false);
  }

  async function handleSaveSection() {
    if (!sectionTitle.trim() || !profile?.organization_id) return;

    if (editingSection) {
      const { error } = await supabase
        .from("sections")
        .update({ title: sectionTitle })
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
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingSection(null);
    setSectionTitle("");
    setSectionType("snelkoppelingen");
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

function SectionItemsEditor({
  sectionId,
  sectionType,
}: {
  sectionId: string;
  sectionType: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SectionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    fetchItems();
  }, [sectionId]);

  async function fetchItems() {
    const { data } = await supabase
      .from("section_items")
      .select("*")
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setTitle("");
    setIcon("");
    setUrl("");
    setBody("");
    setDialogOpen(true);
  }

  function openEditDialog(item: SectionItem) {
    setEditingItem(item);
    setTitle(item.title);
    setIcon((item.data as Record<string, string>).icon ?? "");
    setUrl((item.data as Record<string, string>).url ?? "");
    setBody((item.data as Record<string, string>).body ?? "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) return;

    const data: Record<string, unknown> =
      sectionType === "snelkoppelingen"
        ? { icon, url }
        : { body };

    if (editingItem) {
      const { error } = await supabase
        .from("section_items")
        .update({ title, data })
        .eq("id", editingItem.id);
      if (error) {
        toast.error("Fout bij bijwerken");
        return;
      }
    } else {
      const maxSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
      const { error } = await supabase.from("section_items").insert({
        section_id: sectionId,
        title,
        data,
        sort_order: maxSort,
      });
      if (error) {
        toast.error("Fout bij aanmaken");
        return;
      }
    }

    setDialogOpen(false);
    fetchItems();
  }

  async function handleDelete(id: string) {
    await supabase.from("section_items").delete().eq("id", id);
    fetchItems();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const idx = items.findIndex((i) => i.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === items.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const currentOrder = items[idx].sort_order;
    const swapOrder = items[swapIdx].sort_order;

    await Promise.all([
      supabase
        .from("section_items")
        .update({ sort_order: swapOrder })
        .eq("id", items[idx].id),
      supabase
        .from("section_items")
        .update({ sort_order: currentOrder })
        .eq("id", items[swapIdx].id),
    ]);
    fetchItems();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="space-y-3">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-3 w-3" />
            Item toevoegen
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Item bewerken" : "Nieuw item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel"
              />
            </div>
            {sectionType === "snelkoppelingen" ? (
              <>
                <div className="space-y-2">
                  <Label>Icoon (Lucide naam)</Label>
                  <Input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Bijv. Home, Mail, Calendar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Bericht</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Typ je bericht..."
                  rows={4}
                />
              </div>
            )}
            <Button onClick={handleSave} className="w-full">
              {editingItem ? "Opslaan" : "Toevoegen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen items.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                {sectionType === "snelkoppelingen" && (
                  <p className="text-xs text-muted-foreground">
                    {(item.data as Record<string, string>).url}
                  </p>
                )}
                {sectionType === "mededelingen" && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {(item.data as Record<string, string>).body}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => handleMove(item.id, "up")}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === items.length - 1}
                  onClick={() => handleMove(item.id, "down")}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEditDialog(item)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
