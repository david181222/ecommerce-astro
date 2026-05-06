import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
	if (cachedClient) return cachedClient;

	const url = import.meta.env.PUBLIC_SUPABASE_URL;
	const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		throw new Error(
			'Missing Supabase env vars. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.'
		);
	}

	cachedClient = createClient(url, anonKey);
	return cachedClient;
}
