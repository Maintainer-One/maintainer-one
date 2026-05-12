import { redirect } from "@sveltejs/kit";
//#region src/routes/admin/+layout.server.ts
var load = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) throw redirect(303, "/login");
	const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
	if (!roles?.some((r) => r.role === "project_maintainer" || r.role === "league_maintainer")) throw redirect(303, "/");
	return { user };
};
//#endregion
export { load };
