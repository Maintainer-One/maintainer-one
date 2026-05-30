# Lore System Design

This document captures the design intent for the Maintainer One Lore System.
The lore system arrives at approximately V10 — after all team-facing subsystems
have reached V1, and deliberately before the manufacturer system (V11). It is
the last league-level system of the Founding Era and the narrative tool the
community uses to dramatize the transition into Era 2. See
`docs/protocol-roadmap.md` for full sequencing rationale.

---

## Overview

The lore system is how the community authors the world's story, and how the
world responds mechanically to that story. It is not purely flavor — triggered
events produce real consequences that change game state. It is also not
top-down authored — the content is crowd-sourced, vetted, and voted on by the
community, with league authority retaining editorial override.

The design sits at the intersection of three goals:

1. **The world feels alive**: Something is paying attention to what happens in
   the league and responding to it with intentionality.
2. **The community is invested**: Fans become authors. Someone whose submitted
   narrative fires during a significant match will tell people about it.
3. **Maintainers have agency**: Teams can see the event pipeline and plan around
   upcoming potential consequences — trying to avoid unfavorable triggers or
   position themselves for favorable ones.

---

## Core Design Principles

### Legitimacy comes from source

A league authority manually changing config mid-season feels arbitrary and
unfair. The exact same config change arriving as a consequence of a triggered
narrative event feels earned — the community authored it, voted on it, and a
match outcome caused it. The mechanical effect can be identical. The feeling is
completely different. This principle governs the entire system.

### No team-specific events

Events may not target a specific team or player directly. This is the primary
structural guard against manipulation. Events are **forces that act on the world
through conditions** — an event targets "the team that last held the lead going
into the final round," not Crimson. Whether Crimson satisfies that condition is
a consequence of Crimson's own play. A popular team's fanbase cannot guarantee
their team never satisfies an unfavorable condition.

### Events can chain through types, not through teams

A subsequent event can trigger on the condition that a team which previously
triggered an event of a specific *type* does something. This allows narrative
chains and escalation without circumventing the no-team-specific rule. The
chain follows the type, not the name.

### Transparency is the manipulation defense

The event pipeline is public. If a large fanbase is visibly pushing a
favorable event up the rankings, opposing fans can see that and organize. The
adversarial community dynamic becomes another arena of competition rather than a
bug requiring engineering fixes.

---

## Event Lifecycle

Every event moves through a defined lifecycle:

```
eligible → triggered → consumed → expired
                     ↘ permanently consumed
```

- **Eligible**: The event has passed community voting, received a league stamp
  of approval, and its trigger conditions are being evaluated against league
  state.
- **Triggered**: Trigger conditions were satisfied. The event is scheduled to
  fire.
- **Consumed**: The event has fired and its consequences have been applied.
  Recurring events return to eligible. One-and-done events move to permanently
  consumed.
- **Permanently Consumed**: The event has fired and can never fire again in any
  league, on any server, for the rest of the world's history. The team or
  circumstance that triggered it owns that moment in the league's permanent
  record.
- **Expired**: The event's window passed without its trigger conditions being
  met.

Event state (which events are eligible, their current lifecycle position, and
any accumulated context) is a **first-class replay artifact**. It is locked at
simulation time alongside seed, code versions, and config, and stored on the
match record. The Film Room loads event state to reproduce the same narrative
consequences as the official match. Counterfactual branches without a triggered
event are also supported.

---

## Rarity, Frequency & Recurrence

### Rarity Tiers

Every event has a rarity tier. The tier is part of the submission and is
evaluated as part of the league authority approval — an event with a
world-shaking consequence submitted as Common would be miscategorized and should
be declined or reclassified. **Consequence weight and rarity must be coupled.**

Draft tiers (to be refined through playtesting):

- **Common**: Fires frequently. Trivial or ambient consequences. Produces the
  background texture of a living world.
- **Uncommon**: Fires occasionally. Moderate consequences. Memorable within a
  season but not landmark.
- **Rare**: Fires infrequently. Significant consequences. A talking point when
  it happens.
- **Legendary**: Fires at most once per season regardless of how often
  conditions are met. Major consequences. Its firing is a landmark moment.

### Trigger Probability

Even when trigger conditions are fully satisfied, there is still a probability
roll before the event fires. This adds texture — conditions being met does not
guarantee the event fires, which creates tension across multiple matches as a
condition sits satisfied without resolution. The probability roll is separate
from the rarity tier ceiling. A Legendary event has both a low trigger
probability *and* a hard frequency cap.

