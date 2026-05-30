# Maintainer One Roadmap

This document outlines the high-level roadmap and upcoming phases for the
Maintainer One platform. The project is evolving from a single-player logic IDE
into a fully realized, multi-tier ecosystem built around role-based interactions,
automated league simulations, and community-driven protocols.

---

## The Vision: Platform, Governance, and Play

Maintainer One is open-source software that anyone can run. The platform and the
official instance that runs on it are deliberately separate concerns.

### Platform Level

The **platform** is the open-source software itself — the engine, the SvelteKit
UI, the simulation infrastructure, the CLI tools, and the protocol packages.

- **Platform Maintainer**: Maintains the software. Has no inherent in-game
  authority on any instance. On the official instance the platform maintainer
  and the governing body happen to be the same person, but they wear different
  hats. This distinction matters as the project grows — a future contributor
  could hold League Authority without touching the codebase, or the platform
  could eventually be stewarded by a broader group while the governing body
  remains with the original founder.

_Note: Anyone can run their own instance, acting as both platform deployer and
governing body for their own community._

### Instance Level

Every instance (official or private) has its own governance structure. Roles
are additive — users can hold multiple roles simultaneously, with each unlocking
deeper levels of access.

- **Governing Body** (e.g. the Maintainer Authority): The top governance tier
  for an instance. Owns and evolves one or more named Protocols. Sanctions
  leagues that run on specific protocol versions. Manages the instance-level
  event and lore pipeline. Runs the protocol RFC process. On the official
  instance this is the Maintainer Authority.

- **League Authority**: Acts as the "Commissioner" of a specific sanctioned
  league. Responsible for schedule generation, season config, day-to-day league
  operations, and the league-level event pipeline. A governing body may sanction
  multiple leagues running on different versions of the same protocol (e.g.
  Maintainer One on the latest version, Maintainer Two on an earlier version).

- **Team Maintainer**: A highly exclusive role within official leagues.
  Responsible for a team's roster logic, making deployment decisions, and
  managing team identity. Team Maintainers do not manually control bots or
  approve decisions in the moment — they build the automated systems that make
  those decisions.

- **Contributor**: An engaged community member who produces artifacts.
  Contributors analyze matches, write articles, propose logic updates to Team
  Maintainers, and submit event ideas to the lore pipeline.

- **Fan**: The broadest tier and the majority of the eventual audience. Fans
  watch games, root for teams, vote on lore events, and participate in
  prediction mechanics. A Fan has a named place in the world and a real
  relationship with the league without being expected to produce artifacts.

### Protocol Structure

A **Protocol** is a named, versioned ruleset owned by a governing body. Multiple
protocols can coexist under one governing body, each evolving independently on
its own versioning cadence. Multiple leagues can run on different versions of the
same protocol simultaneously.

On the official instance:

```
Maintainer Authority (governing body)
├── Maintainer Protocol (V1 → V2 → ... per protocol roadmap)
│   ├── Maintainer One (top tier, runs on latest version)
│   └── Maintainer Two (secondary tier, runs on earlier version)
└── Maintainer AI Protocol (separate named protocol, own versioning)
    └── (AI-focused league, distinct from human-authored logic leagues)
```

Private instances can define their own governing bodies, their own named
protocols, and their own league structures without any relationship to the
official instance hierarchy.

### The Testing Mandate (Core Pillar)

- **Regression Safety**: All core simulation and protocol logic is covered by a
  "Headache-Free" testing suite using `deno test`.
- **Continuous Integration**: Automated CI via GitHub Actions ensures no push
  breaks the engine or protocol determinism.
- **TDD Requirement**: All future protocol changes and engine features _must_ be
  accompanied by relevant test cases to maintain the project's long-term health.

---

## Completed Milestones

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

- [x] **Simulation Engine**: Core deterministic Deno simulation engine
  (`packages/engine`).
- [x] **Protocol Versioning Engine**: Decoupled engine from rule-sets with a
  registry pattern.
- [x] **Automated Season Runner**: `Deno.cron` ready runner for scheduled
  matches.
- [x] **Code-Locked Determinism**: Database-backed version control for team
  logic ensuring perfect replays.
- [x] **Test Bootstrap**: 6 varied team logic variations seeded with a full
  round-robin schedule.

### Phase 4: Test Dashboard

- [x] **Live Command Center**: Dashboard surface for following the active
  league.
- [x] **Live Standings & Feed**: Real-time integration with Supabase matches and
  teams.
- [x] **Diverse Identity**: Implementation of the Amber, Beige, Crimson, Denim,
  Emerald, Fuchsia (ABCDEF) color palette.
- [x] **Replay Determinism**: Browser-side re-simulation using database seeds
  and code versions.
