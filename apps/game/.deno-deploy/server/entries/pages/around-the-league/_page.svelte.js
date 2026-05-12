import { X as escape_html, Y as attr, o as ensure_array_like, s as head } from "../../../chunks/dev.js";
//#region src/routes/around-the-league/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		head("ybyg48", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Around the League - Maintainer One</title>`);
			});
		});
		$$renderer.push(`<div class="mx-auto max-w-4xl p-6 lg:p-10"><header class="mb-10 flex items-center justify-between"><div><h1 class="text-3xl font-black uppercase tracking-tighter text-[var(--color-brand-secondary)]">Around The <span class="text-[var(--color-brand-primary)]">League</span></h1> <p class="mt-2 text-sm text-text-secondary">Community content, news, and analysis.</p></div> `);
		if (data.user) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<a href="/around-the-league/submit" class="rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[var(--color-brand-primary)]/80 shadow-lg">Submit Content</a>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<a href="/login" class="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10">Login to Submit</a>`);
		}
		$$renderer.push(`<!--]--></header> <div class="flex flex-col gap-4">`);
		const each_array = ensure_array_like(data.posts);
		if (each_array.length !== 0) {
			$$renderer.push("<!--[-->");
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let post = each_array[$$index];
				$$renderer.push(`<a${attr("href", post.url)} target="_blank" rel="noopener noreferrer" class="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-md transition-all hover:border-[var(--color-brand-primary)]/30 hover:bg-black/40 hover:shadow-xl"><div class="flex items-center justify-between"><h2 class="text-lg font-bold text-text-primary transition-colors group-hover:text-[var(--color-brand-primary)]">${escape_html(post.title)}</h2> <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-text-secondary">${escape_html(post.content_type)}</span></div> <div class="flex items-center justify-between text-xs text-text-tertiary"><div class="flex items-center gap-2">`);
				if (post.profiles?.avatar_url) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<img${attr("src", post.profiles.avatar_url)}${attr("alt", post.profiles.username)} class="h-5 w-5 rounded-full"/>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <span class="font-medium">@${escape_html(post.profiles?.username || "Unknown")}</span></div> <time>${escape_html(new Date(post.created_at).toLocaleDateString())}</time></div></a>`);
			}
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<div class="rounded-2xl border border-white/5 bg-black/20 p-10 text-center backdrop-blur-md"><p class="text-text-secondary">No community content submitted yet.</p> <p class="mt-2 text-sm text-text-tertiary">Be the first to share something!</p></div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
export { _page as default };
