# Maintainer One Protocol Roadmap

This document tracks the long-term evolution of Maintainer One protocols. It is
intended to sit beside the development roadmap: `docs/roadmap.md` tracks product
and platform implementation, while this file tracks game-design progression,
protocol eras, and open questions.

Nothing here should be treated as locked until it graduates through the future
Protocol RFC process. The goal is to preserve promising design threads early so
they can be tested, refined, split, merged, or discarded with intent.

---

## Design Principles

### The Three-Tier Variation Model

Protocol variation is controlled at three distinct levels:

- **Protocol Version**: Structural changes to what is possible. Changes on the
  scale of years via the RFC process.
- **Config**: Tunable parameters within a protocol (grid size, bot count, zone
  lifespan, etc.). Set per season or special event. Can drift mid-season via
  narrative event consequences. Always stored on the match record for replay
  determinism.
- **Seed**: Per-match randomness. Generated at simulation time and locked
  alongside code versions and config.

The config tier is a first-class design tool. Leagues can run dramatically
different feeling games on the same protocol version through config alone.
Protocol version changes are reserved for structural rule changes that config
cannot express.

### Subsystem Versioning

Each protocol version bundles a set of independently versioned subsystems. The
match system advances when match mechanics need structural change. All other
subsystems (draft, recovery, trade, scouting, lore) advance on their own
cadence.

The sequencing principle: **no subsystem should advance beyond V1 until all
planned subsystems have reached V1**. This keeps the complexity of each system
roughly balanced across the league and ensures the lore system — which is most
powerful when all other systems are active and the state is rich — arrives last.

Example subsystem bundle progression:

| Protocol | Match | Draft | Recovery | Trade | Scouting | Lore | Manufacturers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | V1 | — | — | — | — | — | — |
| V2 | V2 | — | — | — | — | — | — |
| V3 | V2 | V1 | — | — | — | — | — |
| V4 | V2 | V1 | V1 | — | — | — | — |
| V5 | V2 | V1 | V1 | — | — | — | — |
| V6 | V2 | V2 | V1 | V1 | — | — | — |
| V7 | V2 | V2 | V2 | V1 | V1 | — | — |
| V8 | V2 | V2 | V2 | V1 | V1 | — | — |
| V9 | V2 | V2 | V2 | V2 | V1 | — | — |
| V10 | V2 | V2 | V2 | V2 | V2 | V1 | — |
| V11 | V2 | V2 | V2 | V2 | V2 | V1 | V1 |

_Note: This table is illustrative. Actual sequencing will be determined as each
protocol version is designed._

---

## At-a-Glance Phase Ladder

| Domain | First candidate | Base-level question | Example logic entrypoint |
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
| **Lore & Narrative** | **V10** | **What storylines does the community author, and how do they shape the world?** | _(league-level, not team-logic)_ |
| **Manufacturers** | **V11** | **Which component IP is worth producing? How should rental offers be evaluated?** | `bid(context)` / `evaluate(context)` / `catalog(context)` |

---

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

---

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
  versions, team state snapshots, and active event state.
- **Artifacts create memory**: Every phase should produce durable artifacts that
  make the world feel alive: match events, scouting reports, draft decisions,
  recovery logs, trade offers, roster changes, and post-phase diagnostics.
- **Public first, private later**: Early protocols favor public logic for
  learning, local simulation, and collaboration. Private logic and official
  compute budgets may become top-league rules once secrecy itself creates
  compelling gameplay.
- **Protocol versions are a learning ladder**: Lower versions should remain
  useful as onboarding points, private league formats, and historical eras.
- **Config before protocol bump**: Before advancing the protocol version,
  consider whether the desired variation can be expressed through config changes
  alone. Reserve protocol version changes for structural rule changes config
  cannot express.

---

## Era 1: The Founding Era

The first protocol era begins as a scrappy open-source experiment and ends when
the league crosses into mainstream legitimacy — represented mechanically by
robotics manufacturers taking an explicit interest and entering the ecosystem.
The arc is: learn the board → build the organization → author the world → watch
the world change around you.

The Founding Era is what this period becomes in retrospect once there is a
second era to compare it to. Early participants are founding members of
something that will eventually outgrow its origins. The garage is where it
started. The Founding Era is what that period means in history.

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

**Status**: Candidate. Intended as the stable match floor for an extended period.

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

V2 is the intended stable floor for match mechanics across an extended protocol
era while all other subsystems are introduced and reach V1. It must be evaluated
not just as a standalone match system but as a legible backdrop against which
draft decisions, wear patterns, roster choices, trade consequences, and narrative
events will layer over many protocol versions. Team identity expressed through
characteristic formation tendencies (swarming vs spreading) should persist and
remain readable as surrounding complexity grows.

Config parameters (grid size, bot count, zone lifespan, zone spawn rate) allow
meaningful variation across seasons and leagues without requiring a V3 match
system.

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

### V10: Lore System V1

**Status**: Long-term candidate.

