import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) {
		throw redirect(303, '/login');
	}

	const teamId = params.id;

	// Fetch user roles
	const { data: roles } = await supabase
		.from('user_roles')
		.select('role, team_id')
		.eq('user_id', user.id);

	const isMaintainer = roles?.some(
		(r) => r.role === 'project_maintainer' || 
			   (r.role === 'team_maintainer' && r.team_id === teamId)
	);

	if (!isMaintainer) {
		throw redirect(303, `/team/${teamId}`);
	}

	return { user };
};
