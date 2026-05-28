# Maintainer One Roadmap

This document outlines the high-level roadmap and upcoming phases for the Maintainer One platform. The project is evolving from a single-player logic IDE into a fully realized, multi-tier ecosystem built around role-based interactions, automated league simulations, and community-driven protocols.

## The Vision: A Cohesive Role-Based Ecosystem

The platform is driven by a unified permission system where roles are additive. Users can hold multiple roles simultaneously, with each unlocking deeper levels of access:

- **Project Maintainer**: Top-level oversight of the platform infrastructure and project direction.
- **League Maintainer**: Acts as the "Commissioner" of a specific league. Responsible for schedule generation, finalizing protocol changes, and overseeing league operations.
- **Team Maintainer**: A highly exclusive role within official leagues. Responsible for a team's roster logic, making deployment decisions, and managing team identity.
- **Contributor**: The foundation of the community. Contributors participate by watching games, analyzing matches, writing articles, and proposing logic updates to Team Maintainers.

_Note: The platform is open-source. Anyone can spin up their own server to act as a Project/League maintainer for their own custom instance._

**The Testing Mandate (Core Pillar):**

- **Regression Safety**: All core simulation and protocol logic is covered by a "Headache-Free" testing suite using `deno test`.
- **Continuous Integration**: Automated CI via GitHub Actions ensures no push breaks the engine or protocol determinism.
- **TDD Requirement**: All future protocol changes and engine features _must_ be accompanied by relevant test cases to maintain the project's long-term health.

## Completed Milestones

These phases describe the foundation already in place. They are kept here for
project memory and context, while incomplete work lives in the upcoming phases
below.

### Phase 1: DX Foundation

- [x] **Hybrid IDE Architecture**: Monaco/CodeMirror-style editing for team
  logic development.
- [x] **Browser-Side Simulation**: Local simulation loop for rapid feedback.
- [x] **Advanced Playback Controls**: Replay controls for inspecting match
  outcomes and iterating on logic.

### Phase 2: League Dashboard

- [x] **The Big Board**: Foundational dashboard surfaces for league state.
- [x] **Team Identity**: Team branding, logos, colors, and broadcast-style
  presentation.
- [x] **Live Event Ticking**: UI foundation for following league activity as it
  unfolds.

### Phase 3: Test Season Infrastructure

- [x] **Simulation Engine**: Core deterministic Deno simulation engine (`packages/engine`).
- [x] **Protocol Versioning Engine**: Decoupled engine from rule-sets with a registry pattern.
- [x] **Automated Season Runner**: `Deno.cron` ready runner for scheduled matches.
- [x] **Code-Locked Determinism**: Database-backed version control for team logic ensuring perfect replays.
- [x] **Test Bootstrap**: 6 varied team logic variations seeded with a full round-robin schedule.

### Phase 4: Test Dashboard

- [x] **Live Command Center**: Dashboard surface for following the active league.
- [x] **Live Standings & Feed**: Real-time integration with Supabase matches and teams.
- [x] **Diverse Identity**: Implementation of the Amber, Beige, Crimson, Denim, Emerald, Fuchsia (ABCDEF) color palette.
- [x] **Replay Determinism**: Browser-side re-simulation using database seeds and code versions.
- [x] **Publishing Workflow**: Integrated scratchpad with versioned database persistence.

### Phase 4.5: UX Polish & Performance

_The goal is to refine the "vibe" and performance of the platform before locking down the architecture with Auth._

- [x] **Establish the Deep Polish Punchlist**: Compile and prioritize the specific UI/UX tweaks, micro-animations, and performance optimizations required for a production-ready feel.
- [x] **Protocol V1 Stabilization**: Resolved critical "ghost match" bugs (empty configs and bot API mismatches) and balanced point zone lifespans for better gameplay.
- [x] **Dynamic Match Library**: Replaced static JSON replays with a live database-backed Match Library in the Film Room.

### Phase 5: League & Team Operations

_The goal is to build out the UI tooling necessary for League Administration, Team Practice, and Fan Viewing, establishing the core gameplay loop before locking it behind auth._

- [x] **League Administration**: A `/admin/league` dashboard for creating seasons, generating schedules, and managing simulation triggers.
- [x] **Team Dashboard**: A `/team` dashboard for teams to manage their code versions (including naming versions) and assign specific override versions for upcoming matchups.
- [x] **Team Practice & Test Runner**: A `/team/test-runner` environment allowing developers to run large batches of headless simulations against opponents to evaluate logic changes based on statistical outcomes.
- [x] **Match Viewing & Analytics**: A dedicated `/match/[id]` viewing experience enriched with advanced analytics (Control Maps, Expected Spawns (xS), and Luck metrics) distinct from the developer-focused Film Room.

