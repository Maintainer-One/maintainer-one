# Maintainer One Roadmap

This document outlines the high-level roadmap and upcoming phases for the Maintainer One platform, focusing on a **"Dev-First"** experience where the app serves as a high-performance logic IDE and league dashboard.

## Current Status

**Foundational Architecture Established:**
- **Simulation Engine**: Core deterministic Deno simulation engine (`packages/engine`) with seeded PRNG and immutable state patterns.
- **Protocol V1**: Initial ruleset and mechanics established (`packages/protocols/v1/rules.ts`).
- **Infrastructure**: Supabase configured for database and authentication.
- **Experimental Film Room**: Early skeleton for replay viewing in SvelteKit.

## Upcoming Phases

### Phase 1: The "Live Logic" Film Room (DX Focus)
*The goal is to create a tight feedback loop for logic engineering.*
- [x] **Hybrid IDE Architecture**: Dual-editor system using Monaco for desktop (full TypeScript intelligence) and CodeMirror for mobile (fast fallback).
- [x] **Browser-Side Sim**: Web Worker simulation allowing instant "What If" branching without server round-trips.
- [x] **Playback Controls**: Advanced time-travel debugging (tick-by-tick, pause, speed control).
- [x] **State Awareness**: Live recursive state inspector and interactive protocol documentation hovers.
- [x] **Workspace Customization**: Resizable logic editor panel to balance code vs field views.

### Phase 2: League Dashboard (Command Center Redesign)
*The goal is to replace the generic landing page with a live game environment.*
- [ ] **The "Big Board"**: Redesign the homepage into a live dashboard showing current standings and high-impact match feeds.
- [ ] **Team Identity**: Branding and customization for user teams.
- [ ] **League Ticker**: Real-time event feed for match results and logic deployments.

### Phase 3: Analytics & Scouting Groundwork
*The goal is to provide data-driven insights for competitive strategy.*
- [ ] **Micro-Stats**: Efficiency ratings, aggression metrics, and zone control analytics.
- [ ] **Visualizations**: Heatmaps and efficiency charts integrated into the Film Room.
- [ ] **Scouting Reports**: Comparison tools for analyzing rival team logic performance.

## Long-Term Vision

- **Evolution of the Protocol System**: Moving toward more complex physics, larger grids, and multi-team matches.
- **Advanced Front Office**: Drafts, trading, and contract mechanics for player bots.
- **Community & Social**: Rooting for teams, replay commenting, and public/private logic toggles.

---
*Note: This roadmap is a living document and is subject to change as the project evolves.*
