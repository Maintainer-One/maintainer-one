import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) {
		throw redirect(303, '/login');
	}

	// Fetch user role
	const { data: roles } = await supabase
		.from('user_roles')
		.select('role')
		.eq('user_id', user.id);

	const isMaintainer = roles?.some(
		(r) => r.role === 'project_maintainer' || r.role === 'league_maintainer'
	);

	if (!isMaintainer) {
		throw redirect(303, '/');
	}

	return {
		user
	};
};
