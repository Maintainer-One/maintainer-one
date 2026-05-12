import { X as escape_html, Y as attr, s as head } from "../../../../chunks/dev.js";
import "../../../../chunks/client.js";
import "../../../../chunks/navigation.js";
//#region src/routes/around-the-league/submit/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { form } = $$props;
		let submitting = false;
		head("tvqg7h", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Submit Content - Maintainer One</title>`);
			});
		});
		$$renderer.push(`<div class="mx-auto max-w-2xl p-6 lg:p-10"><header class="mb-10"><button class="group mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/20 text-white/20 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/5 hover:text-[var(--color-brand-primary)] active:scale-95" aria-label="Go Back"><svg class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button> <h1 class="text-3xl font-black uppercase tracking-tighter text-[var(--color-brand-secondary)]">Submit <span class="text-[var(--color-brand-primary)]">Content</span></h1> <p class="mt-2 text-sm text-text-secondary">Share news, videos, or analysis with the community.</p></header> <form method="POST" class="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/20 p-8 shadow-2xl backdrop-blur-xl">`);
		if (form?.message) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">${escape_html(form.message)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="flex flex-col gap-2"><label for="title" class="text-xs font-bold uppercase tracking-wider text-text-secondary">Title</label> <input type="text" id="title" name="title"${attr("value", form?.title ?? "")} required="" placeholder="Epic match breakdown..." class="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"/></div> <div class="flex flex-col gap-2"><label for="url" class="text-xs font-bold uppercase tracking-wider text-text-secondary">URL</label> <input type="url" id="url" name="url"${attr("value", form?.url ?? "")} required="" placeholder="https://..." class="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]"/></div> <div class="flex flex-col gap-2"><label for="content_type" class="text-xs font-bold uppercase tracking-wider text-text-secondary">Type</label> <select id="content_type" name="content_type" required="" class="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]">`);
		$$renderer.option({ value: "link" }, ($$renderer) => {
			$$renderer.push(`General Link`);
		});
		$$renderer.option({ value: "video" }, ($$renderer) => {
			$$renderer.push(`Video / Stream`);
		});
		$$renderer.option({ value: "analysis" }, ($$renderer) => {
			$$renderer.push(`Analysis / Blog`);
		});
		$$renderer.option({ value: "news" }, ($$renderer) => {
			$$renderer.push(`League News`);
		});
		$$renderer.push(`</select></div> <button type="submit"${attr("disabled", submitting, true)} class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--color-brand-primary)]/80 disabled:opacity-50">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`Submit to Hub`);
		$$renderer.push(`<!--]--></button></form></div>`);
	});
}
//#endregion
export { _page as default };