- [x] **Protocol V1 Scoring Update**: Update the V1 protocol to award points for the highest and lowest of each stat (e.g., the player most stunned and the player least stunned each earn their team a point). Points structure: Wins = 3, Draws = 1, Most/Least of each stat = 1, Losses = 0.
- [x] **Game Lore**: Establish the foundational lore and narrative for the game.

### Phase 6: GitHub Auth & The Contributor Ecosystem

_The goal is to seamlessly integrate the community and establish the formal RBAC foundation._

- [x] **GitHub Authentication**: Utilize GitHub OAuth as the primary authentication method. This natively links Contributors' identities to their code repositories and PRs.
- [x] **Cohesive Permission System**: Implement the role-based access control (RBAC) system to naturally gate Team Management and League settings UI behind appropriate permissions.
- [x] **"Around the League" Hub**: A dedicated dashboard space to curate and aggregate community content.
  - Initially powered by user submissions.

---

## Active and Upcoming Phases

### Phase 7: Pre-Alpha Polish & Deployment

_The goal is to finalize all critical paths, squash lingering bugs, and successfully deploy the alpha version of the game._

- [x] **Landing Page Overhaul**: Clean up the main landing page (`apps/landing`) and align its aesthetic and messaging with the project's vision.
- [ ] **Documentation Site**: Implement the alpha-critical docs: game manual, quickstart, and V1 protocol reference.
- [ ] **Robust Match Scheduling**: Overhaul the scheduling logic to support the "Saturday Broadcast Format":
  - **Game Days**: Schedule full round-robin series specifically on Saturdays.
  - **Round-Based Staggering**: Either run all matches in a round simultaneously (to highlight Multiview) or stagger them by ~5 minutes.
  - **Live-Coding Intermissions**: Schedule 15-30 minute gaps *between rounds* for on-stream logic patching and deployment.
  - **Multi-Week Seasons**: Support 1-month seasons containing 4-5 weekly series (20-25 total games per team).
- [ ] **Developer Experience Polish**: Iron out bugs in the team logic editor and ensure writing, saving, and testing team scripts is a smooth and pleasant experience for contributors.
- [ ] **Deployment Preparation**: Set up production hosting, configure environment variables, and ensure the build process is stable.
- [ ] **UI/UX Final Polish**: Review layouts across device sizes and ensure all visual components match the design system.
- [ ] **Security & Data Audit**: Verify RLS policies, session handling, and database integrity for a live environment.
- [ ] **Alpha Access Control**: Implement a whitelist or "Alpha Key" system to restrict signups and official deployments, while keeping the dashboard public for viewing and scratchpad experimentation.
- [x] **5D Multi-Timeline Film Room UI**: Overhaul the Film Room playback controls to support simultaneous exploration of multiple "what-if" timelines. Include vertically stacked scrubbers, visibility checkboxes (ghosting) for parallel logic comparison, and synchronized playback across branches.

**Stretch Goals**

- [ ] **Dev Blog**: Set up a blog system on the landing site to post updates, patch notes, and stream recaps.
- [ ] **Mobile Experience Polish**: Optimize dashboards and match viewing for small screens. Treat the team logic editor as desktop-first for alpha unless a clear mobile workflow emerges.
- [ ] **Authentic Voice Pass**: Review and rewrite all site copy, documentation, and blog placeholders to ensure they sound like a human creator rather than a marketing team or an AI.
- [ ] **Streamer Prep & Practice**: Design OBS-friendly UI overlays and run low-stakes "Summer Dev Streams" to practice the broadcast flow before the official September launch.
- [ ] **Alpha World Memory Seed**: Add the minimum season and match history surfaces needed for the first alpha league to feel persistent rather than demo-only.

### Phase 8: Post-Alpha Stabilization & V1 Stewardship

_The goal is to run the V1 alpha long enough to prove the core loop, harden the platform, and let the first official league feel stable before expanding the protocol surface area._

