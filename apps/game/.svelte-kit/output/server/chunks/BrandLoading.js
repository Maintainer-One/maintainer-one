import { K as escape_html } from "./index-server.js";
import { t as BrandLogo } from "./BrandLogo.js";
//#region src/lib/components/BrandLoading.svelte
function BrandLoading($$renderer, $$props) {
	let { message = "Loading..." } = $$props;
	$$renderer.push(`<div class="flex flex-col items-center justify-center gap-4 py-12"><div class="relative"><div class="absolute inset-0 animate-ping rounded-full bg-[var(--color-brand-primary)]/20 opacity-75"></div> `);
	BrandLogo($$renderer, {
		size: "size-16",
		class: "relative animate-pulse"
	});
	$$renderer.push(`<!----></div> `);
	if (message) {
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p class="text-sm font-medium tracking-widest text-white/40 uppercase animate-pulse">${escape_html(message)}</p>`);
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div>`);
}
//#endregion
export { BrandLoading as t };
