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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
      } catch {
        setProfile(null);
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

    // 1. Snelle sessie-check vanuit localStorage (GEEN netwerkverzoek)
    //    getSession() leest direct uit opslag, getUser() maakt een netwerkverzoek
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted || initialDone) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
        finishLoading();
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        finishLoading();
      });

    // 2. Luister naar auth-wijzigingen (handelt sessie-validatie af op achtergrond)
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
      }
      finishLoading();
    });

    // 3. Vangnet: als loading na 5 seconden nog true is, forceer stop
    const timeout = setTimeout(() => {
      if (mounted && !initialDone) {
        console.warn("Auth loading timeout na 5s — forceer laden");
        finishLoading();
      }
    }, 5000);

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
