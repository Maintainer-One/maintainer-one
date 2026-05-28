# Maintainer One Protocol Roadmap

This document tracks the long-term evolution of Maintainer One protocols. It is
intended to sit beside the development roadmap: `docs/roadmap.md` tracks product
and platform implementation, while this file tracks game-design progression,
protocol eras, and open questions.

Nothing here should be treated as locked until it graduates through the future
Protocol RFC process. The goal is to preserve promising design threads early so
they can be tested, refined, split, merged, or discarded with intent.

## At-a-Glance Phase Ladder

This section is the short map. The detailed version notes below can change, but
the broad goal is to introduce each major team-logic domain at a base level
before any one domain becomes too complex.

| Domain | First candidate | Base-level question | Example team-logic entrypoint |
| --- | --- | --- | --- |
| Match play | V1 | How should bots move, avoid collisions, and capture zones? | `play(context)` |
| Formation/commitment | V2 | How many bots should commit to a scoring opportunity? | `play(context)` |
| Upgrade draft | V3 | Which available components best fit the team's current system? | `draft(context)` |
| Bot variability | V3 | How should strategy adapt to different bot traits? | `play(context)` / `draft(context)` |
| Recovery/maintenance | V4 | Where should limited repair resources be spent? | `recover(context)` |
| Roster depth | V5 | Which bots should be active, rested, upgraded, or saved? | `selectRoster(context)` |
| Chassis draft | V5 | Which new bots should enter the organization? | `draft(context)` |
| Trading | V6 | Which asset exchanges improve the team in context? | `trade(context)` |
| Scouting | V7 | What information is worth spending resources to learn? | `scout(context)` |
| Game prep | TBD | What should the team optimize before a specific matchup? | `prepare(context)` |
| Staff/systems | TBD | Which organizational systems should be acquired or deployed? | `manageStaff(context)` |
| Deployment/versioning | TBD | Which logic version should run in each upcoming phase? | `deploy(context)` |

## Major Team-Logic Surfaces

The long-term game should eventually ask maintainers to automate the entire
organization, not just game-day bot movement. These are the main surfaces to
introduce carefully.

- **Match logic**: Bot actions during games.
- **Draft logic**: Evaluation and selection of components, chassis, or systems.
- **Recovery logic**: Allocation of repair or maintenance resources after wear,
  faults, or reliability loss.
- **Roster logic**: Selection of active bots, backups, rotations, and rest.
- **Trade logic**: Automated proposal, evaluation, countering, and acceptance of
  asset exchanges.
- **Scouting logic**: Resource allocation for reducing uncertainty about draft
  pools, opponents, hidden traits, or market conditions.
- **Prep logic**: Matchup-specific training, planning, or tactical setup before
  games.
- **Staff/system logic**: Acquisition, deployment, and replacement of coaching,
  scouting, maintenance, analytics, research, or management systems.
- **Deployment logic**: Choosing which team-code versions or strategic packages
  run in specific phases.

## Protocol Design Principles

- **One new lesson at a time**: Each protocol should introduce a new kind of
  judgment without overwhelming the existing mental model.
- **Automation first**: Team maintainers write systems that make decisions.
  Game-day, draft, recovery, trading, scouting, and deployment decisions should
  be automated by team logic rather than manually approved.
- **No premature helpers**: When a concept is first introduced, teams should
  solve it directly. Convenience abstractions can appear in later protocols after
  the problem is no longer the primary lesson.
- **Replayable phases**: If a phase is important enough to exist, it should be
  worth replaying, inspecting, branching, testing, and explaining.
- **Immutable official inputs**: Official phase replays need to lock every input
  that can affect the result: protocol version, protocol config, seed, team code
  versions, and team state snapshots.
- **Artifacts create memory**: Every phase should produce durable artifacts that
  make the world feel alive: match events, scouting reports, draft decisions,
  recovery logs, trade offers, roster changes, and post-phase diagnostics.
- **Public first, private later**: Early protocols favor public logic for
  learning, local simulation, and collaboration. Private logic and official
  compute budgets may become top-league rules once secrecy itself creates
  compelling gameplay.
- **Protocol versions are a learning ladder**: Lower versions should remain
  useful as onboarding points, private league formats, and historical eras.

## Era 1: Capture the Zone

The first protocol era centers on spatial control, zone capture, deterministic
replays, and progressively richer team-building decisions. The goal is to keep
the core sport legible while slowly expanding from match tactics into automated
organization management.

### V1: Spatial Literacy

**Status**: Implemented baseline.

**Core lesson**: Learn to see the board.

**Primary concepts**

