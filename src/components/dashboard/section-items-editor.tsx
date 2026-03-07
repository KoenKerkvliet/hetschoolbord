"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, CalendarDays } from "lucide-react";
import { IconPicker } from "@/components/dashboard/icon-picker";
import { TiptapEditor } from "@/components/dashboard/tiptap-editor";
import type { SectionItem } from "@/lib/types/database";

export function SectionItemsEditor({
  sectionId,
  sectionType,
}: {
  sectionId: string;
  sectionType: string;
}) {
  const supabase = createClient();
  const { profile } = useAuth();
  const [items, setItems] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SectionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [visibleFrom, setVisibleFrom] = useState<string | null>(null);
  const [visibleUntil, setVisibleUntil] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("section_items")
        .select("*")
        .eq("section_id", sectionId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setItems(data ?? []);
    } catch (err) {
      console.error("Fout bij laden items:", err);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function openCreateDialog() {
    setEditingItem(null);
    setTitle("");
    setIcon("");
    setUrl("");
    setBody("");
    setVisibleFrom(null);
    setVisibleUntil(null);
    setDialogOpen(true);
  }

  function openEditDialog(item: SectionItem) {
    setEditingItem(item);
    setTitle(item.title);
    const itemData = item.data as Record<string, string>;
    setIcon(itemData.icon ?? "");
    setUrl(itemData.url ?? "");
    setBody(itemData.body ?? "");
    setVisibleFrom(itemData.visible_from ?? null);
    setVisibleUntil(itemData.visible_until ?? null);
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
      sectionType === "snelkoppelingen"
        ? { icon, url: normalizedUrl }
        : {
            body,
            author_name: editingItem
              ? (editingItem.data as Record<string, string>).author_name ?? profile?.display_name ?? "Onbekend"
              : profile?.display_name ?? "Onbekend",
            visible_from: visibleFrom,
            visible_until: visibleUntil,
          };

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
        created_by: profile?.id ?? null,
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
        <DialogContent className={sectionType === "mededelingen" ? "sm:max-w-2xl" : ""}>
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
              <>
                <div className="space-y-2">
                  <Label>Bericht</Label>
                  <TiptapEditor content={body} onChange={setBody} />
                </div>

                {/* Datumvelden voor zichtbaarheid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Zichtbaar vanaf
                    </Label>
                    {visibleFrom === null ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm font-normal"
                        onClick={() =>
                          setVisibleFrom(
                            new Date().toISOString().split("T")[0]
                          )
                        }
                      >
                        Direct
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={visibleFrom}
                          onChange={(e) =>
                            setVisibleFrom(e.target.value || null)
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setVisibleFrom(null)}
                          className="shrink-0 text-xs"
                        >
                          Direct
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leeg = direct zichtbaar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Zichtbaar t/m
                    </Label>
                    {visibleUntil === null ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm font-normal text-muted-foreground"
                        onClick={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          setVisibleUntil(
                            nextWeek.toISOString().split("T")[0]
                          );
                        }}
                      >
                        Geen einddatum
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={visibleUntil}
                          onChange={(e) =>
                            setVisibleUntil(e.target.value || null)
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setVisibleUntil(null)}
                          className="shrink-0 text-xs"
                        >
                          Geen einde
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leeg = altijd zichtbaar
                    </p>
                  </div>
                </div>
              </>
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
          {items.map((item, idx) => {
            const itemData = item.data as Record<string, string>;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  {sectionType === "snelkoppelingen" && (
                    <p className="text-xs text-muted-foreground">
                      {itemData.url}
                    </p>
                  )}
                  {sectionType === "mededelingen" && (
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {(itemData.body ?? "").replace(/<[^>]*>/g, "").slice(0, 80)}
                      </p>
                      {itemData.visible_from && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Vanaf {itemData.visible_from}
                        </Badge>
                      )}
                      {itemData.visible_until && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          T/m {itemData.visible_until}
                        </Badge>
                      )}
                    </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
