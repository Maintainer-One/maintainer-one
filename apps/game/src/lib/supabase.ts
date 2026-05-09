import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

/**
 * Shared Supabase client for frontend interaction.
 * Ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set in .env
 */
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function getActiveSeason() {
	const now = new Date();

	// Fetch all seasons to determine which is closest
	const { data: allSeasons } = await supabase
		.from('seasons')
		.select('*')
		.order('start_date', { ascending: true });

	if (!allSeasons || allSeasons.length === 0) return null;

	// 1. Check for current active season (now between start and end)
	const active = allSeasons.find(s => {
		const start = new Date(s.start_date);
		const end = new Date(s.end_date);
		return now >= start && now <= end;
	});

	if (active) return active;

	// 2. Find nearest past and future seasons
	let past = null;
	let future = null;

	for (const s of allSeasons) {
		const start = new Date(s.start_date);
		const end = new Date(s.end_date);
		if (now > end) {
			past = s;
		} else if (now < start) {
			future = s;
			break; // First future season found
		}
	}

	// 3. Midpoint logic
	if (past && future) {
		const pastEnd = new Date(past.end_date).getTime();
		const futureStart = new Date(future.start_date).getTime();
		const midpoint = pastEnd + (futureStart - pastEnd) / 2;
		
		if (now.getTime() < midpoint) {
			return past;
		} else {
			return future;
		}
	}

	// 4. Return whatever we have (past or future)
	return past || future;
}