- 3v3 bot teams on a discrete grid.
- Deterministic movement and collision resolution.
- Point zones with age-based value.
- Manhattan distance, pathfinding, timing, and basic area control.
- Replay inspection and branch-based logic testing.

**Intent**

V1 is not the forever sport. It is the first literacy layer. It should remain
simple enough that new technical players can understand the full state space and
start writing useful logic without helper abstractions hiding the important
problems.

### V2: Commitment and Formation

**Status**: Candidate.

**Core lesson**: Balance local superiority against global coverage.

**Candidate mechanic**

- Zone score is multiplied by the number of friendly bots closer to the zone
  than the opposing team.

**Strategic pressure**

- Teams must decide whether to swarm, screen, split, bait, or abandon zones.
- Bunching bots can increase score but reduce area control and increase
  collision risk.
- Formation and commitment become more important without changing the basic
  roster model.

**Design note**

V2 should likely remain roster-symmetric so the scoring/formation problem can be
learned cleanly.

### V3: Bot Variability and Upgrade Draft

**Status**: Candidate.

**Core lesson**: Adapt strategy to non-uniform personnel.

**Candidate mechanics**

- Introduce bot components or chassis traits.
- Begin with a small number of trait axes, such as movement reliability, speed,
  durability, or sensing.
- Introduce the first automated draft-like phase, likely an upgrade draft before
  a full chassis draft.

**Lore direction**

Players are bots rather than humans. Protocol evolution can therefore introduce
new bot components, chassis capabilities, and system constraints without needing
human-sports realism to explain capability changes.

**Draft philosophy**

- Teams should know the schema and possible distributions, not exact draft
  lists far ahead of time.
- Draft logic should evaluate unknown or newly revealed options rather than
  hardcode a known board.

### V4: Wear and Basic Recovery

**Status**: Candidate.

**Core lesson**: Manage reliability, risk, and limited maintenance resources.

**Candidate mechanics**

- Bots accrue wear during matches from collisions, overuse, sprinting, contests,
  or other high-stress actions.
- Wear initially affects reliability rather than causing complex injuries.
  Example effects could include movement failure chance, delayed actions, sensor
  noise, or longer stun recovery.
- Recovery logic receives limited repair actions per phase and chooses where to
  reduce wear.

**Strategic pressure**

- Teams decide which bots can safely carry wear and which bots must be
  protected.
- Variability between bots makes repair allocation meaningful.
- Recovery becomes worthwhile once there is at least one limited resource and
  one delayed consequence.

**Possible phase entrypoint**

```ts
recover(context) -> RecoveryAction[]
```

### V5: Roster Depth and Chassis Draft

**Status**: Candidate.

**Core lesson**: Plan across a season instead of a single match.

**Candidate mechanics**

- Expand team size beyond active match bots.
- Introduce backups, rotations, and fuller chassis acquisition.
- Add a chassis draft or equivalent acquisition phase.
- Let wear, reliability, and role fit influence who plays and who sits.

**Strategic pressure**

- Team logic must evaluate role fit, long-term durability, and schedule context.
- Copied match logic becomes less portable because rosters differ.
- Season arcs begin to matter more than isolated match outcomes.

### V6: Automated Trading

**Status**: Candidate.

**Core lesson**: Value assets in context.

**Candidate mechanics**

- Introduce trade windows as scheduled phases.
- Team logic proposes, evaluates, counters, and accepts trades automatically.
- Tradable assets may include chassis, components, draft picks, upgrade slots,
  or future rights.

**Design constraint**

Maintainers do not manually approve trades. They write trade logic. A botched
trade should be a meaningful failure of the team's automated system, just like a
bad movement decision is a meaningful failure of match logic.

**Possible phase entrypoint**

```ts
trade(context) -> TradeAction[]
```

### V7: Scouting and Imperfect Information

**Status**: Candidate.

**Core lesson**: Make decisions under uncertainty.

**Candidate mechanics**

- Add scouting phases before drafts, trades, or key matches.
- Team logic can spend limited scouting resources to reveal or estimate hidden
  traits.
- Staff systems may affect report accuracy, coverage, and confidence.

**Strategic pressure**

- Teams decide what information is worth buying.
- Draft and trade logic become dependent on uncertain reports rather than
  perfect public data.
- The league gains more artifacts: reports, confidence intervals, missed reads,
  and post-hoc scouting grades.

## Future Era Candidates

These are broader directions that may become separate eras or alternate official
formats.

### Front Office Systems

Front office staff may be represented as bots, systems, modules, or services
with their own traits and tradeoffs rather than as human characters.

Possible system types:

- Coaching systems that affect game-day coordination or tactical discipline.
- Scouting systems that affect hidden information and draft evaluation.
- General manager systems that affect trade bandwidth or valuation.
- Maintenance systems that affect wear, reliability, diagnosis, and repair.
- Analytics systems that affect telemetry quality or simulation efficiency.
- Research systems that affect upgrade compatibility or protocol adaptation.

