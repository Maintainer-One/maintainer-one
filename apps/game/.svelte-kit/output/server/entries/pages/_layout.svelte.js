import { K as escape_html } from "../../chunks/index-server.js";
import { t as modal } from "../../chunks/modal.js";
//#region src/lib/components/Modal.svelte
function Modal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let state = void 0;
		modal.subscribe((v) => state = v);
		if (state && state.isOpen) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40"><div class="absolute inset-0"></div> <div class="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0c] p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)]"><div class="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-[var(--color-brand-primary)] opacity-10 blur-[100px]"></div> <div class="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[var(--color-brand-secondary)] opacity-10 blur-[100px]"></div> <div class="relative z-10 space-y-6"><header><h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-brand-primary)] mb-2">${escape_html(state.title)}</h2> <p class="text-lg font-black text-white tracking-tight leading-tight">${escape_html(state.message)}</p></header> <footer class="flex items-center justify-end gap-3 pt-4">`);
			if (state.type === "confirm") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">${escape_html(state.cancelText || "Cancel")}</button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <button class="px-8 py-3 rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">${escape_html(state.confirmText || "OK")}</button></footer></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children } = $$props;
		children($$renderer);
		$$renderer.push(`<!----> `);
		Modal($$renderer, {});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
export { _layout as default };
