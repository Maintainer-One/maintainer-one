//#region src/routes/+layout.server.ts
var load = async ({ locals: { safeGetSession, supabase }, cookies }) => {
	const { session, user } = await safeGetSession();
	let profile = null;
	let roles = [];
	if (user) {
		const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
		profile = profileData;
		const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
		roles = rolesData?.map((r) => r.role) || [];
	}
	return {
		session,
		user,
		profile,
		roles,
		cookies: cookies.getAll()
	};
};
//#endregion
export { load };