### Telemetry and Instrumentation

Teams may eventually choose what data to collect during matches and other
phases. Better telemetry can improve post-match analysis, scouting, and future
simulation, but may cost compute, bandwidth, phase actions, or system slots.

Design pressure:

- Teams should not be able to measure everything for free.
- Instrumentation choices should create artifacts that contributors can inspect.
- The best teams may win by building better feedback loops, not only better
  match logic.

### Training and Game Prep

Prep phases can give teams a limited opportunity to tune for a specific matchup
or improve a specific part of their system before a match.

Possible prep decisions:

- Prioritize coordination, reliability, zone timing, or collision avoidance.
- Spend limited prep resources on a single matchup or preserve them for later.
- Deploy matchup-specific strategy packages.

### Strategy Packages and Deployment

Teams may maintain multiple tactical packages or logic versions and write
deployment logic that chooses which package runs in a given phase or matchup.

Design pressure:

- Teams should be rewarded for robust adaptation rather than one brittle global
  strategy.
- Deployment choices should be auditable so official outcomes can be replayed
  from the exact code and strategy package that ran.

### Facilities and Infrastructure

Teams may eventually have limited facility or infrastructure slots that improve
specific phases.

Possible facilities:

- Simulator clusters.
- Repair bays.
- Scouting arrays.
- Analytics labs.
- Training rigs.
- Research workbenches.

Facilities can create long-term identity and specialization without requiring a
full economy too early.

### Component Compatibility

Components should eventually interact rather than simply add isolated stats. A
fast actuator might increase wear unless paired with a stabilizer. A sensor
suite might improve scouting but increase compute load.

Design pressure:

- Teams should build coherent systems rather than collect obvious best parts.
- Compatibility should make copied logic less portable between rosters.
- Component interactions should remain explainable through phase artifacts.

### Environment and Conditions

Later protocols may introduce match or phase conditions that reward resilient
logic.

Possible conditions:

- Sensor noise.
- Grid instability.
- Heat or energy pressure.
- Signal delay.
- Zone volatility.

These should be treated as protocol constraints, not random flavor. They are
useful when they create meaningful preparation, deployment, or roster decisions.

### Information Markets

If scouting and imperfect information become important, teams may eventually
trade, buy, sell, or publish information artifacts.

Design pressure:

- Information should have provenance and confidence.
- Teams should reason about what a report is worth.
- Public, private, misleading, or stale information can create strategy without
  requiring hidden code in every league format.

### Phase-Based League Simulation

Long-term seasons may be composed of scheduled phases with different tick
cadences, allowed actions, and team-logic entrypoints.

Example season shape:

```text
Preseason
  Scout Phase
  Draft Phase
  Training Phase
Round 1
  Prep Phase
  Match Phase
  Recovery Phase
  Trade Phase
Round 2
  Prep Phase
  Match Phase
  Recovery Phase
  Trade Phase
Postseason
  Prep Phase
  Match Phase
Offseason
  Upgrade Phase
  Staff Phase
```

### Maintainer AI

AI-enabled formats should be treated as distinct formats rather than silently
mixed into human-authored logic leagues.

Possible boundaries:

- AI-assisted coding behind the scenes.
- AI-generated submitted logic owned and reviewed by maintainers.
- AI agents used during non-match phases.
- Runtime AI agents making decisions under token, latency, cost, or memory
  budgets.

Maintainer One can preserve human-authored deterministic logic while a separate
Maintainer AI format explores runtime agents and human-plus-AI orchestration.

### Private Logic and Compute Budgets

Early protocols should favor public code and unlimited local simulation. Later
top-league formats may introduce private team logic and official simulation
budgets once the stakes justify the operational burden.

The wind-tunnel analogy:

- Public and historical logic can be simulated freely.
- Current private opponent logic, hidden seeds, or privileged scouting contexts
  may require official simulation windows.
- Compute limits create strategic choices about which matchups, prospects, or
  branches to evaluate.

## Open Questions

- When should the first non-match phase be introduced?
- Should wear be introduced before recovery actions, or should they arrive
  together?
- How much bot variability is enough for V3 without making V1/V2 literacy feel
  obsolete?
- What are the minimum useful artifacts for draft, recovery, trade, and scouting
  phases?
- Should official top-league protocols always remain public, or should private
  logic become a later official format?
- How should protocol versions remain playable for private leagues after the top
  league advances?
- What constraints make automated trading interesting without requiring a full
  economy too early?
- What should be the first staff/system type introduced, and which phase should
  it affect?
