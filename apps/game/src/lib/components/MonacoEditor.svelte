<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	
	// Import raw type definitions for Monaco Intelligence
	import teamApiRaw from '$packages/engine/team_api.ts?raw';
	import typesRaw from '$packages/engine/types.ts?raw';

	interface Props {
		code: string;
		onCodeChange?: (newCode: string) => void;
	}

	let { code, onCodeChange }: Props = $props();

	let editorContainer: HTMLDivElement;
	let editor: any;
	let monacoInstance: any;

	onMount(async () => {
		if (browser) {
			// Dynamically import monaco and workers
			const monaco = await import('monaco-editor');
			const editorWorker = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
			const tsWorker = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');

			self.MonacoEnvironment = {
				getWorker: function (_moduleId: any, label: string) {
					if (label === 'typescript' || label === 'javascript') {
						return new tsWorker.default();
					}
					return new editorWorker.default();
				}
			};

			monacoInstance = monaco;

			// Configure TypeScript Compiler Options
			monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
				target: monaco.languages.typescript.ScriptTarget.ESNext,
				allowNonTsExtensions: true,
				moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
				module: monaco.languages.typescript.ModuleKind.CommonJS,
				noEmit: true,
				esModuleInterop: true,
			});

			// Feed the engine types to Monaco
			monaco.languages.typescript.typescriptDefaults.addExtraLib(typesRaw, 'file:///packages/engine/types.ts');
			monaco.languages.typescript.typescriptDefaults.addExtraLib(teamApiRaw, 'file:///packages/engine/team_api.ts');

			// Create a virtual model at a specific path so relative imports work
			// User code imports '../../packages/engine/team_api.ts'
			// From 'file:///src/routes/logic.ts', '../../packages/' resolves to 'file:///packages/'
			const modelUri = monaco.Uri.parse('file:///src/routes/logic.ts');
			let model = monaco.editor.getModel(modelUri);
			if (!model) {
				model = monaco.editor.createModel(code, 'typescript', modelUri);
			} else {
				model.setValue(code);
			}

			editor = monaco.editor.create(editorContainer, {
				model: model,
				language: 'typescript',
				theme: 'vs-dark',
				automaticLayout: true,
				minimap: { enabled: false },
				fontSize: 12,
				fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
				padding: { top: 16 },
				scrollBeyondLastLine: false,
				roundedSelection: true,
				renderLineHighlight: "all",
				fixedOverflowWidgets: true,
				wordWrap: 'on',
			});

			editor.onDidChangeModelContent(() => {
				if (onCodeChange) {
					onCodeChange(editor.getValue());
				}
			});
		}
	});

	// React to external code changes
	$effect(() => {
		if (editor && code !== editor.getValue()) {
			editor.setValue(code);
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.dispose();
		}
	});
</script>

<div bind:this={editorContainer} class="h-full w-full overflow-hidden rounded-lg border border-white/10 shadow-inner"></div>
