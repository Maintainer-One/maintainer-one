import { n as PUBLIC_SUPABASE_URL, t as PUBLIC_SUPABASE_ANON_KEY } from "./public.js";
import { createClient } from "@supabase/supabase-js";
//#region src/lib/supabase.ts
/**
* Shared Supabase client for frontend interaction.
* Ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set in .env
*/
var supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
async function getActiveSeason() {
	const now = /* @__PURE__ */ new Date();
	const { data: allSeasons } = await supabase.from("seasons").select("*").order("start_date", { ascending: true });
	if (!allSeasons || allSeasons.length === 0) return null;
	const active = allSeasons.find((s) => {
		const start = new Date(s.start_date);
		const end = new Date(s.end_date);
		return now >= start && now <= end;
	});
	if (active) return active;
	let past = null;
	let future = null;
	for (const s of allSeasons) {
		const start = new Date(s.start_date);
		if (now > new Date(s.end_date)) past = s;
		else if (now < start) {
			future = s;
			break;
		}
	}
	if (past && future) {
		const pastEnd = new Date(past.end_date).getTime();
		const midpoint = pastEnd + (new Date(future.start_date).getTime() - pastEnd) / 2;
		if (now.getTime() < midpoint) return past;
		else return future;
	}
	return past || future;
}
//#endregion
export { supabase as n, getActiveSeason as t };
