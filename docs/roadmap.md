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

## Current Status

**Foundational Architecture Established:**

- **Simulation Engine**: Core deterministic Deno simulation engine (`packages/engine`).
- **Phase 1 (DX Focus)**: Hybrid IDE architecture (Monaco/CodeMirror), browser-side simulation, and advanced playback controls.
- **Phase 2 (League Dashboard)**: Foundational UI for "The Big Board", team identity, and live event ticking.
- **Phase 3 (Inaugural Season)**: Full season simulation infrastructure complete.
  - **Protocol Versioning Engine**: Decoupled engine from rule-sets with a registry pattern.
  - **Automated Season Runner**: `Deno.cron` ready runner for scheduled matches.
  - **Code-Locked Determinism**: Database-backed version control for team logic ensuring perfect replays.
  - **Inaugural Bootstrap**: 6 varied team logic variations (Azure, Beige, Cobalt, etc.) seeded with a full round-robin schedule.
- **Phase 4 (Inaugural Dashboard)**: Live Command Center and deterministic match viewer complete.
  - **Live Standings & Feed**: Real-time integration with Supabase matches and teams.
  - **Diverse Identity**: Implementation of the Amber, Beige, Crimson, Denim, Emerald, Fuchsia (ABCDEF) color palette.
  - **Replay Determinism**: Browser-side re-simulation using database seeds and code versions.
  - **Publishing Workflow**: Integrated scratchpad with versioned database persistence.

### Phase 4.5: UX Polish & Performance

_The goal is to refine the "vibe" and performance of the platform before locking down the architecture with Auth._

- [x] **Establish the Deep Polish Punchlist**: Compile and prioritize the specific UI/UX tweaks, micro-animations, and performance optimizations required for a production-ready feel.
- [x] **Protocol V1 Stabilization**: Resolved critical "ghost match" bugs (empty configs and bot API mismatches) and balanced point zone lifespans for better gameplay.
- [x] **Dynamic Match Library**: Replaced static JSON replays with a live database-backed Match Library in the Film Room.

---

## Upcoming Phases

### Phase 5: League & Team Operations

_The goal is to build out the UI tooling necessary for League Administration, Team Practice, and Fan Viewing, establishing the core gameplay loop before locking it behind auth._
o

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


### Phase 7: The Protocol RFC Process & Reputation

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
- **5D Multi-Timeline Film Room UI**: Overhaul the Film Room playback controls to support simultaneous exploration of multiple "what-if" timelines. Include vertically stacked scrubbers, visibility checkboxes (ghosting) for parallel logic comparison, and synchronized playback across branches.
- **Automated Hub Scraper**: Implementing targeted scraping for highly trusted profiles (e.g., reliable Twitter feeds or YouTube channels) to automatically curate content for the "Around the League" hub.

---

_Note: This roadmap is a living document and is subject to change as the project evolves._
