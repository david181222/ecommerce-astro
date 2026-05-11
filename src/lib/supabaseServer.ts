import { createClient } from '@supabase/supabase-js';

// Factory SSR para aislar cada request y evitar estado compartido.
// El cliente de navegador (supabaseBrowser) vive en la zona admin.
export function supabaseServer() {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      // En SSR no persistimos sesión; cada request es independiente.
      auth: { persistSession: false },
    }
  );
}
