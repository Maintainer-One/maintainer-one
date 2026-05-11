import { createDefaultMapFromCDN, createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import ts from 'typescript';
import fs from 'fs';

(async () => {
    const typesRaw = fs.readFileSync('packages/engine/types.ts', 'utf-8');
    const teamApiRaw = fs.readFileSync('packages/engine/team_api.ts', 'utf-8');

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

    const fsMap = await createDefaultMapFromCDN(compilerOpts, ts.version, false, ts);
    
    fsMap.set('/packages/engine/types.ts', typesRaw);
    fsMap.set('/packages/engine/team_api.ts', teamApiRaw);
    
    const code = `import type { PlayerAction, SensedState } from '../../packages/engine/team_api.ts';
export const teamLogic = (sense: SensedState): PlayerAction[] => { return []; }`;
    fsMap.set('/index.ts', code);

    const system = createSystem(fsMap);
    const env = createVirtualTypeScriptEnvironment(system, ['/index.ts'], ts, compilerOpts);
    
    const hover = env.languageService.getQuickInfoAtPosition('/index.ts', code.indexOf('SensedState)'));
    if (hover && hover.displayParts) {
        console.log("Hover:", hover.displayParts.map(p => p.text).join(''));
    } else {
        console.log("No hover info for SensedState");
    }
})();
