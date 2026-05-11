/**
 * Archivo: cliente Supabase singleton para el navegador.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cache local para garantizar un singleton en el navegador.
let client: SupabaseClient | null = null;

/**
 * Crea y reutiliza el cliente Supabase.
 * No recibe parametros.
 * Devuelve una instancia SupabaseClient lista para usar.
 * Lanza error si faltan variables PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY.
 */
export function supabaseBrowser(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  // Validacion basica de variables publicas.
  if (!url || !anonKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}
