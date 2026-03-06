"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, User } from "lucide-react";
import * as LucideIcons from "lucide-react";
import DOMPurify from "dompurify";
import type { Section, SectionItem } from "@/lib/types/database";

interface SectionRendererProps {
  section: Section;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const supabase = createClient();
  const [items, setItems] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase
        .from("section_items")
        .select("*")
        .eq("section_id", section.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      // Filter mededelingen op zichtbaarheidsdatums
      const today = new Date().toISOString().split("T")[0];
      const filtered = (data ?? []).filter((item) => {
        if (section.type !== "mededelingen") return true;
        const itemData = item.data as Record<string, string>;
        if (itemData.visible_from && itemData.visible_from > today) return false;
        if (itemData.visible_until && itemData.visible_until < today) return false;
        return true;
      });

      setItems(filtered);
      setLoading(false);
    }
    fetchItems();
  }, [section.id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{section.title}</h3>
        <p className="text-sm text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (items.length === 0) return null;

  if (section.type === "snelkoppelingen") {
    const cols = section.columns ?? 4;
    const gridClass = getGridClass(cols);

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{section.title}</h3>
        <div className={gridClass}>
          {items.map((item) => {
            const iconName = (item.data as Record<string, string>).icon;
            const url = (item.data as Record<string, string>).url;
            const IconComponent = getIcon(iconName);

            return (
              <a
                key={item.id}
                href={ensureProtocol(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors h-full">
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    {IconComponent && (
                      <IconComponent className="h-8 w-8 text-primary" />
                    )}
                    <span className="text-sm font-medium">{item.title}</span>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  if (section.type === "mededelingen") {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{section.title}</h3>
        <div className="space-y-3">
          {items.map((item) => {
            const itemData = item.data as Record<string, string>;
            const rawBody = itemData.body ?? "";
            // Detecteer of body platte tekst is (backward compatibility)
            const isPlainText = !rawBody.includes("<");
            const sanitizedBody = isPlainText
              ? DOMPurify.sanitize(rawBody)
              : DOMPurify.sanitize(rawBody);
            const authorName = itemData.author_name;

            return (
              <Card key={item.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <h4 className="font-medium">{item.title}</h4>
                  {isPlainText ? (
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {rawBody}
                    </p>
                  ) : (
                    <div
                      className="mt-1 text-sm text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                    />
                  )}
                  {authorName && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70 border-t pt-2">
                      <User className="h-3 w-3" />
                      <span>{authorName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Geeft de juiste Tailwind grid-klassen terug op basis van het aantal kolommen.
 * Op mobiel (< sm): max 2 kolommen
 * Op tablet (sm): max 3 kolommen
 * Op desktop (md+): het ingestelde aantal kolommen
 */
function getGridClass(cols: number): string {
  const classes: Record<number, string> = {
    2: "grid grid-cols-2 gap-3",
    3: "grid grid-cols-2 gap-3 sm:grid-cols-3",
    4: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
    5: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5",
    6: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6",
  };
  return classes[cols] ?? classes[4];
}

/**
 * Zorgt ervoor dat URLs altijd een protocol hebben.
 * "parnassys.movare.nl" → "https://parnassys.movare.nl"
 * "http://example.com" → "http://example.com" (ongewijzigd)
 */
function ensureProtocol(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
    return url;
  }
  return `https://${url}`;
}

function getIcon(name: string): React.ComponentType<{ className?: string }> | null {
  if (!name) return ExternalLink;
  const icons = LucideIcons as Record<string, unknown>;
  const icon = icons[name] || icons[name.charAt(0).toUpperCase() + name.slice(1)];
  if (typeof icon === "function") {
    return icon as React.ComponentType<{ className?: string }>;
  }
  return ExternalLink;
}
