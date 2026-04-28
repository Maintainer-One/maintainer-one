# Maintainer One 🏆

> **The "Screeps for Sports" Gaming Platform.**

Maintainer One is a logic-based strategy game where you don't play the game—you
develop the intelligence that plays it for you. Inspired by the depth of
_Screeps Arena_ and the strategic complexity of professional sports management,
Maintainer One challenges you to engineer the perfect sports franchise: from
on-field player logic to front-office analytics and trades.

---

## 🌟 The Vision

### 1. The "Protocol" System

The game is governed by the **Protocol**—an evolving set of rules that define
the field, the scoring, and the physical constraints.

- **Protocol V1 (Starting Point)**: A 3v3 capture-the-zone match on a 10x10
  discrete grid.
- **Evolution**: As the league grows, the Protocol evolves to include more
  players, specialized roles, advanced physics, and "Front Office" mechanics
  like drafts and trading.

### 2. The Film Room

Analyze your performance like a pro coach. Every match is deterministic and
serialized, allowing you to:

- **Pause & Inspect**: Deep dive into any tick of a game.
- **Branch Strategy**: Tweak your code at any point in a replay and instantly
  simulate the "What If" branch to see how your changes would have altered the
  outcome.

### 3. Open Logic

Maintainer One embraces the "Open Source" nature of sports strategy. Team logic
is public knowledge, encouraging a collaborative yet hyper-competitive ecosystem
where every strategy can be analyzed, countered, and evolved by the community.

---

## 🛠 Tech Stack

Maintainer One is built with a modern, high-performance web stack:

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) +
  [Tailwind CSS](https://tailwindcss.com/)
- **Simulation Engine**: [Deno](https://deno.land/) (for sandboxed server-side
  execution)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime)
- **Local Dev**: [Supabase CLI](https://supabase.com/docs/guides/cli) + [Deno
  CLI]

---

## 🚀 Getting Started

### Local Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-repo/maintainer-one.git
   cd maintainer-one
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Start Supabase Locally**: _Ensure Docker is running._

   ```bash
   supabase start
   ```

4. **Run a Local Simulation**:

   ```bash
   deno task sim --teamA players/my-logic.ts --teamB players/rival.ts
   ```

5. **Start the Web UI**:
   ```bash
   deno task dev
   ```

---

## 📖 Documentation Map

- [**Agent Guidelines**](docs/AGENT.md): How to develop for this repo (AI &
  Human).
- [**Architecture**](docs/ARCHITECTURE.md): Deep dive into the Engine, State,
  and Protocols.
- [**Roadmap**](docs/roadmap.md): Upcoming phases and long-term vision.
- [**Protocol Index**](packages/protocols/README.md): Details on the current and
  historical game rules.

---

## 🤝 Contributing

This project is intended to be a collaborative journey. Whether you are building
an invincible team or contributing to the core engine, we welcome your logic.

_Maintain your logic. Evolve the Protocol. Win the League._
