<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		code: string;
		onCodeChange?: (newCode: string) => void;
	}

	let { code, onCodeChange }: Props = $props();

	let EditorComponent: any = $state(null);
	let isDesktop = $state(true);
	let forceEditor = $state<'auto' | 'monaco' | 'codemirror'>('auto');

	$effect(() => {
		if (!browser) return;

		let shouldLoadMonaco = isDesktop;
		if (forceEditor === 'monaco') shouldLoadMonaco = true;
		if (forceEditor === 'codemirror') shouldLoadMonaco = false;

		// We use a non-tracked async function to load the component
		// to avoid Svelte $effect infinite loops
		loadEditor(shouldLoadMonaco);
	});

	async function loadEditor(loadMonaco: boolean) {
		if (loadMonaco) {
			EditorComponent = (await import('./MonacoEditor.svelte')).default;
		} else {
			EditorComponent = (await import('./Editor.svelte')).default;
		}
	}

	onMount(() => {
		if (browser) {
			// Check if screen is lg or larger
			const mql = window.matchMedia('(min-width: 1024px)');
			isDesktop = mql.matches;
			
			const handleChange = (e: MediaQueryListEvent) => {
				isDesktop = e.matches;
			};
			
			mql.addEventListener('change', handleChange);
			return () => mql.removeEventListener('change', handleChange);
		}
	});
</script>

<div class="flex h-full w-full flex-col relative">
	{#if EditorComponent}
		<div class="absolute top-2 right-4 z-10 flex gap-1">
			<button 
				onclick={() => forceEditor = 'codemirror'}
				class="rounded px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase transition-colors 
					{forceEditor === 'codemirror' || (!isDesktop && forceEditor === 'auto') ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}"
				title="Use Lightweight Editor (Mobile Optimized)"
			>
				Basic
			</button>
			<button 
				onclick={() => forceEditor = 'monaco'}
				class="rounded px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase transition-colors 
					{forceEditor === 'monaco' || (isDesktop && forceEditor === 'auto') ? 'bg-blue-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}"
				title="Use Pro Editor (Full TypeScript Intelligence)"
			>
				Pro
			</button>
		</div>

		<EditorComponent {code} {onCodeChange} />
	{:else}
		<div class="flex h-full w-full items-center justify-center bg-zinc-900/50 text-xs italic text-zinc-600">
			Loading Editor Environment...
		</div>
	{/if}
</div>
