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
  /** true zolang de auth-check nog niet afgerond is */
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
  const cachedProfile =
    typeof window !== "undefined" ? getCachedProfile() : null;

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  // ✅ loading is ALTIJD true tot getSession() afgerond is.
  // De RouteGuard handelt het "optimistisch renderen met cache" af.
  const [loading, setLoading] = useState(true);
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
        // Als er al een profiel is (uit cache), behoud dat
        setProfile((prev) => {
          if (prev) return prev;
          return null;
        });
        setAuthError(
          "Profiel kon niet geladen worden. Probeer het opnieuw."
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    let mounted = true;

    function finishLoading() {
      if (mounted) {
        setLoading(false);
      }
    }

    // 1. Sessie-check (leest token uit localStorage, geen netwerk)
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          // Geen sessie → cache wissen
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

    // 2. Luister naar auth-wijzigingen (token refresh, uitloggen, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setCachedProfile(null);
      }
      finishLoading();
    });

    // 3. Vangnet: na 3 seconden altijd loading stoppen
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
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch {
        setAuthError(
          "Kan geen verbinding maken. Controleer je internetverbinding."
        );
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
