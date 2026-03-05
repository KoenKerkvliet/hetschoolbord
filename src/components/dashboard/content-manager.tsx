"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { ContentItem } from "@/lib/types/database";

interface ContentManagerProps {
  initialContent: ContentItem[];
  organizationId: string;
  userId: string;
}

export function ContentManager({
  initialContent,
  organizationId,
  userId,
}: ContentManagerProps) {
  const [content, setContent] = useState<ContentItem[]>(initialContent);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const supabase = createClient();

  async function refreshContent() {
    const { data } = await supabase
      .from("content")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setContent(data);
  }

  async function handleTogglePublish(item: ContentItem) {
    const { error } = await supabase
      .from("content")
      .update({ is_published: !item.is_published })
      .eq("id", item.id);

    if (error) {
      toast.error("Actie mislukt", { description: error.message });
    } else {
      toast.success(
        item.is_published ? "Content gedepubliceerd" : "Content gepubliceerd"
      );
      await refreshContent();
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("content").delete().eq("id", id);
    if (error) {
      toast.error("Verwijderen mislukt", { description: error.message });
    } else {
      toast.success("Content verwijderd");
      await refreshContent();
    }
  }

  function openEdit(item: ContentItem) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function openNew() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuw item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Item bewerken" : "Nieuw item"}
              </DialogTitle>
            </DialogHeader>
            <ContentForm
              item={editingItem}
              organizationId={organizationId}
              userId={userId}
              onSaved={() => {
                setDialogOpen(false);
                refreshContent();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nog geen content. Maak je eerste item aan.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {content.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <Badge variant="outline">{item.type}</Badge>
                  {item.is_published ? (
                    <Badge className="bg-green-100 text-green-800">Live</Badge>
                  ) : (
                    <Badge variant="secondary">Concept</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {(item.data as Record<string, string>).body || "Geen inhoud"}
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePublish(item)}
                >
                  {item.is_published ? (
                    <>
                      <EyeOff className="mr-1 h-3 w-3" />
                      Depubliceren
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3 w-3" />
                      Publiceren
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Bewerken
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Verwijderen
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface ContentFormProps {
  item: ContentItem | null;
  organizationId: string;
  userId: string;
  onSaved: () => void;
}

function ContentForm({
  item,
  organizationId,
  userId,
  onSaved,
}: ContentFormProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState(item?.type ?? "text");
  const [body, setBody] = useState(
    (item?.data as Record<string, string>)?.body ?? ""
  );
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const contentData = {
      title,
      type,
      data: { body },
      organization_id: organizationId,
      created_by: userId,
    };

    let error;

    if (item) {
      ({ error } = await supabase
        .from("content")
        .update({ title, type, data: { body } })
        .eq("id", item.id));
    } else {
      ({ error } = await supabase.from("content").insert(contentData));
    }

    if (error) {
      toast.error("Opslaan mislukt", { description: error.message });
    } else {
      toast.success(item ? "Item bijgewerkt" : "Item aangemaakt");
      onSaved();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Tekst</SelectItem>
            <SelectItem value="announcement">Mededeling</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Inhoud</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Opslaan..." : item ? "Bijwerken" : "Aanmaken"}
      </Button>
    </form>
  );
}
