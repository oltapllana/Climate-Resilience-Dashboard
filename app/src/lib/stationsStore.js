// Persistence for user-imported stations, backed by Supabase.
// A station is stored as a single row: its id/name/coords as columns for easy
// listing, plus the full station object (including measurements) in a JSONB
// `data` column. If Supabase is not configured the functions degrade to no-ops
// so the dashboard keeps working purely in-memory.
import { supabase, supabaseEnabled } from "./supabase.js";

const TABLE = "saved_stations";

// Return every saved station as the full station object the app renders.
export async function loadSavedStations() {
  if (!supabaseEnabled) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadSavedStations failed:", error.message);
    return [];
  }
  return (data || []).map((row) => row.data);
}

// Insert or update a station (keyed by its id).
export async function saveStation(station) {
  if (!supabaseEnabled) return;
  const { error } = await supabase.from(TABLE).upsert(
    {
      id: station.id,
      name_en: station.name_en,
      name_sq: station.name_sq,
      lat: station.lat,
      lon: station.lon,
      type: station.type,
      data: station,
    },
    { onConflict: "id" }
  );
  if (error) console.error("saveStation failed:", error.message);
}

export async function deleteStation(id) {
  if (!supabaseEnabled) return;
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) console.error("deleteStation failed:", error.message);
}
