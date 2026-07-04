// Supabase client. Reads credentials from Vite env vars so the anon key is not
// hardcoded in source. Set these in app/.env (see .env.example):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When credentials are absent the app still runs (in-memory only); the store
// functions below no-op so imports keep working without a backend configured.
export const supabaseEnabled = Boolean(url && anonKey);

export const supabase = supabaseEnabled ? createClient(url, anonKey) : null;