- [x] **Publishing Workflow**: Integrated scratchpad with versioned database
  persistence.

### Phase 4.5: UX Polish & Performance

- [x] **Establish the Deep Polish Punchlist**: Compile and prioritize the
  specific UI/UX tweaks, micro-animations, and performance optimizations
  required for a production-ready feel.
- [x] **Protocol V1 Stabilization**: Resolved critical "ghost match" bugs (empty
  configs and bot API mismatches) and balanced point zone lifespans for better
  gameplay.
- [x] **Dynamic Match Library**: Replaced static JSON replays with a live
  database-backed Match Library in the Film Room.

### Phase 5: League & Team Operations

- [x] **League Administration**: A `/admin/league` dashboard for creating
  seasons, generating schedules, and managing simulation triggers.
- [x] **Team Dashboard**: A `/team` dashboard for teams to manage their code
  versions (including naming versions) and assign specific override versions for
  upcoming matchups.
- [x] **Team Practice & Test Runner**: A `/team/test-runner` environment
  allowing developers to run large batches of headless simulations against
  opponents to evaluate logic changes based on statistical outcomes.
- [x] **Match Viewing & Analytics**: A dedicated `/match/[id]` viewing
  experience enriched with advanced analytics (Control Maps, Expected Spawns
  (xS), and Luck metrics) distinct from the developer-focused Film Room.
- [x] **Protocol V1 Scoring Update**: Update the V1 protocol to award points for
  the highest and lowest of each stat. Points structure: Wins = 3, Draws = 1,
  Most/Least of each stat = 1, Losses = 0.
- [x] **Game Lore**: Establish the foundational lore and narrative for the game.

### Phase 6: GitHub Auth & The Contributor Ecosystem

- [x] **GitHub Authentication**: Utilize GitHub OAuth as the primary
  authentication method.
- [x] **Cohesive Permission System**: Implement the role-based access control
  (RBAC) system to naturally gate Team Management and League settings UI behind
  appropriate permissions.
- [x] **"Around the League" Hub**: A dedicated dashboard space to curate and
  aggregate community content.

---

## Active and Upcoming Phases

### Phase 7: Pre-Alpha Polish & Deployment

- [x] **Landing Page Overhaul**: Clean up the main landing page and align its
  aesthetic and messaging with the project's vision.
- [ ] **Documentation Site**: Implement the alpha-critical docs: game manual,
  quickstart, and V1 protocol reference.
- [ ] **Robust Match Scheduling**: Overhaul the scheduling logic to support the
  "Saturday Broadcast Format":
  - **Game Days**: Schedule full round-robin series specifically on Saturdays.
  - **Round-Based Staggering**: Either run all matches in a round simultaneously
    or stagger them by ~5 minutes.
  - **Live-Coding Intermissions**: Schedule 15-30 minute gaps between rounds for
    on-stream logic patching and deployment.
  - **Multi-Week Seasons**: Support 1-month seasons containing 4-5 weekly series
    (20-25 total games per team).
- [ ] **Developer Experience Polish**: Iron out bugs in the team logic editor
  and ensure writing, saving, and testing team scripts is smooth and pleasant.
- [ ] **Deployment Preparation**: Set up production hosting, configure
  environment variables, and ensure the build process is stable.
- [ ] **UI/UX Final Polish**: Review layouts across device sizes and ensure all
  visual components match the design system.
- [ ] **Security & Data Audit**: Verify RLS policies, session handling, and
  database integrity for a live environment.
- [ ] **Alpha Access Control**: Implement a whitelist or "Alpha Key" system to
  restrict signups and official deployments, while keeping the dashboard public
  for viewing and scratchpad experimentation.
- [x] **5D Multi-Timeline Film Room UI**: Overhaul the Film Room playback
  controls to support simultaneous exploration of multiple "what-if" timelines.

**Stretch Goals**

- [ ] **Dev Blog**: Set up a blog system on the landing site.
- [ ] **Mobile Experience Polish**: Optimize dashboards and match viewing for
  small screens.
- [ ] **Authentic Voice Pass**: Review and rewrite all site copy and
  documentation.
- [ ] **Streamer Prep & Practice**: Design OBS-friendly UI overlays and run
  low-stakes "Summer Dev Streams."
- [ ] **Alpha World Memory Seed**: Add the minimum season and match history
  surfaces needed for the first alpha league to feel persistent.
- [ ] **BRAND.md**: Add a brand usage guidelines document to the repo
  establishing that the software is free to use but "Maintainer One" and
  associated marks refer specifically to the official instance. Low effort,
  sets clear expectations before the project is public.

### Phase 8: Post-Alpha Stabilization & V1 Stewardship

