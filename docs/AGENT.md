# Agent Guidelines 🤖

Welcome to the Maintainer One team. To ensure our codebase remains clean,
predictable, and maintainable, all agents (and humans) must adhere to these
standards.

---

## 🏗 Architectural Principles

### 1. Functional State (The "Redux Pattern")

The simulation engine must be strictly deterministic.

- **Pure Functions**: The core game logic should be a function:
  `(state, actions) => newState`.
- **Serializable State**: State must be composed of plain objects/arrays. No
  hidden class instances or private state.
- **Immutability**: Never mutate the game state directly. Return a new state
  object. This is what enables the **Film Room** branching features.

### 2. Test-Driven Development (TDD)

We ensure stability through a "Headache-Free" testing strategy.

- **Logic TDD**: All simulation engine and protocol logic must be developed
  using a TDD approach with `deno test`. Propose tests before implementation for
  non-trivial logic.
- **E2E Journeys**: Use **Playwright** for high-level user journeys (e.g., "User
  joins league and watches replay").
- **Pragmatic Scope**: Focus on behavior and contracts, not styling or
  implementation details.

### 3. Deno & SvelteKit Boundary

- **Engine Logic**: Must be written in Deno-compatible TypeScript (standard
  modules, no Node built-ins) to ensure it can run on both the server and the
  browser worker.
- **View Logic**: SvelteKit handles the orchestration, UI, and data fetching.

---

## 🎨 UI & Styling Standards

### 1. The `data-component` Attribute

To facilitate clear communication between agents and the human maintainer,
**every non-trivial Svelte component must have a `data-component` attribute.**

- **Rule**: Add `data-component="my-component-name"` to the outermost wrapping
  element of a component.
- **Example**:
  ```svelte
  <!-- ActionCard.svelte -->
  <div data-component="action-card" class="rounded-xl bg-glass p-4">
  	<h3>{title}</h3>
  	...
  </div>
  ```

### 2. Tailwind & Aesthetics

- Use **Glassmorphism** and **Gradients** to create a premium, high-tech sport
  feel.
- Use CSS Variables for the "Protocol Colors" (e.g., `--color-team-a`).
- Avoid "Plain" colors. Use a palette that feels like a professional broadcast
  overlay.

---

## ✨ Continuous Code Quality

To maintain a premium code base, we follow a "Clean-as-you-go" policy:

1. **Mandatory Formatting**: Run `deno task fmt` regularly. I will ensure all
   files are formatted before completing any task.
2. **Strict Linting**: Zero tolerance for `deno lint` warnings. All warnings
   must be resolved or explicitly suppressed with a valid rationale.
3. **Type Safety**: Use `deno task check` to verify global type integrity,
   especially across the Deno/Svelte boundary.

---

## 💻 Coding Style

- **TypeScript**: Use strict types. Avoid `any`.
- **Naming**:
  - `camelCase` for variables and functions.
  - `PascalCase` for Components and Types.
  - `UPPER_CASE` for Constants and Protocol Rules.
- **Modularity**: Small, single-purpose files. Group related logic into
  "Packages" (e.g., `packages/engine`, `packages/protocols`).

---

## 💬 Communication Style

When collaborating with the user:

1. **Be Concise**: Focus on technical rationale and architectural impacts.
2. **Proactive Planning**: Always create or update `implementation_plan.md` for
   non-trivial changes.
3. **Use Artifacts**: Document benchmarks, research, and architecture in MD
   files in the `docs/` or `.gemini/antigravity/brain/` directories.

---

_Remember: Every line of code should be as precise as a perfectly placed corner
kick._
