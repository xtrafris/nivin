import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase-omgevingsvariabelen ontbreken. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in je .env(.local) bestand of in je Vercel-projectinstellingen."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Alle wijnen worden als één document bewaard onder deze vaste rij-id,
// op dezelfde manier als de vorige window.storage/localStorage-opslag werkte.
export const CELLAR_ROW_ID = "wines";
