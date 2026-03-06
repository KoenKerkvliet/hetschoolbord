import type { CSSProperties } from "react";

/**
 * Converteer hex kleur (#RRGGBB) naar RGB componenten.
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Bereken de relatieve luminantie van een hex kleur (0-1).
 * Gebruikt de WCAG 2.0 formule.
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Bepaal een leesbare voorgrondkleur (zwart of wit) voor een achtergrondkleur.
 */
export function getContrastForeground(hex: string): string {
  const luminance = getLuminance(hex);
  return luminance > 0.4 ? "#000000" : "#ffffff";
}

/**
 * Genereer CSS custom property overrides op basis van organisatie-instellingen.
 * Retourneert een CSSProperties object om als inline style toe te passen.
 */
export function generateThemeOverrides(
  settings: Record<string, unknown>
): CSSProperties {
  const style: Record<string, string> = {};

  const primaryColor = settings.primary_color as string | undefined;
  const secondaryColor = settings.secondary_color as string | undefined;

  if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    style["--primary"] = primaryColor;
    style["--primary-foreground"] = getContrastForeground(primaryColor);
  }

  if (secondaryColor && /^#[0-9A-Fa-f]{6}$/.test(secondaryColor)) {
    style["--secondary"] = secondaryColor;
    style["--secondary-foreground"] = getContrastForeground(secondaryColor);
  }

  return style as CSSProperties;
}