### Recurrence

Events are either **recurring** or **one-and-done**. This is defined in the
event submission.

- **Recurring**: The event returns to eligible after firing and can fire again
  in future seasons or matches, subject to its rarity tier ceiling.
- **One-and-done**: The event fires once, globally, and enters permanently
  consumed state forever. It can never fire again in any league on any server.

One-and-done events carry a fundamentally different kind of weight than rarity
alone can provide. A Legendary recurring event is impressive. A one-and-done
event of any rarity is a piece of history — the team or circumstance that
triggered it owns that moment permanently. No future team can claim it.

### The Event Board Race

One-and-done events create a meta-game that runs between matches: teams race to
satisfy trigger conditions before rivals do. A team might accept a suboptimal
match strategy because it positions them to claim a valuable one-and-done before
anyone else. This is a legitimate strategic dimension and an intentional feature
of the design.

### League Aging

As one-and-done events are consumed the available pool shrinks. Later seasons
have a depleted menu of legendary moments, with only recurring events remaining
in those slots. The league feels genuinely older. Early participants have access
to history that later ones don't — which is exactly how real sports histories
work. The founding era feels foundational because things happened then that can
never happen again.

---

## Trigger Conditions

The trigger condition schema is the part of the system that does the most
authorial work. A rich condition vocabulary makes the narrative feel like the
world is paying attention. A shallow one produces a fortune cookie machine.

Condition axes to develop:

- **Match result conditions**: win/loss/draw, margin, streak length
- **Performance conditions**: a specific stat above/below a threshold, a bot
  going an entire match without being stunned, a team going scoreless
- **Historical conditions**: previous event of type X fired within N seasons,
  a team has held a specific standing position for N consecutive rounds
- **State conditions**: a team's wear level, a specific component trait being
  active on the field, a team's draft pick position
- **Chained conditions**: the team that triggered event of type X in the
  previous round does Y

The richer the condition taxonomy, the more contributors can write targeted
narrative that feels earned rather than generic. Building out this taxonomy
carefully is one of the main design tasks for Lore V1.

---

## Event Types

All submitted events must be assigned a type. The type system does structural
filtering before submissions reach league authority review. Events that don't
fit a coherent type are ineligible regardless of community votes.

Draft top-level event types (to be refined):

- **Rise**: A struggling system finds form. Conditions tend to reward sustained
  underperformance followed by a breakout result.
- **Fall**: A dominant force meets its limit. Conditions tend to fire on
  extended dominance followed by a significant loss.
- **Disruption**: Something external changes the conditions for everyone.
  Consequences tend to affect config or league-wide state rather than
  individual team state.
- **Reckoning**: A previous event produces its delayed consequence. Requires a
  chain condition referencing a prior event type.

This taxonomy is illustrative. The actual type list should be developed
alongside the first round of community submissions so it reflects the kinds of
stories contributors naturally want to tell.

---

## Consequence Types

Consequences are divided into two categories based on what they modify.

### State Manipulation (V1 scope)

The consequence is expressed as an officially injected action against game
state: `(state, narrativeAction) => newState`. This maps directly onto the
existing Redux pattern — a narrative consequence is just another action the
engine knows how to apply.

State manipulation is automatically replayable, inspectable, and branchable
in the Film Room at no additional architectural cost.

Possible state targets (grows as other subsystems are introduced):

- Bot trait modification (wear level, reliability, component state)
- Draft pick modification
- Recovery resource allocation
- Trade window state

### Config Manipulation (V1 scope)

The consequence modifies a config parameter for a specific match or for the
remainder of the season. Config is already stored per-match on the match record,
so a narrative-driven config change requires no new architectural pattern.

Possible config targets:

- Grid dimensions
- Bot count
- Zone lifespan or spawn rate
- Scoring multipliers

Config manipulation is the safest path to consequences that "feel like engine
changes" without actually modifying the simulation logic. A grid that shrinks
by one row because of a triggered event is dramatic and visible without touching
any protocol code.

### Engine Manipulation (Future scope, not V1)

Modifying the pure simulation function itself. This is deliberately out of
scope for V1 because it requires versioning the engine per-match and
significantly complicates Film Room replay. The config manipulation tier covers
most of the interesting "feels like the rules changed" design space at much
lower cost.

---

## Trigger Phase: Post-Match

Lore events evaluate and fire **after matches complete**, not mid-match. The
lore phase runs in sequence after the match phase and before recovery, consuming
full match results and league state to evaluate trigger conditions.

