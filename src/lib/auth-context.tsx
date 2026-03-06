"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

const PROFILE_CACHE_KEY = "het-schoolbord-profile";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

/**
 * Leest het gecachte profiel uit localStorage.
 * Dit voorkomt het laadscherm bij page refresh.
 */
function getCachedProfile(): Profile | null {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) return JSON.parse(cached) as Profile;
  } catch {
    // Corrupt cache → negeren
  }
  return null;
}

function setCachedProfile(profile: Profile | null) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {
    // localStorage vol of niet beschikbaar → negeren
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialiseer met gecacht profiel zodat we direct content kunnen tonen
  const cachedProfile =
    typeof window !== "undefined" ? getCachedProfile() : null;

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(cachedProfile === null);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) throw error;

        setProfile(data);
        setCachedProfile(data);
        setAuthError(null);
      } catch {
        // CRUCIAAL: als er al een profiel is (uit cache of eerder geladen),
        // gooi dat NIET weg. Behoud het zodat de gebruiker content blijft zien.
        setProfile((prev) => {
          if (prev) return prev; // Behoud werkend profiel
          return null;
        });
        // Alleen authError zetten als er GEEN werkend profiel is
        setAuthError((prev) => {
          // Check of we al een profiel hebben via de state updater
          return prev ?? "Profiel kon niet geladen worden. Probeer het opnieuw.";
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    let mounted = true;

    // Loading altijd naar false zetten, ongeacht wat er gebeurt
    function finishLoading() {
      if (mounted) {
        setLoading(false);
      }
    }

    // Als we al een gecacht profiel hebben, is loading al false.
    // We doen alsnog een verse check op de achtergrond.
    if (cachedProfile) {
      // loading is al false door de useState(cachedProfile === null)
    }

    // 1. Sessie-check
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          // Geen sessie meer → cache wissen (user is uitgelogd)
          setProfile(null);
          setCachedProfile(null);
        }
        finishLoading();
      })
      .catch(() => {
        if (!mounted) return;
        // Netwerk-fout: behoud gecacht profiel als dat er is
        if (!cachedProfile) {
          setUser(null);
          setProfile(null);
          setCachedProfile(null);
        }
        finishLoading();
      });

    // 2. Luister naar auth-wijzigingen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        // Uitgelogd → cache wissen
        setProfile(null);
        setCachedProfile(null);
      }
      finishLoading();
    });

    // 3. Vangnet: als loading na 3 seconden nog true is, forceer stop
    // Dit vangnet werkt ALTIJD, ongeacht of er een cache is of niet
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth loading timeout na 3s — forceer laden");
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCachedProfile(null);
    setAuthError(null);
  };

  const refreshProfile = async () => {
    setAuthError(null);
    if (user) {
      await fetchProfile(user.id);
    } else {
      // Probeer opnieuw een sessie te krijgen
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch {
        setAuthError("Kan geen verbinding maken. Controleer je internetverbinding.");
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, authError, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
