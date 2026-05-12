import { h as base } from "../../../../../chunks/environment.js";
import { s as head } from "../../../../../chunks/dev.js";
import "../../../../../chunks/paths.js";
import "../../../../../chunks/state.js";
import "../../../../../chunks/supabase.js";
import { t as BrandLoading } from "../../../../../chunks/BrandLoading.js";
//#region src/routes/match/[id]/stats/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		`${base}`;
		head("vvkum2", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Match Stats | Maintainer One</title>`);
			});
		});
		$$renderer.push(`<div class="flex flex-col gap-12 p-6 lg:p-10 max-w-7xl mx-auto w-full min-h-screen">`);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="py-20">`);
		BrandLoading($$renderer, { message: "Loading Final Stats..." });
		$$renderer.push(`<!----></div>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };
