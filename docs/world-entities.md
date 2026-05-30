# World Entities

This document captures the design of Maintainer One's living world — the
entities that exist within it, the tag system that unifies them, and the
economic and narrative systems that make them interact. These systems are
designed to emerge gradually across protocol versions. Nothing here is V1 scope;
this document is a design north star that informs how earlier systems are built
so they don't need to be rebuilt when later ones arrive.

---

## The Core Insight: Tags as the Universal Primitive

The entire world model reduces to a surprisingly simple foundation:

**Entities carry tag sets. The simulation reads tag sets to determine behavior.
Everything else is a system for managing which tags exist on which entities.**

This has several important implications:

- Components are just tags that give a bot functionality.
- Wear is just a temporary tag with a numeric intensity.
- Lore event consequences are just tag application operations.
- Bot identity is the accumulated history of tags applied, earned, and expired
  over a career.
- Manufacturer reputation is the aggregate tag history of everything they have
  ever produced.

The tag model is not just an implementation convenience — it is the game's
theory of identity. What an entity *is* is the sum of what has happened to it
and what it was built with.

---

## Tag Anatomy

Every tag has the following properties:

- **Type**: Permanent, temporary, or conditional.
- **Source**: Manufactured (applied at creation), earned (applied by accumulated
  statistics crossing a threshold), event-applied (applied by a lore system
  consequence), governance-applied (applied by league or governing body action),
  or age-derived (applied as a component crosses an age threshold).
- **Scope**: Which entity types can carry this tag.
- **Effect**: What the simulation does differently when this tag is present.
  Effects are defined by the protocol version — a tag with no defined effect in
  the current protocol is inert but preserved.
- **Visibility**: Public (visible to all team logic and spectators) or private
  (visible only to the carrying entity's maintainer, if applicable).
- **Intensity**: Optional numeric value for tags that exist on a spectrum (e.g.
  wear severity, reliability modifier).

Tags with no defined effect in the current protocol are preserved on the entity.
A future protocol version can assign meaning to a tag that previously existed
as pure history. This means the world accumulates data that becomes meaningful
retroactively — a tag applied in V3 might matter in V5 in ways nobody planned.

---

## Entity Types

### Bot

A bot is the primary competitive unit. It is the entity fans root for and the
entity whose career arc produces the most narrative.

**A bot's identity is the intersection of its lineage and its history.** The
manufacturer provides the lineage — chassis type, initial component set, the
production line it came from. The league provides the history — matches played,
events survived, championships won, wear accumulated, lore tags earned.

**Tag permanence is central to bot identity.** Components installed on a bot
cannot be removed or swapped without prohibitive cost. This is not merely a
mechanical constraint — it reflects that a bot's systems learn to work together
as a unified entity. The integration of hardware and trained coordination is the
asset. Two bots with identical components installed at different times on
different chassis are genuinely different entities because their histories
diverged from the moment of manufacture.

A bot's tag set at any point in its career is therefore a complete biography:
what it was built with, what was added, what happened to it, and what it earned.
No two bots have the same biography.

**Retirement** is the end of a bot's active career. A retired bot's full tag
history is preserved permanently as a league artifact. Fans can inspect a
retired bot's complete career record. Retired bots can be referenced by lore
events (e.g. a Reckoning event that fires when a team loses a bot whose career
echoes a legendary retired predecessor).

### Chassis

The chassis is the foundational entity a bot is built on. It is produced by a
manufacturer and defines the bot's physical character — movement profile,
durability baseline, component capacity, and aesthetic identity.

Chassis are manufacturer-specific. A bot built on a manufacturer's chassis can
only run that manufacturer's components. This is not an arbitrary restriction —
chassis and components are designed and trained as integrated systems. The
compatibility is part of the product.

A chassis carries its own tag set that combines with component tags to produce
the bot's effective tag set. A chassis tagged *heavyweight* combined with a
component tagged *sprint-capable* produces a bot with a specific and readable
character that team logic and fans can interpret.

### Component

A component is a tag bundle — a named set of tags that gets applied to a bot
when the component is installed. The component itself is not a simulation
primitive; the tags it carries are. What distinguishes a component from a raw
tag is that components have:

- A manufacturer (who produces them and holds the rental relationship)
- A design origin (community-submitted, approved, IP-auctioned)
- An age (which affects the potency of the tags it carries)
- A rental history (which bots have carried it, which teams have rented it)

**Component aging** is a core balance mechanic. As a component ages its tag
intensities degrade according to a curve — rapid initial degradation as the
meta adapts to the design, then a plateau at a reduced but still viable
effectiveness. A dominant new component becomes a reliable budget option over
time rather than disappearing entirely. Manufacturers cannot rest on successful
designs; they must continuously develop new IP or accept declining rental
revenue from aging catalog.

Component aging can be explained in-world as either literal technological
obsolescence or as teams developing counter-strategies against well-documented
designs. Both framings are valid and can coexist.

**Bans and recalls** are available for extreme cases. A recall applies a
*recalled* tag to all active instances of a component, temporarily suspending
its effect tags pending review. A ban permanently retires the design. Both
actions are governance-level decisions and produce significant lore artifacts —
a recall is a narrative event as much as a mechanical one.

### Manufacturer

A manufacturer is a first-class world entity — not just a label on a component
but an actor with reputation, financial state, catalog, and logic.

**Sequencing**: Manufacturers are introduced at approximately V11 as the capstone
of the Founding Era — the moment the league crosses into mainstream legitimacy
and real corporations take explicit interest. They arrive after the lore system
(V10) so the community has narrative tools to dramatize the transition. The
first manufacturer entering the draft pool is a world event the community has
been building toward, not a patch note. By V11 the draft backlog from community
component submissions is rich enough that manufacturers have interesting
decisions to make from day one. See `docs/protocol-roadmap.md` for full
sequencing rationale.

Manufacturers are governed similarly to teams: they have maintainers who write
and deploy manufacturer logic, and contributors who propose components, analyze
the market, and shape strategy. The manufacturer competitive axis is **market
share** rather than championship standing. Two leaderboards run simultaneously
in the same world, attracting different types of players with different skill
sets and motivations.

**Market share is measured two ways:**
- **Unit share**: Percentage of active bots running at least one of this
  manufacturer's components.
- **Revenue share**: Percentage of total rental income flowing to this
  manufacturer.

### The Manufacturers Championship

Winning the manufacturers championship is its own reward. There are no
mechanical bonuses for finishing first — the prestige and the permanent record
are the point. This is consistent with how the team championship works: the
draft order inverts so the best teams pick last, meaning winning confers
bragging rights and history rather than compounding advantages. Keeping the
field competitive across seasons matters more than rewarding dominance.

The manufacturers championship is a distinct title from the team championship,
measuring something different — the quality, depth, and appeal of a
manufacturer's catalog across the whole season rather than a single match
outcome. It mirrors the constructors championship in Formula One: a separate
trophy telling a separate story about the same season.

Multiple distinct championship titles are richer than a single composite score
because each tells a specific story about what a manufacturer built and who they
are. Candidate titles:

- **Prestige Champion**: Most chassis on the season's championship team.
  The quality-at-the-top-end title. The equivalent of having your engine
  in the championship car.
- **Market Champion**: Highest total seasonal rental revenue. Rewards broad
  appeal and smart free agency pricing across the whole field.
- **Longevity Champion**: Highest average bot value at season end across all
  active rentals. Rewards producing components that age well and accumulate
  prestige tags through sustained performance rather than peaking early.
- **Depth Champion**: Most bots active in the playoffs. Rewards consistency
  and catalog depth rather than a single standout product.

A manufacturer can hold multiple titles in the same season or specialize into
one. A manufacturer that has never won the Prestige title but has won the Market
title five consecutive seasons has a distinct and readable identity. The titles
accumulate into a permanent record that tells the manufacturer's story across
eras.

High unit share with low revenue share indicates a commodity strategy — many
teams running cheap aging components. High revenue share with low unit share
indicates a premium strategy — few teams running cutting-edge expensive
components. Both are viable. Neither is stable indefinitely.

**Manufacturer reputation** is a tag set like any other entity. A manufacturer
with a *corners-cut* tag (applied after a recall) produces components that carry
a *reliability-penalty* tag in addition to their normal effects. Teams know this
when drafting. Rental offers will reflect it. The manufacturer must earn their
way back to a clean reputation through sustained quality, or lean into the
budget positioning their reputation implies.

A manufacturer's catalog, recall history, retirement record, and market position
are all permanent public artifacts. Fans have opinions about manufacturers the
same way they have opinions about teams.

**Manufacturer retirement of bots** is a meaningful decision. When a team's
rental contract expires the manufacturer evaluates incoming offers against the
alternative: retiring the bot. Retirement at peak — before age-related
degradation becomes visible — earns significant prestige. A manufacturer known
for retiring bots at the right moment builds a reputation for quality and respect
that affects future draft demand. This is economically irrational and culturally
completely believable, which is exactly the register this world operates in.

### Team

Teams are documented in detail elsewhere. In the context of the world entity
model, teams carry tags that accumulate across seasons — *dynasty*, *rebuilding*,
*cursed*, *underdog* — which affect their exposure to lore events and their
narrative identity in the league record.

A team's relationship with manufacturers is part of their public identity. A
team that runs exclusively one manufacturer's bots is making a legible statement
about their philosophy. A manufacturer's recall scandal hits every team running
their hardware and becomes part of both entities' histories.

### League

The league as an entity carries tags that reflect its current state and history.
Config drift driven by lore events is essentially tag application at the league
level. A league that has been through a *compression era* (multiple grid-shrink
events) has a different character than one that hasn't, and that history is
readable.

### Governing Body

The governing body can carry tags and can apply tags to other entities through
governance actions. This is the mechanic that blurs the line between in-world
narrative and rules — a governing body decree that is technically a config
change but is presented as an in-world ruling is both things simultaneously. The
fiction and the mechanics reinforce each other rather than competing.

---

## Two Competitive Axes

The world has two simultaneous competitive games running on the same stage:

**Championship axis** — Teams compete for league standing, playoff position, and
ultimately the championship. Measured by the standings table. Driven by team
logic quality and roster management.

**Market axis** — Manufacturers compete for unit share and revenue share. Measured
by the market table. Driven by manufacturer logic quality, catalog management,
and reputation.

These axes are entangled, not parallel. A manufacturer whose components power
the championship team gains prestige and draft demand. A team that understands
manufacturer incentives and times their free agency bids intelligently gains a
roster advantage. A recall scandal that hits a dominant manufacturer mid-season
reshapes the championship race without anyone touching team logic. The two
communities need each other and affect each other constantly.

---

## The Manufacturer Economy

### Component IP Pipeline

Community members submit component ideas through the same RFC-style pipeline as
lore events. A submission includes proposed tags, intended chassis compatibility,
and a rough performance profile. Submissions that are clearly outside protocol
constraints or that the league authority deems unimplementable in the current
version are routed to the component roadmap rather than declined outright —
popular unimplementable ideas are signals about what future protocol versions
should enable.

Approved component designs are auctioned to manufacturers. The winning bid
becomes the component's production cost. Manufacturers bid based on their
assessment of the design's rental potential against their current financial
position and catalog strategy. A manufacturer with a weak lineup in a specific
performance category will bid aggressively for a strong design there. A
manufacturer rebuilding after a recall may only be able to afford less
competitive designs, which reinforces their budget positioning.

### The Rental Market

Teams do not own bots or components. They rent from manufacturers. The rental
relationship has two phases:

**Draft contract**: When a bot first enters the league through the draft it is
available on a fixed rookie deal — a set term at a controlled price. This gives
teams time to evaluate the bot in real match conditions before the open market
determines its value. The rookie deal term is defined by the protocol config.

**Free agency**: When a draft contract expires the bot enters free agency. Teams
submit rental offers. The manufacturer evaluates offers against their retirement
calculus — revenue now versus prestige of retiring at peak. The manufacturer's
logic runs this evaluation automatically; the decision is not manually made by
the manufacturer's maintainer in the moment.

Manufacturers do not set prices. Teams make offers. This creates a genuine
market where component value is determined by what teams actually believe the
component is worth given its age, the manufacturer's reputation, and the current
meta. A manufacturer whose components are consistently generating strong free
agency offers has real market signal to inform their IP bidding strategy.

### Manufacturer Logic Entry Points

Manufacturer logic is automated in the same spirit as team logic — maintainers
write systems that make decisions, not humans approving each action in the moment.

Draft entry points:

```ts
bid(context: ComponentIpAuctionContext) -> BidAction
```

Free agency entry points:

```ts
evaluate(context: FreeAgencyContext) -> AcceptAction | RetireAction
```

Catalog management:

```ts
catalog(context: CatalogContext) -> CatalogAction[]
```

Each entry point receives full context: the manufacturer's current financial
state, reputation tag set, active catalog, pending free agency decisions, and
relevant league state. The logic must balance short-term revenue against
long-term reputation, aggressive IP acquisition against sustainable production
costs, and premium positioning against market share.

---

## The Three Community Pipelines

The community simultaneously authors three distinct aspects of the world through
three parallel pipelines, all using the same RFC-style idea-to-approval flow:

**Protocol RFC pipeline** — Changes to the rules themselves. Governed by the
governing body. Stage 0 through Stage 4. Produces protocol version increments.

**Component IP pipeline** — New component and chassis designs. Approved by
league authority. Auctioned to manufacturers. Produces the equipment catalog.

**Lore event pipeline** — Narrative events with mechanical consequences. Approved
by league authority. Triggered by conditions against league state. Produces
world history.

All three pipelines share the same routing logic: ideas that are implementable
now get formalized, ideas that gain traction but aren't yet implementable get
added to the relevant roadmap, ideas with little traction stay in the discussion
layer. Popular unimplementable ideas in any pipeline are signals about what
future versions should prioritize.

The community is simultaneously authoring the world's story, its economy, and
its rules. No single human author needs to have a grand plan. The systems
produce the world collaboratively.

---

## Open Questions

- What is the exact tag anatomy for components — are tags defined per-component
  in the submission or are they selected from a protocol-defined tag vocabulary?
- How is component aging expressed mechanically — a time-based degradation curve,
  a usage-based curve (games played), or both?
- What is the retirement prestige mechanic — a numeric prestige score, a
  permanent tag applied to the manufacturer, or a specific lore artifact?
- Can a bot carry tags from multiple sources simultaneously that conflict? What
  is the resolution order?
- What is the minimum viable manufacturer logic API for the first protocol
  version that introduces manufacturers?
- Should chassis compatibility be strictly single-manufacturer or could a future
  protocol introduce cross-manufacturer compatibility as a premium option with
  tradeoffs?
- How are manufacturer maintainers and contributors structured relative to the
  existing team maintainer/contributor model — same RBAC system, same reputation
  pipeline?
- What prevents a manufacturer from running at a loss intentionally to flood the
  market with cheap components and dominate unit share — is this a valid strategy
  or does it need a mechanical constraint?
- **Manufacturers persist indefinitely and cannot go bankrupt.** In-world they
  are large corporations able to subsidize losses in the Maintainer market with
  profits elsewhere, the same way automotive manufacturers justify Formula One
  spend through brand value and engineering prestige. This removes dissolution
  edge cases entirely. Reputation, market share, and catalog quality are the
  competitive pressures — not survival. A manufacturer that weathers a bad era
  and rebuilds has a more interesting history than one that simply ceases to
  exist.
- Since manufacturers cannot be eliminated, **what are the meaningful stakes of
  the market share competition?** The standings need to matter beyond a
  leaderboard position. Candidates: the revenue share leader earns a bonus IP
  slot before the next component auction opens; the unit share leader receives a
  prestige tag that affects future draft demand; bottom-tier manufacturers
  receive a *struggling* tag that makes their components cheaper but signals
  quality concerns to team logic. None of these are elimination mechanics but
  they give the table real consequences worth competing for.
- **Resolved: winning the manufacturers championship is its own reward.** No
  mechanical bonuses for finishing first — the prestige and the permanent record
  are the point, consistent with how the team championship works. Multiple
  distinct titles (Prestige, Market, Longevity, Depth) each tell a specific
  story about what a manufacturer built. Rich-get-richer mechanics are
  deliberately avoided to keep the field competitive across seasons and avoid
  compounding disadvantages for manufacturers rebuilding from a rough era.