**Core lesson**: The community authors the world's story, and the world
responds.

**Sequencing rationale**

The lore system arrives after all team-facing subsystems have reached V1. It is
most powerful at this point because:

- Narrative consequences can touch the richest possible team state — bots,
  traits, wear, draft picks, trade records, scouting reports, config.
- The community has grown through every system introduction and understands the
  state deeply enough to write mechanically interesting submissions.
- The artifact history accumulated across all prior protocols gives the lore
  system real events to interpret and respond to.

The lore system arriving before manufacturers is also a deliberate narrative
choice. The community needs narrative tools to *dramatize* the transition that
manufacturers represent. The arrival of the first manufacturer can itself be a
lore event — a Disruption type firing when the league crosses a visibility
threshold, announcing that a corporation has taken interest. The community
watches the Founding Era end in real time rather than having it simply happen
mechanically.

For full design details see `docs/lore-system.md`.

### V11: Manufacturer System V1 — End of the Founding Era

**Status**: Long-term candidate. The capstone of Era 1.

**Core lesson**: The supply chain is a game. Who builds the equipment matters
as much as who deploys it.

**Narrative significance**

The manufacturer system's arrival is not just a new mechanic — it is the moment
the Founding Era ends. The league started as a scrappy open-source experiment
run by hobbyists in warehouses. By V11 it has grown large enough that robotics
corporations take explicit interest. The uniform prototype chassis of V1 are
retired. Real manufacturers enter the ecosystem with their own logic, their own
competitive ambitions, and their own history to accumulate.

This transition is earned rather than arbitrary because the lore system is
already in place to frame it. The first manufacturer entering the draft pool is
a world event the community has been building toward, not a patch note.

**Sequencing rationale**

By V11 the conditions are right for manufacturers to land with full weight:

- Teams have variable rosters with real bot-to-bot differentiation, giving
  manufacturers meaningful design space.
- Wear and recovery mean bots have individual histories, making the rental
  relationship feel personal rather than abstract.
- Trading means teams already reason in terms of asset valuation — they are
  ready to think about rental pricing and free agency timing.
- Scouting means teams already reason under uncertainty — they can evaluate
  manufacturer reputation and catalog quality using the same thinking.
- The component IP pipeline has accepted community submissions since V3,
  meaning manufacturers inherit a rich catalog backlog rather than starting
  from an empty market.
- The lore system is in place to dramatize the transition and give the community
  narrative authorship over how the Founding Era ends.

**Primary concepts**

- Manufacturers as first-class entities with maintainers, contributors,
  reputation tag sets, and catalog histories.
- Component IP auctions: community-submitted designs are bid on by
  manufacturers; winning bid becomes production cost.
- Draft contracts: bots enter the league on rookie deals at controlled prices
  for a fixed term.
- Free agency: expired contracts trigger team offer submissions; manufacturers
  evaluate offers against retirement calculus.
- Single-manufacturer compatibility: chassis and components from the same
  manufacturer only, reflecting integrated design and training.
- Component aging: tag intensity degrades over time, preventing manufacturers
  from resting on successful designs.
- Manufacturers championship: distinct titles (Prestige, Market, Longevity,
  Depth) running alongside the team championship. Winning is its own reward —
  no mechanical bonuses to avoid rich-get-richer compounding.

**Manufacturer logic entry points**

```ts
bid(context: ComponentIpAuctionContext) -> BidAction
evaluate(context: FreeAgencyContext) -> AcceptAction | RetireAction
catalog(context: CatalogContext) -> CatalogAction[]
```

For full design details see `docs/world-entities.md`.

---

## Future Era Candidates

_(Unchanged from prior version — see below for full list.)_

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

### Training and Game Prep

Prep phases can give teams a limited opportunity to tune for a specific matchup
or improve a specific part of their system before a match.

### Strategy Packages and Deployment

Teams may maintain multiple tactical packages or logic versions and write
deployment logic that chooses which package runs in a given phase or matchup.

### Facilities and Infrastructure

Teams may eventually have limited facility or infrastructure slots that improve
specific phases.

### Component Compatibility

Components should eventually interact rather than simply add isolated stats.

### Environment and Conditions

Later protocols may introduce match or phase conditions that reward resilient
logic (sensor noise, grid instability, zone volatility, etc.).

### Information Markets

If scouting and imperfect information become important, teams may eventually
trade, buy, sell, or publish information artifacts.

### Phase-Based League Simulation

Long-term seasons may be composed of scheduled phases with different tick
cadences, allowed actions, and team-logic entrypoints.

### Maintainer AI

AI-enabled formats should be treated as distinct formats rather than silently
mixed into human-authored logic leagues.

### Private Logic and Compute Budgets

Early protocols should favor public code and unlimited local simulation. Later
top-league formats may introduce private team logic and official simulation
budgets once the stakes justify the operational burden.

---

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
- What is the minimum viable event type taxonomy for Lore V1?
- What config parameters should be eligible for narrative consequence
  manipulation, and which should be locked?