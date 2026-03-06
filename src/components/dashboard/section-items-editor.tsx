"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import { IconPicker } from "@/components/dashboard/icon-picker";
import type { SectionItem } from "@/lib/types/database";

export function SectionItemsEditor({
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

    // URL normaliseren: protocol toevoegen als het ontbreekt
    let normalizedUrl = url;
    if (sectionType === "snelkoppelingen" && url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("//")) {
      normalizedUrl = `https://${url}`;
    }

    const data: Record<string, unknown> =
      sectionType === "snelkoppelingen" ? { icon, url: normalizedUrl } : { body };

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
      const maxSort =
        items.length > 0
          ? Math.max(...items.map((i) => i.sort_order)) + 1
          : 0;
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

  if (loading)
    return <p className="text-sm text-muted-foreground">Laden...</p>;

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
                  <Label>Icoon</Label>
                  <IconPicker value={icon} onChange={setIcon} />
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
