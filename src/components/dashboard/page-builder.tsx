"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
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
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import type {
  Page,
  PageRow,
  PageRowSection,
  Section,
} from "@/lib/types/database";

// ---------- Pages List ----------

export function PagesList() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    const { data } = await supabase
      .from("pages")
      .select("*")
      .order("sort_order", { ascending: true });
    setPages(data ?? []);
    setLoading(false);
  }

  async function handleSavePage() {
    if (!title.trim() || !slug.trim() || !profile?.organization_id) return;

    if (editingPage) {
      const { error } = await supabase
        .from("pages")
        .update({ title, slug: slug.toLowerCase().replace(/\s+/g, "-") })
        .eq("id", editingPage.id);
      if (error) {
        toast.error("Fout bij bijwerken pagina");
        return;
      }
      toast.success("Pagina bijgewerkt");
    } else {
      const { error } = await supabase.from("pages").insert({
        title,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        organization_id: profile.organization_id,
        sort_order: pages.length,
      });
      if (error) {
        toast.error("Fout bij aanmaken pagina", {
          description: error.message,
        });
        return;
      }
      toast.success("Pagina aangemaakt");
    }

    setDialogOpen(false);
    setTitle("");
    setSlug("");
    setEditingPage(null);
    fetchPages();
  }

  async function handleDeletePage(id: string) {
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
      toast.error("Fout bij verwijderen");
      return;
    }
    toast.success("Pagina verwijderd");
    fetchPages();
  }

  async function handleTogglePublish(page: Page) {
    const { error } = await supabase
      .from("pages")
      .update({ is_published: !page.is_published })
      .eq("id", page.id);
    if (error) {
      toast.error("Fout bij publiceren");
      return;
    }
    fetchPages();
  }

  function openEditDialog(page: Page) {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingPage(null);
    setTitle("");
    setSlug("");
    setDialogOpen(true);
  }

  // If a page is selected, show the builder
  if (selectedPageId) {
    const page = pages.find((p) => p.id === selectedPageId);
    if (page) {
      return (
        <PageBuilder
          page={page}
          onBack={() => {
            setSelectedPageId(null);
            fetchPages();
          }}
        />
      );
    }
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
            Nieuwe pagina
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Pagina bewerken" : "Nieuwe pagina"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingPage) {
                    setSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-")
                    );
                  }
                }}
                placeholder="Bijv. Startpagina"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="bijv. startpagina"
              />
            </div>
            <Button onClick={handleSavePage} className="w-full">
              {editingPage ? "Opslaan" : "Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {pages.length === 0 ? (
        <p className="text-muted-foreground">
          Nog geen pagina&apos;s. Maak een pagina aan om te beginnen.
        </p>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2 text-left"
                    onClick={() => setSelectedPageId(page.id)}
                  >
                    <CardTitle className="text-base">{page.title}</CardTitle>
                    <Badge variant="outline">/{page.slug}</Badge>
                    <Badge variant={page.is_published ? "default" : "secondary"}>
                      {page.is_published ? "Live" : "Concept"}
                    </Badge>
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublish(page);
                      }}
                    >
                      {page.is_published ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(page);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Page Builder ----------

function PageBuilder({ page, onBack }: { page: Page; onBack: () => void }) {
  const supabase = createClient();
  const [rows, setRows] = useState<
    (PageRow & { sections: (PageRowSection & { section: Section })[] })[]
  >([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero state
  const [heroEnabled, setHeroEnabled] = useState(page.hero_enabled);
  const [heroTitle, setHeroTitle] = useState(page.hero_title ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(page.hero_subtitle ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(page.hero_image_url ?? "");
  const [heroFullWidth, setHeroFullWidth] = useState(page.hero_full_width);

  useEffect(() => {
    fetchData();
  }, [page.id]);

  async function fetchData() {
    const [rowsRes, sectionsRes] = await Promise.all([
      supabase
        .from("page_rows")
        .select("*")
        .eq("page_id", page.id)
        .order("sort_order", { ascending: true }),
      supabase.from("sections").select("*").order("title", { ascending: true }),
    ]);

    const pageRows = rowsRes.data ?? [];
    setAllSections(sectionsRes.data ?? []);

    // Fetch row sections for each row (separate queries to avoid join issues)
    const rowsWithSections = await Promise.all(
      pageRows.map(async (row) => {
        const { data: rowSections } = await supabase
          .from("page_row_sections")
          .select("*")
          .eq("page_row_id", row.id)
          .order("sort_order", { ascending: true });

        const sectionIds = (rowSections ?? []).map((rs) => rs.section_id);
        const { data: sectionsData } =
          sectionIds.length > 0
            ? await supabase.from("sections").select("*").in("id", sectionIds)
            : { data: [] as Section[] };

        const sectionsMap = new Map(
          (sectionsData ?? []).map((s) => [s.id, s])
        );

        const enriched = (rowSections ?? [])
          .map((rs) => ({
            ...rs,
            section: sectionsMap.get(rs.section_id) as Section,
          }))
          .filter((rs) => rs.section);

        return { ...row, sections: enriched };
      })
    );

    setRows(rowsWithSections);
    setLoading(false);
  }

  async function handleSaveHero() {
    const { error } = await supabase
      .from("pages")
      .update({
        hero_enabled: heroEnabled,
        hero_title: heroTitle || null,
        hero_subtitle: heroSubtitle || null,
        hero_image_url: heroImageUrl || null,
        hero_full_width: heroFullWidth,
      })
      .eq("id", page.id);
    if (error) {
      toast.error("Fout bij opslaan hero");
      return;
    }
    toast.success("Hero opgeslagen");
  }

  async function handleAddRow(layout: "full" | "half") {
    const sortOrder = rows.length;
    const { error } = await supabase.from("page_rows").insert({
      page_id: page.id,
      layout,
      sort_order: sortOrder,
    });
    if (error) {
      toast.error("Fout bij toevoegen rij");
      return;
    }
    fetchData();
  }

  async function handleDeleteRow(rowId: string) {
    await supabase.from("page_rows").delete().eq("id", rowId);
    fetchData();
  }

  async function handleMoveRow(rowId: string, direction: "up" | "down") {
    const idx = rows.findIndex((r) => r.id === rowId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === rows.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    await Promise.all([
      supabase
        .from("page_rows")
        .update({ sort_order: rows[swapIdx].sort_order })
        .eq("id", rows[idx].id),
      supabase
        .from("page_rows")
        .update({ sort_order: rows[idx].sort_order })
        .eq("id", rows[swapIdx].id),
    ]);
    fetchData();
  }

  async function handleAssignSection(
    rowId: string,
    position: "full" | "left" | "right",
    sectionId: string
  ) {
    // Remove existing assignment for this position
    const row = rows.find((r) => r.id === rowId);
    const existing = row?.sections.find((s) => s.position === position);
    if (existing) {
      await supabase
        .from("page_row_sections")
        .delete()
        .eq("id", existing.id);
    }

    if (sectionId === "none") {
      fetchData();
      return;
    }

    const { error } = await supabase.from("page_row_sections").insert({
      page_row_id: rowId,
      section_id: sectionId,
      position,
    });
    if (error) {
      toast.error("Fout bij toewijzen blok");
      return;
    }
    fetchData();
  }

  if (loading) {
    return <p className="text-muted-foreground">Laden...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">{page.title}</h2>
        <Badge variant="outline">/{page.slug}</Badge>
      </div>

      {/* Hero Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="min-w-20">Ingeschakeld</Label>
            <input
              type="checkbox"
              checked={heroEnabled}
              onChange={(e) => setHeroEnabled(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          {heroEnabled && (
            <>
              <div className="space-y-2">
                <Label>Titel</Label>
                <Input
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Hero titel"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitel</Label>
                <Input
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Subtitel"
                />
              </div>
              <div className="space-y-2">
                <Label>Afbeelding URL</Label>
                <Input
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="min-w-20">Full width</Label>
                <input
                  type="checkbox"
                  checked={heroFullWidth}
                  onChange={(e) => setHeroFullWidth(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </>
          )}
          <Button onClick={handleSaveHero} size="sm">
            Hero opslaan
          </Button>
        </CardContent>
      </Card>

      {/* Rows */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Rijen</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRow("full")}
              >
                <Plus className="mr-1 h-3 w-3" />
                Full width rij
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRow("half")}
              >
                <Plus className="mr-1 h-3 w-3" />
                50/50 rij
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen rijen. Voeg een rij toe om blokken te plaatsen.
            </p>
          ) : (
            rows.map((row, idx) => (
              <div key={row.id} className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {row.layout === "full" ? "Full width" : "50 / 50"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Rij {idx + 1}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      onClick={() => handleMoveRow(row.id, "up")}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === rows.length - 1}
                      onClick={() => handleMoveRow(row.id, "down")}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {row.layout === "full" ? (
                  <SectionSlot
                    position="full"
                    rowSections={row.sections}
                    allSections={allSections}
                    onAssign={(sectionId) =>
                      handleAssignSection(row.id, "full", sectionId)
                    }
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <SectionSlot
                      position="left"
                      rowSections={row.sections}
                      allSections={allSections}
                      onAssign={(sectionId) =>
                        handleAssignSection(row.id, "left", sectionId)
                      }
                    />
                    <SectionSlot
                      position="right"
                      rowSections={row.sections}
                      allSections={allSections}
                      onAssign={(sectionId) =>
                        handleAssignSection(row.id, "right", sectionId)
                      }
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Section Slot ----------

function SectionSlot({
  position,
  rowSections,
  allSections,
  onAssign,
}: {
  position: "full" | "left" | "right";
  rowSections: (PageRowSection & { section: Section })[];
  allSections: Section[];
  onAssign: (sectionId: string) => void;
}) {
  const assigned = rowSections.find((s) => s.position === position);
  const label =
    position === "full" ? "Blok" : position === "left" ? "Links" : "Rechts";

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={assigned?.section_id ?? "none"}
        onValueChange={onAssign}
      >
        <SelectTrigger>
          <SelectValue placeholder="Kies een blok" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— Geen —</SelectItem>
          {allSections.map((section) => (
            <SelectItem key={section.id} value={section.id}>
              {section.title} ({section.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
