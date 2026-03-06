"use client";

import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CURATED_ICONS } from "@/lib/constants/curated-icons";

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

// Alle geldige icon namen uit lucide-react (PascalCase, begint met hoofdletter)
const ALL_ICON_NAMES = Object.keys(LucideIcons).filter(
  (key) =>
    /^[A-Z]/.test(key) &&
    key !== "default" &&
    key !== "Icon" &&
    !key.startsWith("Lucide") &&
    !key.startsWith("create") &&
    typeof (LucideIcons as Record<string, unknown>)[key] === "object"
);

function getIconComponent(
  name: string
): React.ComponentType<{ className?: string }> | null {
  const icons = LucideIcons as Record<string, unknown>;
  const component = icons[name];
  if (
    component &&
    (typeof component === "function" ||
      (typeof component === "object" && component !== null))
  ) {
    return component as React.ComponentType<{ className?: string }>;
  }
  return null;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const displayedIcons = useMemo(() => {
    if (!search.trim()) {
      return CURATED_ICONS;
    }
    const query = search.toLowerCase();
    return ALL_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(query)
    ).slice(0, 100);
  }, [search]);

  const SelectedIcon = value ? getIconComponent(value) : null;

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
    setSearch("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-4 w-4" />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Kies een icoon...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek icoon..."
          className="mb-3"
          autoFocus
        />
        <ScrollArea className="h-64">
          {displayedIcons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Geen iconen gevonden
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-1">
              {displayedIcons.map((name) => {
                const IconComp = getIconComponent(name);
                if (!IconComp) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    className={`flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent ${
                      value === name
                        ? "bg-primary/10 ring-1 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleSelect(name)}
                  >
                    <IconComp className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          )}
          {!search.trim() && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Typ om alle iconen te doorzoeken
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
