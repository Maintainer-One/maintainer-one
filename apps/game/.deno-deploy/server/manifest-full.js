export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["logos/amber_seekers.svg","logos/beige_blockers.svg","logos/crimson_strikers.svg","logos/denim_drifters.svg","logos/emerald_pausers.svg","logos/fuchsia_soloists.svg","robots.txt"]),
	mimeTypes: {".svg":"image/svg+xml",".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.jMLayczC.js",app:"_app/immutable/entry/app.DBdmDtEP.js",imports:["_app/immutable/entry/start.jMLayczC.js","_app/immutable/chunks/Cc1ceNeC.js","_app/immutable/chunks/FMM7ZXC-.js","_app/immutable/entry/app.DBdmDtEP.js","_app/immutable/chunks/FMM7ZXC-.js","_app/immutable/chunks/TWoP20JI.js","_app/immutable/chunks/3bfzTCuz.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/12.js')),
			__memo(() => import('./nodes/13.js')),
			__memo(() => import('./nodes/14.js')),
			__memo(() => import('./nodes/15.js')),
			__memo(() => import('./nodes/16.js')),
			__memo(() => import('./nodes/17.js')),
			__memo(() => import('./nodes/18.js')),
			__memo(() => import('./nodes/19.js')),
			__memo(() => import('./nodes/20.js')),
			__memo(() => import('./nodes/21.js')),
			__memo(() => import('./nodes/22.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/admin/authority",
				pattern: /^\/admin\/authority\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/admin/league",
				pattern: /^\/admin\/league\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/admin/league/season/new",
				pattern: /^\/admin\/league\/season\/new\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/around-the-league",
				pattern: /^\/around-the-league\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/around-the-league/submit",
				pattern: /^\/around-the-league\/submit\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/auth/callback",
				pattern: /^\/auth\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/auth/callback/_server.ts.js'))
			},
			{
				id: "/leaderboard",
				pattern: /^\/leaderboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/match/[id]",
				pattern: /^\/match\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/match/[id]/stats",
				pattern: /^\/match\/([^/]+?)\/stats\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/multiview",
				pattern: /^\/multiview\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/player/[teamId]/[unitIndex]",
				pattern: /^\/player\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"teamId","optional":false,"rest":false,"chained":false},{"name":"unitIndex","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/schedule",
				pattern: /^\/schedule\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/team/exhibition",
				pattern: /^\/team\/exhibition\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/team/[id]",
				pattern: /^\/team\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/team/[id]/dashboard",
				pattern: /^\/team\/([^/]+?)\/dashboard\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,3,], errors: [1,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/team/[id]/film-room",
				pattern: /^\/team\/([^/]+?)\/film-room\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/team/[id]/test-runner",
				pattern: /^\/team\/([^/]+?)\/test-runner\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,4,], errors: [1,,], leaf: 21 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
