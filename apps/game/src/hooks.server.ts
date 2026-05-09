import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			/**
			 * SvelteKit's cookies API requires `path` to be explicitly set in
			 * the cookie options. Setting `path` to `/` replicates previous/
			 * standard behavior.
			 */
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT on the server. This yields a validated session and safe user object.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	// Initialize safe session
	const { session, user } = await event.locals.safeGetSession();

	// Guard admin routes
	if (event.url.pathname.startsWith('/admin')) {
		if (!user) {
			throw redirect(303, '/login');
		}

		// Fetch user role
		const { data: roles } = await event.locals.supabase
			.from('user_roles')
			.select('role')
			.eq('user_id', user.id);

		const isMaintainer = roles?.some(
			(r) => r.role === 'project_maintainer' || r.role === 'league_maintainer'
		);

		if (!isMaintainer) {
			throw redirect(303, '/');
		}
	}

	// Guard route to save new versions (API route or page route)
	if (event.url.pathname.startsWith('/api/team/versions')) {
		// Example protection - we need to see exactly where versions are saved
		// We'll refine this once we know the exact endpoint.
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
