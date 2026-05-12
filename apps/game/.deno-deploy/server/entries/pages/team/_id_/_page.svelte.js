import "../../../../chunks/environment.js";
import { a as derived } from "../../../../chunks/dev.js";
import "../../../../chunks/paths.js";
import { t as page } from "../../../../chunks/state.js";
import "../../../../chunks/supabase.js";
import "../../../../chunks/TeamIcon.js";
import { t as BrandLoading } from "../../../../chunks/BrandLoading.js";
//#region src/routes/team/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		derived(() => page.params.id);
		$$renderer.push(`<div class="min-h-screen bg-[var(--color-background-dark)] text-[var(--color-brand-secondary)]/90 selection:bg-[var(--color-brand-primary)]/30">`);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="flex h-screen items-center justify-center">`);
		BrandLoading($$renderer, { message: "Retrieving Team Data..." });
		$$renderer.push(`<!----></div>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };
