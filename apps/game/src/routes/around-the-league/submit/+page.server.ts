import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	
	if (!user) {
		throw redirect(303, '/login');
	}

	return { user };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		
		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const url = formData.get('url') as string;
		const content_type = formData.get('content_type') as string;

		if (!title || !url || !content_type) {
			return fail(400, { message: 'All fields are required', title, url, content_type });
		}

		const { error } = await supabase
			.from('community_content')
			.insert({
				title,
				url,
				content_type,
				author_id: user.id
			});

		if (error) {
			return fail(500, { message: error.message, title, url, content_type });
		}

		throw redirect(303, '/around-the-league');
	}
};
