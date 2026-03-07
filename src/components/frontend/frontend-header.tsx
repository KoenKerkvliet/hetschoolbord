"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, UserCircle } from "lucide-react";
import type { Page } from "@/lib/types/database";

interface FrontendHeaderProps {
  /** Gepubliceerde pagina's voor navigatie */
  pages?: Page[];
  /** Actieve pagina ID (voor markering) */
  activePageId?: string;
  /** Callback bij pagina-wissel */
  onPageChange?: (pageId: string) => void;
}

export function FrontendHeader({
  pages = [],
  activePageId,
  onPageChange,
}: FrontendHeaderProps) {
  const { profile } = useAuth();

  const canAccessDashboard =
    profile?.role === "editor" ||
    profile?.role === "admin" ||
    profile?.role === "super_admin";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
        {/* Links: leeg of logo (toekomstig) */}
        <div className="w-24 shrink-0" />

        {/* Midden: pagina-navigatie */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageChange?.(page.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                page.id === activePageId
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {page.title}
            </button>
          ))}
        </nav>

        {/* Rechts: profiel + dashboard */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/frontend/profile"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <UserCircle className="h-4 w-4" />
            Profiel
          </Link>

          {canAccessDashboard && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
