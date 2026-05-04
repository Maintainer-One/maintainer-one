
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/admin/authority" | "/admin/league" | "/film-room" | "/leaderboard" | "/match" | "/match/[id]" | "/match/[id]/stats" | "/player" | "/player/[teamId]" | "/player/[teamId]/[unitIndex]" | "/schedule" | "/team" | "/team/exhibition" | "/team/[id]" | "/team/[id]/dashboard" | "/team/[id]/test-runner";
		RouteParams(): {
			"/match/[id]": { id: string };
			"/match/[id]/stats": { id: string };
			"/player/[teamId]": { teamId: string };
			"/player/[teamId]/[unitIndex]": { teamId: string; unitIndex: string };
			"/team/[id]": { id: string };
			"/team/[id]/dashboard": { id: string };
			"/team/[id]/test-runner": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string; teamId?: string; unitIndex?: string };
			"/admin": Record<string, never>;
			"/admin/authority": Record<string, never>;
			"/admin/league": Record<string, never>;
			"/film-room": Record<string, never>;
			"/leaderboard": Record<string, never>;
			"/match": { id?: string };
			"/match/[id]": { id: string };
			"/match/[id]/stats": { id: string };
			"/player": { teamId?: string; unitIndex?: string };
			"/player/[teamId]": { teamId: string; unitIndex?: string };
			"/player/[teamId]/[unitIndex]": { teamId: string; unitIndex: string };
			"/schedule": Record<string, never>;
			"/team": { id?: string };
			"/team/exhibition": Record<string, never>;
			"/team/[id]": { id: string };
			"/team/[id]/dashboard": { id: string };
			"/team/[id]/test-runner": { id: string }
		};
		Pathname(): "/" | "/admin/authority" | "/admin/league" | "/film-room" | "/leaderboard" | `/match/${string}` & {} | `/match/${string}/stats` & {} | `/player/${string}/${string}` & {} | "/schedule" | "/team/exhibition" | `/team/${string}` & {} | `/team/${string}/dashboard` & {} | `/team/${string}/test-runner` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/robots.txt" | string & {};
	}
}