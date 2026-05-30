# Maintainer One 🏆

> **The "Screeps for Sports" Gaming Platform.**

Maintainer One is a logic-based strategy game where you don't play the game—you
develop the intelligence that plays it for you. Inspired by the depth of
_Screeps Arena_ and the strategic complexity of professional sports management,
Maintainer One challenges you to engineer the perfect sports franchise: from
on-field player logic to front-office analytics and trades.

---

## 🌟 The Vision

Maintainer One is not just a game; it is **gamified open-source governance combined with a procedurally generated narrative engine.**

It is designed to be a collaborative, community-driven experience where players can engage at whatever level of technical depth they desire. 

### 1. Tiered Community Participation
You don't need to write code to participate. The ecosystem supports a hierarchy of roles:
- **Fans**: Root for teams, participate in predictions, draft fantasy leagues, and vote on community RFCs (Request for Comments).
- **Contributors**: Propose new rules, events, or submit PRs to improve a specific team's public logic.
- **Maintainers**: Official stewards of Teams or Manufacturers who make final decisions on logic integration.
- **Authorities**: The governing bodies that oversee League rules, Protocol evolutions, and the health of the ecosystem.

### 2. Emergent Storytelling via Event RFCs
Instead of a static, authored story, Maintainer One features an automated **Lore and Event System**. Anyone in the community can propose an event idea (triggers, flavor text, in-world consequences) via an RFC. Once approved by the community, these events are injected into the simulation engine. The story then emerges dynamically during matches, surprising even the creators.

### 3. Open Logic & The Protocol
Maintainer One embraces the "Open Source" nature of sports strategy. Team logic is public, encouraging a collaborative ecosystem where strategies are shared, analyzed, and countered. The rules of the sport itself—**The Protocol**—evolve organically over time through community voting and RFCs.

For a full breakdown of the project's philosophy and community structure, see [**The Vision Document**](docs/VISION.md).

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

3. **Configure Environment Variables**:
   Because this project uses a monorepo structure, your environment variables live in the root directory. You must create symbolic links so the individual applications can access them.

   ```bash
   cp .env.example .env
   # Add your Supabase credentials to the root .env file

   # Create symlinks for the apps
   ln -s ../../.env apps/game/.env
   ln -s ../../.env apps/landing/.env

   # Link shared assets (like team logos) to the landing page
   ln -s ../../../apps/game/static/logos apps/landing/public/logos
   ```
   *(Windows users: If `ln -s` fails, copy the `.env` file into both the `apps/game/` and `apps/landing/` directories. For the shared logos, copy the `apps/game/static/logos` folder into `apps/landing/public/`.)*

4. **Start Supabase Locally**: _Ensure Docker is running._

   ```bash
   supabase start
   ```

5. **Run a Local Simulation**:

   ```bash
   deno task sim --teamA players/my-logic.ts --teamB players/rival.ts
   ```

6. **Start the Web UI**:
   ```bash
   deno task dev
   ```

---

## 📖 Documentation Map

- [**The Vision**](docs/VISION.md): The philosophy, community tiers, and emergent storytelling engine.
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
