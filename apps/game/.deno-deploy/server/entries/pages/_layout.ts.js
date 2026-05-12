import { n as PUBLIC_SUPABASE_URL, t as PUBLIC_SUPABASE_ANON_KEY } from "../../chunks/public.js";
import { createBrowserClient, createServerClient, isBrowser } from "@supabase/ssr";
//#region src/routes/+layout.ts
var load = async ({ fetch, data, depends }) => {
	depends("supabase:auth");
	const supabase = isBrowser() ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { global: { fetch } }) : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch },
		cookies: { getAll() {
			return data.cookies;
		} }
	});
	/**
	* It's fine to use `getSession` here, because on the client, `getSession` is
	* safe, and on the server, it reads `session` from the `LayoutData`, which
	* safely checked the session using `safeGetSession`.
	*/
	const { data: { session } } = await supabase.auth.getSession();
	return {
		...data,
		supabase,
		session
	};
};
//#endregion
export { load };
