"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";
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
      setItems(data ?? []);
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
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{section.title}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <h4 className="font-medium">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {(item.data as Record<string, string>).body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
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
