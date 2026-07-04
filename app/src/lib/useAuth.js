// Tracks the current Supabase auth session. Returns { session, loading }.
// When Supabase is not configured, session stays null and the app runs as a
// public, read-only dashboard.
import { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "./supabase.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
