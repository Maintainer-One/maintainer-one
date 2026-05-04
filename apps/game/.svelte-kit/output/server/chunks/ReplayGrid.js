import { K as escape_html, a as attr_style, f as stringify, s as ensure_array_like } from "./index-server.js";
//#region src/lib/components/ReplayGrid.svelte
function ReplayGrid($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { state, showControlMap = false, playSpeed = 750 } = $$props;
		const GRID_SIZE = 10;
		function getPos(pos) {
			return {
				left: `${pos.x / GRID_SIZE * 100}%`,
				top: `${pos.y / GRID_SIZE * 100}%`,
				width: `${1 / GRID_SIZE * 100}%`,
				height: `${1 / GRID_SIZE * 100}%`
			};
		}
		$$renderer.push(`<div class="relative aspect-square h-full max-h-full max-w-full rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl svelte-k0e8q1" data-component="ReplayGrid"><div class="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none svelte-k0e8q1"><div class="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-30 svelte-k0e8q1"><!--[-->`);
		const each_array = ensure_array_like(Array(100));
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			each_array[i];
			$$renderer.push(`<div class="border-[0.5px] border-[var(--color-brand-primary)]/20 svelte-k0e8q1"></div>`);
		}
		$$renderer.push(`<!--]--></div> `);
		if (showControlMap && state.controlMap) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute inset-0 grid grid-cols-10 grid-rows-10 svelte-k0e8q1"><!--[-->`);
			const each_array_1 = ensure_array_like(state.controlMap);
			for (let y = 0, $$length = each_array_1.length; y < $$length; y++) {
				let row = each_array_1[y];
				$$renderer.push(`<!--[-->`);
				const each_array_2 = ensure_array_like(row);
				for (let x = 0, $$length = each_array_2.length; x < $$length; x++) {
					let cell = each_array_2[x];
					$$renderer.push(`<div class="transition-colors duration-500 svelte-k0e8q1"${attr_style(`background-color: ${stringify(cell && cell !== "CONTESTED" ? `${state.teams[cell].color}22` : cell === "CONTESTED" ? "#f59e0b11" : "transparent")}`)}></div>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <!--[-->`);
		const each_array_3 = ensure_array_like(state.pointZones);
		for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
			let pz = each_array_3[$$index_3];
			$$renderer.push(`<div class="absolute flex items-center justify-center transition-all duration-500 svelte-k0e8q1"${attr_style(` left: ${stringify(getPos(pz.position).left)}; top: ${stringify(getPos(pz.position).top)}; width: ${stringify(getPos(pz.position).width)}; height: ${stringify(getPos(pz.position).height)}; `)}><div class="h-4/5 w-4/5 animate-pulse rounded-xl bg-[var(--color-brand-primary)]/10 shadow-[0_0_25px_rgba(5,150,105,0.4)] border border-[var(--color-brand-primary)]/40 flex flex-col items-center justify-center relative svelte-k0e8q1"><span class="text-[10px] font-black text-[var(--color-brand-secondary)] tracking-widest uppercase svelte-k0e8q1">Zone</span> `);
			if (pz.age !== void 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="absolute -top-2 -right-2 text-[8px] font-black bg-[var(--color-brand-primary)] text-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg svelte-k0e8q1">${escape_html(pz.age)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--> <!--[-->`);
		const each_array_4 = ensure_array_like(state.players);
		for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
			let player = each_array_4[$$index_4];
			$$renderer.push(`<div class="absolute flex items-center justify-center transition-all ease-in-out svelte-k0e8q1"${attr_style(` left: ${stringify(getPos(player.position).left)}; top: ${stringify(getPos(player.position).top)}; width: ${stringify(getPos(player.position).width)}; height: ${stringify(getPos(player.position).height)}; transition-duration: ${stringify(playSpeed)}ms; `)}><div class="relative flex h-4/5 w-4/5 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-md transition-colors duration-300 svelte-k0e8q1"${attr_style(`border-color: ${stringify(state.teams[player.team].color)}; background-color: ${stringify(state.teams[player.team].color)}33; color: ${stringify(state.teams[player.team].color)}; box-shadow: 0 0 10px ${stringify(state.teams[player.team].color)}33;`)}><span class="text-[10px] font-black uppercase svelte-k0e8q1">${escape_html(state.teams[player.team].name[0])}${escape_html(player.id.slice(1))}</span> `);
			if (player.status === "stunned") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="absolute -top-2 -right-2 text-[8px] font-black bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center animate-bounce shadow-lg svelte-k0e8q1">⚡</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="absolute -inset-1.5 -z-10 animate-pulse rounded-full opacity-20 svelte-k0e8q1"${attr_style(`background-color: ${stringify(state.teams[player.team].color)}`)}></div></div></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (state.lastEvents) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<!--[-->`);
			const each_array_5 = ensure_array_like(state.lastEvents);
			for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
				let event = each_array_5[$$index_5];
				$$renderer.push(`<div class="absolute flex items-center justify-center pointer-events-none z-40 svelte-k0e8q1"${attr_style(` left: ${stringify(getPos(event.position).left)}; top: ${stringify(getPos(event.position).top)}; width: ${stringify(getPos(event.position).width)}; height: ${stringify(getPos(event.position).height)}; `)}>`);
				if (event.type === "CAPTURE") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="absolute text-xl md:text-2xl font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] -mt-16 svelte-k0e8q1"${attr_style(`color: ${stringify(state.teams[event.team].color)}`)}>+${escape_html(event.score)}</div> <div class="absolute inset-0 rounded-full border-[3px] opacity-0 svelte-k0e8q1"${attr_style(`border-color: ${stringify(state.teams[event.team].color)}; animation: pop ${stringify(Math.min(600, playSpeed))}ms ease-out forwards;`)}></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (state.isFinished) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute inset-0 flex items-center justify-center bg-[var(--color-background-dark)]/60 backdrop-blur-md transition-opacity duration-1000 z-50 svelte-k0e8q1"><div class="rounded-[2rem] border border-[var(--color-brand-primary)]/30 bg-black/40 p-12 text-center shadow-[0_0_50px_rgba(5,150,105,0.2)] backdrop-blur-3xl transition-all duration-500 hover:scale-[1.02] svelte-k0e8q1"><div class="mb-4 inline-block rounded-full bg-[var(--color-brand-primary)]/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)] svelte-k0e8q1">Match Concluded</div> <h2 class="text-5xl font-black italic tracking-tighter text-white uppercase leading-none svelte-k0e8q1"><span${attr_style(`color: ${stringify(state.teams[state.winner].color)}`)} class="svelte-k0e8q1">${escape_html(state.teams[state.winner].name)}</span> <span class="text-[var(--color-brand-primary)] svelte-k0e8q1">Wins!</span></h2> <div class="mt-6 flex flex-col items-center gap-1 svelte-k0e8q1"><p class="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] svelte-k0e8q1">Capture complete</p> <p class="text-[var(--color-brand-secondary)] font-black text-xs uppercase svelte-k0e8q1">Tick ${escape_html(state.tick)}</p></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { ReplayGrid as t };
