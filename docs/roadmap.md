# Maintainer One Roadmap

This document outlines the high-level roadmap and upcoming phases for the Maintainer One platform. The project is evolving from a single-player logic IDE into a fully realized, multi-tier ecosystem built around role-based interactions, automated league simulations, and community-driven protocols.

## The Vision: A Cohesive Role-Based Ecosystem

The platform is driven by a unified permission system where roles are additive. Users can hold multiple roles simultaneously, with each unlocking deeper levels of access:

- **Project Maintainer**: Top-level oversight of the platform infrastructure and project direction.
- **League Maintainer**: Acts as the "Commissioner" of a specific league. Responsible for schedule generation, finalizing protocol changes, and overseeing league operations. 
- **Team Maintainer**: A highly exclusive role within official leagues. Responsible for a team's roster logic, making deployment decisions, and managing team identity.
- **Contributor**: The foundation of the community. Contributors participate by watching games, analyzing matches, writing articles, and proposing logic updates to Team Maintainers. 

*Note: The platform is open-source. Anyone can spin up their own server to act as a Project/League maintainer for their own custom instance.*

## Current Status

**Foundational Architecture Established:**
- **Simulation Engine**: Core deterministic Deno simulation engine (`packages/engine`).
- **Phase 1 (DX Focus)**: Hybrid IDE architecture (Monaco/CodeMirror), browser-side simulation, and advanced playback controls.
- **Phase 2 (League Dashboard)**: Foundational UI for "The Big Board", team identity, and live event ticking. This UI forms the base for our upcoming permission-driven interfaces.

---

## Upcoming Phases

### Phase 3: The Inaugural Season (Scheduling & Simulation MVP)
*The primary goal is to see a full season play out automatically, providing the baseline for future development.*

- [ ] **Protocol Versioning Engine**: Establish the foundational architecture where a League runs under a specific Protocol Version that dictates rules, schedule constraints, and player structure.
- [ ] **Automated Season Runner (Cron Job)**: Implement a backend simulation runner deployed on Deno Deploy. 
    - Games are simulated in batch (e.g., in the morning) but are locked on the frontend until their scheduled "premiere" time.
    - Viewers watch the premiere "live", with skip-ahead disabled to preserve the suspense of the match.
- [ ] **Inaugural Bootstrap**: Provide the necessary tooling for a single user to act as League Maintainer and Team Maintainer for all 6 inaugural teams to test the season loop.

### Phase 4: GitHub Auth & The Contributor Ecosystem
*The goal is to seamlessly integrate the community and establish the formal RBAC foundation.*

- [ ] **GitHub Authentication**: Utilize GitHub OAuth as the primary authentication method. This natively links Contributors' identities to their code repositories and PRs.
- [ ] **Cohesive Permission System**: Implement the role-based access control (RBAC) system to naturally gate Team Management and League settings UI behind appropriate permissions.
- [ ] **"Around the League" Hub**: A dedicated dashboard space to curate and aggregate community content. 
    - Initially powered by user submissions.
    - Implementing targeted scraping for highly trusted profiles (e.g., reliable Twitter feeds or YouTube channels).

### Phase 5: The Protocol RFC Process & Reputation
*The goal is to formalize how the game evolves and how trust is built.*

- [ ] **TC39-Style Protocol RFCs**: Formalize the lifecycle for protocol and rule changes, modeled robustly on the TC39 process (Stage 0: Strawperson → Stage 4: Finished).
- [ ] **Algorithm-Assisted Reputation**: Implement a reputation system for Contributors. Trust is built through successful logic deployments adopted by teams and positive community interactions (helpful comments).
- [ ] **Discussion Boards**: Integrated community forums for fleshing out ideas, analyzing games, and debating RFCs.

## Long-Term Vision

- **In-House Version Control**: The "Big Audacious Goal" is to build a robust, custom, git-compatible version control system directly into the platform for managing team logic and protocol development.
- **Tiered Official Leagues**: Expanding beyond "Maintainer One" to lower-tier official leagues (e.g., Maintainer Two) as popularity demands, making top-tier team maintenance a prestigious achievement.
- **Fan Predictions**: A gamified fan experience featuring outcome prediction mechanics and global leaderboards to keep viewers engaged with "premiering" matches.

---
*Note: This roadmap is a living document and is subject to change as the project evolves.*
