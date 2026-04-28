import type { TeamLogic } from './team_api.ts';

/**
 * Loads and executes a Team Logic string securely.
 * For Phase 3, we use new Function(). In a production multi-tenant environment,
 * we would use a more isolated sandbox or Web Worker.
 */
export function loadLogicFromString(code: string): TeamLogic {
	try {
		// Expecting the code to either export a 'teamLogic' function 
		// or be a self-contained function body that returns PlayerAction[].
		// For our MVP, we'll assume the code is a function body or a simple export.
		
		// If the code contains "export const teamLogic", we need to adapt.
		// A simple way for MVP is to wrap it or use a data URI import in Deno.
		
		// Let's try the dynamic import approach for Deno, as it handles ES modules.
		// However, for browser compatibility in the future, we might need a different path.
		
		// For Deno, data URIs are great:
		// const module = await import(`data:application/javascript,${encodeURIComponent(code)}`);
		// return module.teamLogic;
		
		// But since we want this to be synchronous for the tick loop, 
		// we'll assume the code is pre-compiled to a function body or similar.
		
		// Alternative: The DB stores a compiled JS function body.
		return new Function('sense', code) as TeamLogic;
	} catch (err) {
		console.error('Failed to load team logic from string:', err);
		// Return a fallback "do nothing" logic
		return () => [];
	}
}