- [ ] **Alpha Season Operations**: Run V1 seasons on a predictable cadence.
- [ ] **V1 Rules Finalization**: Treat V1 as the onboarding/literacy protocol
  and avoid expanding the sport until its current mechanics are well documented.
- [ ] **Replay & Audit Hardening**: Ensure every official V1 match can be
  replayed from locked inputs.
- [ ] **Security & Permissions Pass**: Finish practical alpha security work.
- [ ] **Team Logic DX Polish**: Improve the code editing, saving, testing, and
  versioning loop.
- [ ] **Operational Runbooks**: Document how to create seasons, seed teams,
  recover from failed simulations, deploy the app, and verify official results.
- [ ] **World Memory Pass**: Strengthen the spectator layer with season history,
  team pages, and match artifacts.
- [ ] **Lightweight Community Process**: Use Discord, GitHub issues, and informal
  discussion for feedback until formal governance is warranted.
- [ ] **Instance Brand Config**: Move all hardcoded official names (governing
  body name, protocol names, league names, team names) out of the codebase and
  into instance setup config. Private instances should naturally establish their
  own identity during setup rather than inheriting official names by default.
  This is both an architectural improvement and the practical foundation for
  brand protection.
- [ ] **Instance Attribution Standard**: Implement an unobtrusive "Powered by
  Maintainer One" link in the platform UI pointing to the official repo. Present
  by default, removable for instances that want a fully clean identity. Add an
  orientation moment during first-time instance setup that acknowledges the
  official instance and repo without being a gate.

### Phase 9: Capture the Zone Protocol Expansion

_See `docs/protocol-roadmap.md` for full protocol design details._

- [ ] **Protocol Roadmap Review**: Use `docs/protocol-roadmap.md` as the working
  design map for protocol sequencing and open questions.
- [ ] **V2 Formation & Commitment**
- [ ] **V3 Bot Variability & Upgrade Draft**
- [ ] **Immutable Team State Snapshots**
- [ ] **General Event/Phase Model**
- [ ] **V4 Wear & Basic Recovery**
- [ ] **V5 Roster Depth & Chassis Draft**
- [ ] **V6 Automated Trading**
- [ ] **V7 Scouting & Imperfect Information**
- [ ] **Phase Artifact Standard**

### Phase 10: Governance, RFC Process & Reputation

- [ ] **Governing Body Infrastructure**: Implement the formal separation between
  platform maintainer and governing body roles. Ensure the RBAC system reflects
  the full hierarchy: governing body → league authority → team maintainer →
  contributor.
- [ ] **Multi-Protocol Support**: Ensure the platform can host multiple named
  protocols under one governing body, each with independent versioning and their
  own sanctioned leagues.
- [ ] **TC39-Style Protocol RFCs**: Formalize the lifecycle for protocol and rule
  changes (Stage 0: Strawperson → Stage 4: Finished). The RFC process lives at
  the governing body level so different governing bodies can evolve their
  protocols independently.
- [ ] **Algorithm-Assisted Reputation**: Implement a reputation system for
  Contributors built through successful logic deployments and positive community
  interactions.
- [ ] **Discussion Boards**: Integrated community forums for fleshing out ideas,
  analyzing games, and debating RFCs.
- [ ] **Scratchpad Management Screen**: A dedicated UI to manage, rename, and
  purge team-specific scratchpad logic drafts.

---

## Long-Term Vision

- **In-House Version Control**: Build a robust, custom, git-compatible version
  control system directly into the platform for managing team logic and protocol
  development. (Big Audacious Goal — defer until there is clear demand.)
- **Tick-by-Tick Event Tracking**: A dedicated `match_events` database schema to
  capture granular simulation events with their exact tick and positional data.
- **Tiered Official Leagues**: Expanding beyond Maintainer One to lower-tier
  official leagues (Maintainer Two, etc.) as popularity demands.
- **Fan Predictions**: A gamified fan experience featuring outcome prediction
  mechanics and global leaderboards.
- **Lore System**: Community-authored narrative events with mechanical
  consequences. Explicitly the last subsystem introduced. See
  `docs/lore-system.md` for full design.
- **Maintainer AI Format**: A distinct league format for AI-assisted or
  AI-agent teams, kept deliberately separate from human-authored logic leagues
  to preserve the integrity of both.
- **Optional Instance Directory**: A public registry where instances can
  optionally list themselves, creating a visible network of communities without
  requiring any dependency. Private instances that want to stay private simply
  don't register. Creates organic awareness of the broader ecosystem.
- **Cross-Instance Identity**: A future where contributor reputation, lore
  submissions, and team maintainer history are all attached to a user's GitHub
  identity and visible across instances. The shared GitHub auth layer is already
  the foundation for this — it would make the project's open-source soul
  tangible in the user experience.

---

_Note: This roadmap is a living document and is subject to change as the project
evolves._