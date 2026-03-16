import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// -------------------------------------------------------
// Browser client (anon key, client-side safe)
// -------------------------------------------------------
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// -------------------------------------------------------
// Server client (service role, build-time / server-only)
// -------------------------------------------------------
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
