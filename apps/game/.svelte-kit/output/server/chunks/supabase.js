import { createClient } from "@supabase/supabase-js";
//#endregion
//#region src/lib/supabase.ts
/**
* Shared Supabase client for frontend interaction.
* Ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set in .env
*/
var supabase = createClient("http://127.0.0.1:54321", "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH");
async function getActiveSeason() {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { data: current } = await supabase.from("seasons").select("*").lte("start_date", now).gte("end_date", now).order("start_date", { ascending: false }).limit(1).maybeSingle();
	if (current) return current;
	const { data: next } = await supabase.from("seasons").select("*").gt("start_date", now).order("start_date", { ascending: true }).limit(1).maybeSingle();
	return next;
}
//#endregion
export { supabase as n, getActiveSeason as t };
