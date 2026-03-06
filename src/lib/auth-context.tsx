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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
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
  const cachedProfile = typeof window !== "undefined" ? getCachedProfile() : null;

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(cachedProfile === null);
  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        setProfile(data);
        setCachedProfile(data);
      } catch {
        setProfile(null);
        setCachedProfile(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    let mounted = true;
    let initialDone = false;

    function finishLoading() {
      if (mounted && !initialDone) {
        initialDone = true;
        setLoading(false);
      }
    }

    // Als we al een gecacht profiel hebben, is loading al false.
    // We doen alsnog een verse check op de achtergrond.
    if (cachedProfile) {
      initialDone = true; // Voorkom dat finishLoading() later loading opnieuw op false zet
    }

    // 1. Snelle sessie-check vanuit localStorage (GEEN netwerkverzoek)
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          // Geen sessie meer → cache wissen
          setProfile(null);
          setCachedProfile(null);
        }
        finishLoading();
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setCachedProfile(null);
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
        setProfile(null);
        setCachedProfile(null);
      }
      finishLoading();
    });

    // 3. Vangnet: als loading na 3 seconden nog true is, forceer stop
    const timeout = setTimeout(() => {
      if (mounted && !initialDone) {
        console.warn("Auth loading timeout na 3s — forceer laden");
        finishLoading();
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
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