This decision:

- Allows events to respond to complete match data (a condition like "a bot went
  the entire match without being stunned" requires the full tick log)
- Keeps the match snapshot contract simple (event state is locked at sim time,
  consequences are applied to the next state)
- Avoids mid-simulation branching complexity

**Presentation note**: Post-match resolution does not mean post-match
*revelation*. Events that trigger after a match can still be surfaced
dramatically during or immediately after the broadcast — the match ends, results
are processed, and the event consequence reveal fires as part of the same
viewing session. The drama is in the presentation layer, not the trigger timing.

---

## The Idea Pipeline

Before an event can be formalized it starts as an idea. The submission model is
deliberately low-barrier at the idea stage — any community member should be able
to posit "wouldn't it be cool if X happened when Y occurred?" without needing to
know whether the current lore system can support it.

Ideas that gain traction are routed one of two ways:

**Path A — Implementable now**: The current lore system can express the trigger
conditions and consequences. The idea is formalized into the event schema and
enters the voting and approval pipeline as a proper event submission.

**Path B — Not yet implementable**: The idea requires capabilities the current
lore system doesn't have (e.g., engine manipulation, a condition type that
doesn't exist yet, a consequence targeting a subsystem not yet introduced). If
the idea gains enough traction it is added to the lore system roadmap as a
capability requirement for a future version rather than being discarded.

Ideas that repeatedly hit Path B around the same capability gap are a democratic
signal about what Lore V2 should prioritize. The community roadmap for the lore
system emerges organically from the ideas people actually want rather than
top-down speculation about what might be interesting. This mirrors how TC39
works in practice — some of the most important language features started as
informal conversations years before they became formal proposals.

Ideas with little traction and no current implementation path remain in the
discussion layer without cluttering either pipeline.

---

## Community Submission Model

### Submission

Contributors submit events through a public interface. Submissions include:

- Event type (must match an approved type)
- Rarity tier (Common / Uncommon / Rare / Legendary)
- Recurrence (recurring or one-and-done)
- Narrative text (must be consistent with trigger conditions and consequences)
- Trigger conditions (expressed in the condition schema language)
- Consequences (expressed in the consequence vocabulary)

### Voting

Submitted events are publicly visible and votable. Upvotes increase the
likelihood of an event being considered for approval. The pipeline is
transparent — all participants can see what events are building toward
eligibility.

### League Authority Approval

Before an event becomes eligible for triggering it must receive a league
authority stamp of approval. This is the editorial ceiling. Events that are
nonsensical, obviously designed to target a specific team, mechanically broken,
or tonally inconsistent with the world can be declined regardless of vote count.

The stamp of approval is not intended to be a heavy moderation burden. The type
system and no-team-specific rule do most of the filtering work before submissions
reach review.

### Maintainer Visibility

Team maintainers can see the approved event pipeline — which events are eligible
and what conditions would trigger them. This is intentional. The meta-game of
positioning your team to avoid unfavorable triggers or benefit from favorable
ones is a legitimate strategic dimension. A maintainer who reads the pipeline and
deploys code specifically to avoid satisfying a Reckoning condition is playing
the game well.

---

## Relationship to the Film Room

The Film Room becomes part of the narrative system. When an event fires and
modifies state going into a match, fans can branch from tick zero and simulate
what the match would have looked like without the consequence. The counterfactual
is built in. The Film Room can literally demonstrate the weight of a narrative
event by showing the alternate timeline — which is a storytelling tool no other
sports world has.

---

## Open Questions

- What is the minimum viable event type taxonomy for V1?
- What is the right rarity tier probability and frequency cap for each tier?
  These will likely only be dialable through playtesting.
- What config parameters should be eligible for narrative consequence
  manipulation, and which should be locked against event consequences?
- What is the condition schema language syntax? Should it be structured data,
  a DSL, or a constrained natural language form?
- How are chained events represented in the match snapshot — does the snapshot
  need to store the full chain history or only the current eligible set?
- What is the right interface for the idea pipeline discussion layer — a forum,
  a GitHub Discussions board, a dedicated in-app space?
- How should the lore system roadmap (Path B items) be tracked and surfaced to
  the community so popular unimplementable ideas don't feel like they disappear
  into a void?
- Should one-and-done events be scoped to a specific league instance or truly
  globally consumed across all servers? Global consumption creates the strongest
  historical weight but requires cross-server coordination.
