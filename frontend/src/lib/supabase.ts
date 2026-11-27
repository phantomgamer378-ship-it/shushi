import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jkchyjghuaiyulxqzobl.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprY2h5amdodWFpeXVseHF6b2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3NjIzODQsImV4cCI6MjExMTMzODM4NH0.v_C6A2sm9VXYYPrION_hE2Fd6MzmJhoqkjE_P0MN6iI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
