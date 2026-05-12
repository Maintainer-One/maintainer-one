import { fail, redirect } from "@sveltejs/kit";
//#region src/routes/around-the-league/submit/+page.server.ts
var load = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!user) throw redirect(303, "/login");
	return { user };
};
var actions = { default: async ({ request, locals: { supabase, safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (!user) return fail(401, { message: "Unauthorized" });
	const formData = await request.formData();
	const title = formData.get("title");
	const url = formData.get("url");
	const content_type = formData.get("content_type");
	if (!title || !url || !content_type) return fail(400, {
		message: "All fields are required",
		title,
		url,
		content_type
	});
	const { error } = await supabase.from("community_content").insert({
		title,
		url,
		content_type,
		author_id: user.id
	});
	if (error) return fail(500, {
		message: error.message,
		title,
		url,
		content_type
	});
	throw redirect(303, "/around-the-league");
} };
//#endregion
export { actions, load };
