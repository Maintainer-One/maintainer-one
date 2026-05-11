import {
	createDefaultMapFromCDN,
	createSystem,
	createVirtualTypeScriptEnvironment
} from '@typescript/vfs';
import ts from 'typescript';
import * as Comlink from 'comlink';
import { createWorker } from '@valtown/codemirror-ts/worker';

import teamApiRaw from '$packages/engine/team_api.ts?raw';
import typesRaw from '$packages/engine/types.ts?raw';

Comlink.expose(
	createWorker(async function () {
		const compilerOpts = {
			target: ts.ScriptTarget.ES2022,
			allowNonTsExtensions: true,
			allowImportingTsExtensions: true,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			module: ts.ModuleKind.ESNext,
			noEmit: true,
			esModuleInterop: true,
			baseUrl: '/',
			paths: {
				'$packages/*': ['packages/*']
			}
		};

		const fsMap = await createDefaultMapFromCDN(
			compilerOpts,
			ts.version,
			false, // don't use localStorage cache in worker
			ts
		);

		// Add our ambient types so the language server knows about them
		fsMap.set('/packages/engine/types.ts', typesRaw);
		fsMap.set('/packages/engine/team_api.ts', teamApiRaw);

		const system = createSystem(fsMap);
		const env = createVirtualTypeScriptEnvironment(system, [], ts, compilerOpts);
		
		return env;
	})
);
