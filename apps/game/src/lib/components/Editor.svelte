<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView } from '@codemirror/view';
	import { javascript } from '@codemirror/lang-javascript';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { EditorState } from '@codemirror/state';

	interface Props {
		code: string;
		onCodeChange?: (newCode: string) => void;
	}

	let { code, onCodeChange }: Props = $props();

	let editorContainer: HTMLDivElement;
	let view: EditorView;

	onMount(() => {
		const startState = EditorState.create({
			doc: code,
			extensions: [
				basicSetup,
				javascript({ typescript: true }),
				oneDark,
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

		return () => {
			if (view) view.destroy();
		};
	});

	let isSettingValue = false;

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

<div bind:this={editorContainer} class="h-full w-full overflow-hidden rounded-lg border border-white/10 bg-[#282c34] text-sm shadow-inner"></div>

<style>
	:global(.cm-editor) {
		height: 100%;
	}
	:global(.cm-scroller) {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
	}
</style>
