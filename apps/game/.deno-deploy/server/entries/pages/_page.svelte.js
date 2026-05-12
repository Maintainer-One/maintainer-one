import { h as base } from "../../chunks/environment.js";
import { P as writable, X as escape_html, Y as attr, a as derived, d as stringify, f as unsubscribe_stores, n as attr_class, o as ensure_array_like, ot as noop, r as attr_style, s as head, u as store_get } from "../../chunks/dev.js";
import "../../chunks/internal.js";
import "../../chunks/paths.js";
import "../../chunks/supabase.js";
import { t as BrandLogo$1 } from "../../chunks/BrandLogo.js";
import { t as TeamIcon } from "../../chunks/TeamIcon.js";
import "../../chunks/standings2.js";
import { t as BrandLoading } from "../../chunks/BrandLoading.js";
import "../../chunks/simulation.js";
//#region src/lib/components/dashboard/LeagueTicker.svelte
function LeagueTicker($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { season = null } = $$props;
		let events = [];
		let internalSeason = null;
		derived(() => season || internalSeason);
		let duration = derived(() => Math.max(20, events.length * 10));
		$$renderer.push(`<div class="relative flex overflow-x-hidden border-b border-white/10 bg-black/40 py-2 text-sm svelte-1n0qmju"><div class="animate-marquee whitespace-nowrap text-[var(--color-brand-secondary)]/70 svelte-1n0qmju"${attr_style(`animation-duration: ${stringify(duration())}s`)}><!--[-->`);
		const each_array = ensure_array_like(events);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let event = each_array[$$index];
			$$renderer.push(`<span class="mx-8 inline-flex items-center gap-2 svelte-1n0qmju">`);
			BrandLogo$1($$renderer, { size: "size-4" });
			$$renderer.push(`<!----> ${escape_html(event)}</span>`);
		}
		$$renderer.push(`<!--]--></div> <div class="absolute top-2 animate-marquee2 whitespace-nowrap text-[var(--color-brand-secondary)]/70 svelte-1n0qmju"${attr_style(`animation-duration: ${stringify(duration())}s`)}><!--[-->`);
		const each_array_1 = ensure_array_like(events);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let event = each_array_1[$$index_1];
			$$renderer.push(`<span class="mx-8 inline-flex items-center gap-2 svelte-1n0qmju">`);
			BrandLogo$1($$renderer, { size: "size-4" });
			$$renderer.push(`<!----> ${escape_html(event)}</span>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/lib/components/dashboard/StandingsBoard.svelte
function StandingsBoard($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { season = null } = $$props;
		derived(() => season && (new Date(season.end_date) < /* @__PURE__ */ new Date() || season.status === "completed"));
		$$renderer.push(`<div class="flex flex-col gap-4"><div class="flex items-center justify-between border-b border-[var(--color-brand-secondary)]/10 pb-2"><h2 class="text-xl font-bold tracking-tight text-[var(--color-brand-secondary)] flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-brand-primary)]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> ${escape_html(season ? season.name : "Standings")}</h2> <a href="/leaderboard" class="text-sm font-semibold tracking-wider uppercase text-[var(--color-brand-secondary)]/50 hover:text-[var(--color-brand-primary)] transition-colors">View Full</a></div> <div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">`);
		{
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(Array(6));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				each_array[$$index];
				$$renderer.push(`<div class="h-20 animate-pulse rounded-xl border border-[var(--color-brand-secondary)]/10 bg-[var(--color-brand-secondary)]/5"></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/lib/components/dashboard/MatchFeed.svelte
function MatchFeed($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { season = null } = $$props;
		$$renderer.push(`<div class="flex flex-col gap-12">`);
		$$renderer.push("<!--[0-->");
		BrandLoading($$renderer, { message: "Synchronizing Match Feed..." });
		$$renderer.push(`<!--]--></div>`);
	});
}
globalThis.Date;
globalThis.Set;
globalThis.Map;
globalThis.URL;
globalThis.URLSearchParams;
//#endregion
//#region ../../node_modules/svelte/src/internal/client/timing.js
/** @import { Raf } from '#client' */
var now = () => Date.now();
/** @type {Raf} */
var raf = {
	tick: (_) => noop(_),
	now: () => now(),
	tasks: /* @__PURE__ */ new Set()
};
//#endregion
//#region ../../node_modules/svelte/src/internal/client/loop.js
/** @import { TaskCallback, Task, TaskEntry } from '#client' */
/**
* @returns {void}
*/
function run_tasks() {
	const now = raf.now();
	raf.tasks.forEach((task) => {
		if (!task.c(now)) {
			raf.tasks.delete(task);
			task.f();
		}
	});
	if (raf.tasks.size !== 0) raf.tick(run_tasks);
}
/**
* Creates a new task that runs on each raf frame
* until it returns a falsy value or is aborted
* @param {TaskCallback} callback
* @returns {Task}
*/
function loop(callback) {
	/** @type {TaskEntry} */
	let task;
	if (raf.tasks.size === 0) raf.tick(run_tasks);
	return {
		promise: new Promise((fulfill) => {
			raf.tasks.add(task = {
				c: callback,
				f: fulfill
			});
		}),
		abort() {
			raf.tasks.delete(task);
		}
	};
}
//#endregion
//#region ../../node_modules/svelte/src/motion/utils.js
/**
* @param {any} obj
* @returns {obj is Date}
*/
function is_date(obj) {
	return Object.prototype.toString.call(obj) === "[object Date]";
}
//#endregion
//#region ../../node_modules/svelte/src/motion/spring.js
/** @import { Task } from '#client' */
/** @import { TickContext } from './private.js' */
/** @import { Spring as SpringStore, SpringOptions, SpringUpdateOptions } from './public.js' */
/**
* @template T
* @param {TickContext} ctx
* @param {T} last_value
* @param {T} current_value
* @param {T} target_value
* @returns {T}
*/
function tick_spring(ctx, last_value, current_value, target_value) {
	if (typeof current_value === "number" || is_date(current_value)) {
		const delta = target_value - current_value;
		const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
		const d = (velocity + (ctx.opts.stiffness * delta - ctx.opts.damping * velocity) * ctx.inv_mass) * ctx.dt;
		if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) return target_value;
		else {
			ctx.settled = false;
			return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
		}
	} else if (Array.isArray(current_value)) return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
	else if (typeof current_value === "object") {
		const next_value = {};
		for (const k in current_value) next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
		return next_value;
	} else throw new Error(`Cannot spring ${typeof current_value} values`);
}
/**
* The spring function in Svelte creates a store whose value is animated, with a motion that simulates the behavior of a spring. This means when the value changes, instead of transitioning at a steady rate, it "bounces" like a spring would, depending on the physics parameters provided. This adds a level of realism to the transitions and can enhance the user experience.
*
* @deprecated Use [`Spring`](https://svelte.dev/docs/svelte/svelte-motion#Spring) instead
* @template [T=any]
* @param {T} [value]
* @param {SpringOptions} [opts]
* @returns {SpringStore<T>}
*/
function spring(value, opts = {}) {
	const store = writable(value);
	const { stiffness = .15, damping = .8, precision = .01 } = opts;
	/** @type {number} */
	let last_time;
	/** @type {Task | null} */
	let task;
	/** @type {object} */
	let current_token;
	let last_value = value;
	let target_value = value;
	let inv_mass = 1;
	let inv_mass_recovery_rate = 0;
	let cancel_task = false;
	/**
	* @param {T} new_value
	* @param {SpringUpdateOptions} opts
	* @returns {Promise<void>}
	*/
	function set(new_value, opts = {}) {
		target_value = new_value;
		const token = current_token = {};
		if (value == null || opts.hard || spring.stiffness >= 1 && spring.damping >= 1) {
			cancel_task = true;
			last_time = raf.now();
			last_value = new_value;
			store.set(value = target_value);
			return Promise.resolve();
		} else if (opts.soft) {
			inv_mass_recovery_rate = 1 / ((opts.soft === true ? .5 : +opts.soft) * 60);
			inv_mass = 0;
		}
		if (!task) {
			last_time = raf.now();
			cancel_task = false;
			task = loop((now) => {
				if (cancel_task) {
					cancel_task = false;
					task = null;
					return false;
				}
				inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
				const elapsed = Math.min(now - last_time, 1e3 / 30);
				/** @type {TickContext} */
				const ctx = {
					inv_mass,
					opts: spring,
					settled: true,
					dt: elapsed * 60 / 1e3
				};
				const next_value = tick_spring(ctx, last_value, value, target_value);
				last_time = now;
				last_value = value;
				store.set(value = next_value);
				if (ctx.settled) task = null;
				return !ctx.settled;
			});
		}
		return new Promise((fulfil) => {
			/** @type {Task} */ task.promise.then(() => {
				if (token === current_token) fulfil();
			});
		});
	}
	/** @type {SpringStore<T>} */
	const spring = {
		set,
		update: (fn, opts) => set(fn(target_value, value), opts),
		subscribe: store.subscribe,
		stiffness,
		damping,
		precision
	};
	return spring;
}
if (typeof HTMLElement === "function");
//#endregion
//#region src/lib/components/dashboard/SeasonChampion.svelte
function SeasonChampion($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { season, winner, playerAwards, teams } = $$props;
		function getTeam(teamId) {
			return teams.find((t) => t.id === teamId);
		}
		const topAwards = derived(() => playerAwards.slice(0, 6));
		let tiltX = spring(0, {
			stiffness: .1,
			damping: .3
		});
		let tiltY = spring(0, {
			stiffness: .1,
			damping: .3
		});
		$$renderer.push(`<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-[#fbbf24]/20 border-[#fbbf24]/30 svelte-19vpmix"${attr_style(`--team-color: ${stringify(winner?.color || "var(--color-brand-primary)")}; --color-gold: #fbbf24;`)}><div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--team-color)]/20 blur-[100px] svelte-19vpmix"></div> <div class="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#fbbf24]/10 blur-[100px] svelte-19vpmix"></div> <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-40 svelte-19vpmix"><!--[-->`);
		const each_array = ensure_array_like(Array(24));
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			each_array[i];
			$$renderer.push(`<div class="confetti absolute size-1.5 rounded-full svelte-19vpmix"${attr_style(` left: ${stringify(Math.random() * 100)}%; top: -10px; background-color: ${stringify(i % 3 === 0 ? "var(--color-gold)" : i % 2 === 0 ? "var(--team-color)" : "white")}; animation: confetti-fall ${stringify(7 + Math.random() * 12)}s linear infinite; animation-delay: -${stringify(Math.random() * 15)}s; `)}></div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="relative z-10 flex flex-col gap-12 svelte-19vpmix"><div class="flex flex-col items-center justify-between gap-8 md:flex-row svelte-19vpmix"><div class="flex flex-col items-center gap-6 md:items-start svelte-19vpmix"><div class="inline-flex items-center gap-3 rounded-full border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[var(--color-gold)] border shadow-[0_0_15px_rgba(251,191,36,0.1)] svelte-19vpmix"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-19vpmix"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" class="svelte-19vpmix"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" class="svelte-19vpmix"></path><path d="M4 22h16" class="svelte-19vpmix"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" class="svelte-19vpmix"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" class="svelte-19vpmix"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" class="svelte-19vpmix"></path></svg> ${escape_html(season.name)} Champions</div> <div class="text-center md:text-left svelte-19vpmix"><h2 class="text-6xl font-black tracking-tighter text-white sm:text-7xl svelte-19vpmix"><span${attr_style(`color: ${stringify(winner?.color)}`)} class="svelte-19vpmix">${escape_html(winner?.name || "Undisputed")}</span></h2> <p class="mt-4 max-w-md text-lg font-medium leading-relaxed text-white/50 svelte-19vpmix">Dominating the season with a final record of <span class="text-white svelte-19vpmix">${escape_html(winner?.record)}</span>. 
						Their logic proved superior for Protocol One.</p></div> <div class="flex items-center gap-4 svelte-19vpmix"><div class="flex flex-col svelte-19vpmix"><span class="text-[10px] font-black uppercase tracking-widest text-white/30 svelte-19vpmix">Final Rating</span> <span class="text-2xl font-black text-[var(--team-color)] svelte-19vpmix">${escape_html(winner?.rating)}</span></div> <div class="h-8 w-px bg-white/10 svelte-19vpmix"></div> <div class="flex flex-col svelte-19vpmix"><span class="text-[10px] font-black uppercase tracking-widest text-white/30 svelte-19vpmix">Total Points</span> <span class="text-2xl font-black text-white/90 svelte-19vpmix">${escape_html(winner?.points)}</span></div></div></div> <div class="relative flex size-48 items-center justify-center rounded-2xl bg-white/5 p-8 shadow-inner md:size-64 perspective-1000 group/logo svelte-19vpmix"><div class="absolute inset-0 animate-pulse rounded-full bg-[var(--team-color)]/10 blur-[80px] svelte-19vpmix"></div> <div class="absolute inset-0 rounded-full bg-[var(--team-color)]/20 blur-[40px] transition-opacity duration-500 group-hover/logo:opacity-100 opacity-40 svelte-19vpmix"></div> <div class="absolute inset-0 z-0 flex items-center justify-center opacity-10 group-hover/logo:opacity-30 transition-opacity duration-700 svelte-19vpmix"><svg class="size-full animate-[spin_30s_linear_infinite] svelte-19vpmix" viewBox="0 0 100 100"><defs class="svelte-19vpmix"><radialGradient id="corona-grad" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse" class="svelte-19vpmix"><stop offset="30%" stop-color="var(--team-color)" stop-opacity="1" class="svelte-19vpmix"></stop><stop offset="100%" stop-color="var(--team-color)" stop-opacity="0" class="svelte-19vpmix"></stop></radialGradient></defs><!--[-->`);
		const each_array_1 = ensure_array_like(Array(8));
		for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
			each_array_1[i];
			$$renderer.push(`<path d="M50 50 L49.5 5 L50.5 5 Z" fill="url(#corona-grad)"${attr("transform", `rotate(${stringify(i * 45)} 50 50)`)} class="svelte-19vpmix"></path>`);
		}
		$$renderer.push(`<!--]--></svg></div> <div class="relative z-10 transition-all duration-200 svelte-19vpmix"${attr_style(`transform: perspective(1000px) rotateX(${stringify(store_get($$store_subs ??= {}, "$tiltX", tiltX))}deg) rotateY(${stringify(store_get($$store_subs ??= {}, "$tiltY", tiltY))}deg) scale(${stringify(store_get($$store_subs ??= {}, "$tiltX", tiltX) !== 0 ? 1.02 : 1)});`)}>`);
		if (winner) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="relative svelte-19vpmix">`);
			TeamIcon($$renderer, {
				teamName: winner.name,
				color: winner.color,
				size: "size-32 md:size-48",
				class: "drop-shadow-[0_0_20px_var(--team-color)] filter brightness-110"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			BrandLogo($$renderer, { size: "size-32 md:size-48" });
		}
		$$renderer.push(`<!--]--></div></div></div> <div class="flex flex-col gap-6 svelte-19vpmix"><div class="flex items-center justify-between border-b border-white/10 pb-4 svelte-19vpmix"><h3 class="text-xl font-black tracking-tight text-white uppercase svelte-19vpmix">Bonus Points Secured</h3> <span class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] svelte-19vpmix">Season Performance Awards</span></div> <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 svelte-19vpmix"><!--[-->`);
		const each_array_2 = ensure_array_like(topAwards());
		for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
			let award = each_array_2[$$index_3];
			$$renderer.push(`<div${attr_class(`group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-[var(--color-gold)]/30 ${stringify(award.players.length === 1 ? "border-[var(--color-gold)]/20 bg-[var(--color-gold)]/5" : "")}`, "svelte-19vpmix")}>`);
			if (award.players.length === 1) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[var(--color-gold)] text-[10px] font-black text-black shadow-lg svelte-19vpmix">★</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="flex flex-col gap-1 svelte-19vpmix"><span class="text-[10px] font-black uppercase tracking-widest text-white/30 svelte-19vpmix">${escape_html(award.type)} ${escape_html(award.formattedKey)}</span> <div class="flex items-baseline gap-2 svelte-19vpmix"><span class="text-2xl font-black text-white svelte-19vpmix">${escape_html(award.value)}</span> <span class="text-[10px] font-bold text-white/40 svelte-19vpmix">Total</span></div></div> <div class="flex flex-wrap gap-2 svelte-19vpmix"><!--[-->`);
			const each_array_3 = ensure_array_like(award.players);
			for (let $$index_2 = 0, $$length = each_array_3.length; $$index_2 < $$length; $$index_2++) {
				let player = each_array_3[$$index_2];
				const team = getTeam(player.teamId);
				$$renderer.push(`<div class="inline-flex items-center gap-2 rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/5 svelte-19vpmix"><div class="size-2 rounded-full svelte-19vpmix"${attr_style(`background-color: ${stringify(team?.color)}`)}></div> <span class="text-[10px] font-black text-white/80 uppercase tracking-tighter svelte-19vpmix">${escape_html(team?.name)} <span class="text-white/40 svelte-19vpmix">U${escape_html(player.unitIndex)}</span></span></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="mt-4 flex justify-center svelte-19vpmix"><a${attr("href", `${stringify(base)}/leaderboard`)} class="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-[var(--team-color)] transition-colors svelte-19vpmix">View Full Season Statistics <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-1 svelte-19vpmix"><path d="m9 18 6-6-6-6" class="svelte-19vpmix"></path></svg></a></div></div></div></div>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let featuredMatch = null;
		let allSeasons = [];
		let selectedSeasonId = null;
		let selectedSeason = derived(() => allSeasons.find((s) => s.id === selectedSeasonId));
		let now = /* @__PURE__ */ new Date();
		let isSeasonOver = derived(() => selectedSeason() && (new Date(selectedSeason().end_date) < now || selectedSeason().status === "completed"));
		let standingsResult = null;
		head("1uha8ag", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Maintainer One | The Dashboard</title>`);
			});
		});
		LeagueTicker($$renderer, { season: selectedSeason() });
		$$renderer.push(`<!----> <main data-component="dashboard" class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8"><header class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12"><div class="flex items-center gap-5 px-5 py-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-xl">`);
		BrandLogo$1($$renderer, { size: "size-12" });
		$$renderer.push(`<!----> <div class="flex flex-col"><h1 class="text-white text-3xl font-black tracking-tighter leading-none flex items-center gap-2"><span class="text-[var(--color-brand-secondary)]">MAINTAINER</span> <span class="text-[var(--color-brand-primary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">ONE</span></h1> <div class="flex items-center gap-2 mt-1"><p class="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">Dashboard</p> `);
		if (allSeasons.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5"><span class="text-[9px] font-black uppercase text-white/30 tracking-widest">Season</span> `);
			$$renderer.select({
				value: selectedSeasonId,
				class: "bg-transparent text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] border-none p-0 cursor-pointer focus:ring-0"
			}, ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(allSeasons);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let s = each_array[$$index];
					$$renderer.option({
						value: s.id,
						class: "bg-[#111]"
					}, ($$renderer) => {
						$$renderer.push(`${escape_html(s.name)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div></div> <div class="flex items-center gap-3"><a${attr("href", `${stringify(base)}/schedule`)} class="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest">Schedule</a> <a${attr("href", `${stringify(base)}/team/exhibition`)} class="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest">Practice</a> <a${attr("href", `${stringify(base)}/film-room`)} class="px-6 py-2.5 bg-[var(--color-brand-secondary)] text-[var(--color-background-dark)] font-black rounded-xl shadow-lg shadow-black/20 hover:scale-105 transition-all text-sm uppercase tracking-tighter">Film Room</a> <a${attr("href", `${stringify(base)}/multiview`)} class="px-6 py-2.5 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/20 hover:scale-105 transition-all text-sm uppercase tracking-tighter flex items-center gap-2"><span class="h-2 w-2 rounded-xl bg-white animate-pulse"></span> Multiview</a> `);
		if (data.session) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="relative group"><button class="flex items-center gap-3 p-1.5 pr-4 bg-white/5 border border-white/10 rounded-xl hover:border-[var(--color-brand-primary)]/30 transition-all shadow-xl group/btn"><div class="h-8 w-8 rounded-lg overflow-hidden bg-[var(--color-brand-primary)]/20 border border-white/5 flex items-center justify-center">`);
			if (data.profile?.avatar_url) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<img${attr("src", data.profile.avatar_url)}${attr("alt", data.profile.username)} class="h-full w-full object-cover"/>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<span class="text-xs font-black text-[var(--color-brand-primary)]">${escape_html(data.profile?.username?.charAt(0).toUpperCase() || "U")}</span>`);
			}
			$$renderer.push(`<!--]--></div> <div class="flex flex-col items-start"><span class="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">Maintainer</span> <span class="text-[11px] font-black text-white uppercase tracking-tighter leading-none">@${escape_html(data.profile?.username || "user")}</span></div> <svg class="h-4 w-4 text-white/20 group-hover/btn:text-[var(--color-brand-primary)] transition-colors ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button> <div class="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">`);
			if (data.roles?.includes("project_maintainer") || data.roles?.includes("league_maintainer")) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="px-5 py-2 border-b border-white/5 bg-white/5"><span class="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Management</span></div> <a${attr("href", `${stringify(base)}/admin/league`)} class="flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-colors"><svg class="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> League Admin</a>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (data.roles?.includes("project_maintainer")) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<a${attr("href", `${stringify(base)}/admin/authority`)} class="flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)]/60 hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors border-t border-white/5"><svg class="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> Platform Authority</a>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <button class="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors border-t border-white/5"><svg class="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Sign Out</button></div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<a${attr("href", `${stringify(base)}/login`)} class="px-6 py-2.5 bg-white/10 border border-white/10 text-white font-black rounded-xl shadow-lg hover:bg-white/20 transition-all text-sm uppercase tracking-tighter flex items-center gap-2">Sign In</a>`);
		}
		$$renderer.push(`<!--]--></div></header> <div class="grid grid-cols-1 gap-8 lg:grid-cols-12"><div class="lg:col-span-4 xl:col-span-3"><div class="sticky top-8">`);
		StandingsBoard($$renderer, { season: selectedSeason() });
		$$renderer.push(`<!----></div></div> <div class="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">`);
		if (isSeasonOver() && standingsResult?.winner) {
			$$renderer.push("<!--[0-->");
			SeasonChampion($$renderer, {
				season: selectedSeason(),
				winner: standingsResult.winner,
				playerAwards: standingsResult.playerAwards,
				teams: standingsResult.teams
			});
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-8 shadow-2xl"><div class="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-brand-secondary)]/10 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100"></div> <div class="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between"><div><div class="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-3 py-1 text-[10px] font-black tracking-[0.1em] text-[var(--color-brand-secondary)] uppercase"><span class="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand-primary)]"></span> ${escape_html([
				"played",
				"simulated",
				"simmed"
			].includes(featuredMatch?.status) ? "Latest Match" : "Upcoming Match")}</div> <h2 class="text-4xl font-black text-white tracking-tighter">`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`League <span class="text-[var(--color-brand-secondary)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] mx-2">VS</span> Pitch`);
			$$renderer.push(`<!--]--></h2> <p class="mt-2 max-w-md text-sm text-white/70 font-medium leading-relaxed">${escape_html(selectedSeason() ? `Currently viewing ${selectedSeason().name}. Check out the latest high-stakes matchups.` : "No active season. Create one in the admin panel to get started.")}</p></div> `);
			if (data.roles?.includes("project_maintainer") || data.roles?.includes("league_maintainer")) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<a${attr("href", `${stringify(base)}/admin/league`)} class="mt-4 flex items-center justify-center rounded-xl bg-[var(--color-brand-secondary)] px-8 py-4 font-black text-[var(--color-background-dark)] shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 md:mt-0">Create Season <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></a>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="mt-4 flex items-center gap-2 text-[var(--color-brand-primary)] font-black uppercase tracking-widest text-xs"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Standby for Season Launch</div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (!isSeasonOver()) {
			$$renderer.push("<!--[0-->");
			MatchFeed($$renderer, { season: selectedSeason() });
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div></main>`);
	});
}
//#endregion
export { _page as default };
