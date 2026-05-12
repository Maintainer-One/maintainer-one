<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { basicSetup } from 'codemirror';
	import { EditorView } from '@codemirror/view';
	import { javascript } from '@codemirror/lang-javascript';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { EditorState } from '@codemirror/state';
	import { autocompletion } from '@codemirror/autocomplete';
	import * as Comlink from 'comlink';
	import {
		tsFacetWorker,
		tsSyncWorker,
		tsLinterWorker,
		tsHoverWorker,
		tsAutocompleteWorker
	} from '@valtown/codemirror-ts';
	import type { WorkerShape } from '@valtown/codemirror-ts/worker';

	interface Props {
		code: string;
		readOnly?: boolean;
		onCodeChange?: (newCode: string) => void;
	}

	let { code, readOnly = false, onCodeChange }: Props = $props();

	let editorContainer: HTMLDivElement;
	let view: EditorView;
	let innerWorker: Worker | null = null;
	let isSettingValue = false;
	let isInitializing = $state(true);

	onMount(async () => {
		if (!browser) return;

		// Initialize the background TS Language Server Worker
		const WorkerConstructor = (await import('../workers/ts.worker.ts?worker')).default;
		innerWorker = new WorkerConstructor();
		const worker = Comlink.wrap<WorkerShape>(innerWorker);
		await worker.initialize();

		// Virtual path in the TS environment
		const path = 'index.ts';

		const startState = EditorState.create({
			doc: code,
			extensions: [
				basicSetup,
				javascript({ typescript: true }),
				oneDark,
				tsFacetWorker.of({ worker, path }),
				tsSyncWorker(),
				tsLinterWorker(),
				tsHoverWorker(),
				autocompletion({ override: [tsAutocompleteWorker()] }),
				EditorState.readOnly.of(readOnly),
				EditorView.lineWrapping,
				EditorView.updateListener.of((update) => {
					if (update.docChanged && onCodeChange && !isSettingValue) {
						onCodeChange(update.state.doc.toString());
					}
				})
			]
		});

		view = new EditorView({
			state: startState,
			parent: editorContainer
		});

		isInitializing = false;

		return () => {
			if (view) view.destroy();
			if (innerWorker) innerWorker.terminate();
		};
	});

	// React to code changes from parent
	$effect(() => {
		if (view && code !== view.state.doc.toString()) {
			isSettingValue = true;
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: code }
			});
			isSettingValue = false;
		}
	});
</script>

<div class="flex h-full w-full flex-col relative">
	{#if isInitializing}
		<div class="absolute inset-0 z-10 flex h-full w-full items-center justify-center bg-[#282c34] text-xs italic text-zinc-500">
			Loading Editor Environment...
		</div>
	{/if}
	<div bind:this={editorContainer} class="h-full w-full overflow-hidden rounded-lg border border-white/10 bg-[#282c34] text-sm shadow-inner {readOnly ? 'opacity-80' : ''}"></div>
</div>

<style>
	:global(.cm-editor) {
		height: 100%;
	}
	:global(.cm-scroller) {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
	}
	:global(.cm-tooltip) {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		padding: 6px 8px !important;
		border-radius: 6px !important;
		background-color: #1e1e24 !important;
		border: 1px solid rgba(255, 255, 255, 0.1) !important;
		font-size: 13px !important;
	}
	:global(.cm-tooltip-hover) {
		white-space: pre-wrap !important;
	}
	:global(.cm-editor[aria-readonly="true"] .cm-content) {
		cursor: not-allowed !important;
	}
</style>

