"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Robuuste data-fetch hook die garandeert dat data geladen wordt bij:
 * 1. Component mount (eerste keer)
 * 2. Dependency wijziging (bijv. organization_id)
 * 3. Tab weer zichtbaar (na wisselen naar andere site/tab)
 * 4. Pagina hersteld uit browser-cache (bfcache / pageshow)
 *
 * Dit lost het probleem op dat Next.js Router Cache component state
 * kan bewaren bij client-side navigatie, waardoor useEffect niet
 * opnieuw draait.
 */
export function useFetchOnMount(
  fetchFn: () => void | Promise<void>,
  deps: unknown[] = []
) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const mountedRef = useRef(false);

  // Veilige wrapper die async fouten opvangt (voorkomt unhandled rejections)
  function safeFetch() {
    try {
      const result = fetchRef.current();
      // Als het een Promise is, vang onverwachte errors op
      if (result && typeof result === "object" && "catch" in result) {
        (result as Promise<void>).catch((err) => {
          console.error("useFetchOnMount: onverwachte fout", err);
        });
      }
    } catch (err) {
      console.error("useFetchOnMount: synchrone fout", err);
    }
  }

  // Altijd uitvoeren bij mount + dependency wijzigingen
  useEffect(() => {
    mountedRef.current = true;
    safeFetch();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Luister naar tab-focus en bfcache events
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && mountedRef.current) {
        safeFetch();
      }
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted && mountedRef.current) {
        safeFetch();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);
}

/**
 * Geeft een stabiele callback die altijd naar de laatste versie verwijst.
 * Handig voor fetch-functies die afhankelijk zijn van state/props.
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const ref = useRef(callback);
  ref.current = callback;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    ((...args: unknown[]) => ref.current(...args)) as T,
    []
  );
}