- [ ] **Alpha Season Operations**: Run V1 seasons on a predictable cadence and use them to validate scheduling, match locking, replay determinism, and standings integrity.
- [ ] **V1 Rules Finalization**: Treat V1 as the onboarding/literacy protocol and avoid expanding the sport until its current mechanics are clear, stable, and well documented.
- [ ] **Replay & Audit Hardening**: Ensure every official V1 match can be replayed from locked inputs: protocol version, protocol config, seed, and team code versions.
- [ ] **Security & Permissions Pass**: Finish the practical alpha security work: RLS policies, auth/session behavior, admin boundaries, and safe public/private data exposure.
- [ ] **Team Logic DX Polish**: Improve the code editing, saving, testing, and versioning loop. Explore support for multiple files or cleaner local organization before deeper GitHub/in-house version-control work.
- [ ] **Operational Runbooks**: Document how to create seasons, seed teams, recover from failed simulations, deploy the app, and verify official results.
- [ ] **World Memory Pass**: Strengthen the spectator/solo-sim layer with season history, team pages, player histories, match artifacts, and "what happened since last time" style surfaces.
- [ ] **Lightweight Community Process**: Use Discord, GitHub issues, and informal discussion for feedback until there are enough active participants to justify formal governance.

### Phase 9: Capture the Zone Protocol Expansion

_The goal is to evolve the V1 sport gradually through the Capture the Zone era, introducing each major team-logic surface at a base level before any one surface becomes too complex._

- [ ] **Protocol Roadmap Review**: Use `docs/protocol-roadmap.md` as the working design map for protocol sequencing, open questions, and future phase candidates.
- [ ] **V2 Formation & Commitment**: Explore a closest-players scoring multiplier where zone value depends on how many friendly bots are closer than the opponent.
- [ ] **V3 Bot Variability & Upgrade Draft**: Introduce bot traits/components and the first automated draft-like phase, likely starting with upgrade components before full chassis drafts.
- [ ] **Immutable Team State Snapshots**: Before mutable rosters/components affect official events, add immutable team-state snapshots so official replays lock both team logic and team condition.
- [ ] **General Event/Phase Model**: Begin moving beyond match-only terminology. Drafts, matches, recovery phases, trade windows, scouting phases, and prep phases should all be modeled as replayable official events that consume input snapshots and produce output snapshots.
- [ ] **V4 Wear & Basic Recovery**: Introduce wear as a reliability tax and add a small automated recovery phase where teams allocate limited repair resources.
- [ ] **V5 Roster Depth & Chassis Draft**: Expand teams beyond active match bots and introduce automated roster selection, backups, rotations, and fuller chassis acquisition.
- [ ] **V6 Automated Trading**: Add trade windows where team logic proposes, evaluates, counters, and accepts trades without manual maintainer approval.
- [ ] **V7 Scouting & Imperfect Information**: Add scouting phases and uncertain reports so draft, trade, and prep logic can reason about incomplete information.
- [ ] **Phase Artifact Standard**: For every new official event type, define the artifacts needed for replay, analysis, branching, auditing, and world memory.

### Phase 10: The Protocol RFC Process & Reputation

_The goal is to formalize how the game evolves and how trust is built._

- [ ] **TC39-Style Protocol RFCs**: Formalize the lifecycle for protocol and rule changes, modeled robustly on the TC39 process (Stage 0: Strawperson → Stage 4: Finished).
- [ ] **Algorithm-Assisted Reputation**: Implement a reputation system for Contributors. Trust is built through successful logic deployments adopted by teams and positive community interactions (helpful comments).
- [ ] **Discussion Boards**: Integrated community forums for fleshing out ideas, analyzing games, and debating RFCs.
- [ ] **Scratchpad Management Screen**: A dedicated UI to manage, rename, and purge (e.g., older than X days) team-specific scratchpad logic drafts.

## Long-Term Vision

- **In-House Version Control**: The "Big Audacious Goal" is to build a robust, custom, git-compatible version control system directly into the platform for managing team logic and protocol development.
- **Tick-by-Tick Event Tracking**: Create a dedicated `match_events` database schema to capture granular simulation events (e.g., stuns, captures) with their exact tick and positional data, enabling advanced analytics and scrubber functionality in the Film Room.
- **Tiered Official Leagues**: Expanding beyond "Maintainer One" to lower-tier official leagues (e.g., Maintainer Two) as popularity demands, making top-tier team maintenance a prestigious achievement.
- **Fan Predictions**: A gamified fan experience featuring outcome prediction mechanics and global leaderboards to keep viewers engaged with "premiering" matches.
- **Automated Hub Scraper**: Implementing targeted scraping for highly trusted profiles (e.g., reliable Twitter feeds or YouTube channels) to automatically curate content for the "Around the League" hub.

---

_Note: This roadmap is a living document and is subject to change as the project evolves._
