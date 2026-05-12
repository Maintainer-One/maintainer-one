//#region src/routes/around-the-league/+page.server.ts
var load = async ({ locals: { supabase } }) => {
	const { data: posts } = await supabase.from("community_content").select(`
			id, 
			title, 
			url, 
			content_type, 
			created_at,
			profiles(username, avatar_url)
		`).order("created_at", { ascending: false });
	return { posts: posts || [] };
};
//#endregion
export { load };
