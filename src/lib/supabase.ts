import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

/**
 * Shared Supabase client for frontend interaction.
 * Ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set in .env
 */
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function getActiveSeason() {
	const now = new Date().toISOString();

	// 1. Check for current active season (now between start and end)
	const { data: current } = await supabase
		.from('seasons')
		.select('*')
		.lte('start_date', now)
		.gte('end_date', now)
		.order('start_date', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (current) return current;

	// 2. Fallback to next upcoming season
	const { data: next } = await supabase
		.from('seasons')
		.select('*')
		.gt('start_date', now)
		.order('start_date', { ascending: true })
		.limit(1)
		.maybeSingle();

	return next;
}
