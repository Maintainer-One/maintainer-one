import { redirect } from "@sveltejs/kit";
//#region src/routes/team/[id]/test-runner/+layout.server.ts
var load = async ({ params, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) throw redirect(303, "/login");
	const teamId = params.id;
	const { data: roles } = await supabase.from("user_roles").select("role, team_id").eq("user_id", user.id);
	if (!roles?.some((r) => r.role === "project_maintainer" || r.role === "team_maintainer" && r.team_id === teamId)) throw redirect(303, `/team/${teamId}`);
	return { user };
};
//#endregion
export { load };
