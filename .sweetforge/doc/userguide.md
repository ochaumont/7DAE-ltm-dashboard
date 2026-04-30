# SweetForge — User Guide

> SweetForge is a documentation framework that captures an application's functional and technical contract in structured Markdown, so the app can be understood, audited, and evolved from its documentation alone.

---

## Table of Contents

1. [What is SweetForge?](#1-what-is-sweetforge)
2. [The Spec Layer](#2-the-spec-layer)
3. [Templates Reference](#3-templates-reference)
4. [Commands Overview](#4-commands-overview)
5. [Typical Workflows](#5-typical-workflows)
6. [Command Reference](#6-command-reference)
7. [Consistency & Quality](#7-consistency--quality)
8. [Structural Index](#8-structural-index)
9. [Code-Side Commands](#9-code-side-commands)
10. [Best Practices](#10-best-practices)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. What is SweetForge?

SweetForge answers one question:

> **Can I describe this application well enough to regenerate it from its documentation alone?**

It provides:

- **Templates** — structured Markdown skeletons for every layer of the spec (application overview, features, components, data model).
- **Slash commands** — `sweetforge.*` commands that create, update, audit and consolidate the spec layer, either from a short description (greenfield) or by reverse-engineering an existing codebase.
- **Volatile note layer** — a dedicated folder for early-stage ideas and design notes that eventually get folded into the permanent spec.
- **Structural index** — a set of compact manifests (`.sweetforge/index/`) that cache the codebase's architecture so reverse-engineering commands run ~15x faster by reading manifests instead of raw source.
- **Consistency tooling** — cross-source and cross-file inconsistency detection, so the spec layer stays coherent as it grows.

---

## 2. The Spec Layer

### Two sources of truth

```
_specification/
├── Functional Architecture/          ← permanent spec layer
│   ├── functional-overview.md        ← app-wide overview (macro level)
│   ├── data-model.md                 ← consolidated data model
│   ├── <feature-slug-1>/
│   │   └── Functional Feature.md     ← one folder per feature
│   ├── <feature-slug-2>/
│   │   └── Functional Feature.md
│   └── ...
├── Components/                       ← permanent spec layer
│   ├── <component-slug-1>.md         ← one file per reusable component
│   ├── <component-slug-2>.md
│   └── ...
└── vibe coding/                      ← volatile layer (notes, ideas)
    ├── <idea-slug-1>.md
    └── ...
```

**Permanent spec layer** (`Functional Architecture/` + `Components/`) is the authoritative documentation of the app. It is versioned and audited.

**Volatile note layer** (`vibe coding/`) is where lightweight feature specs are drafted so they can be **fed directly to Plan mode**. A vibe note is not a final artifact: it captures an idea in a form that Plan mode can read directly to produce an implementation plan and then the actual code. Once the code exists, the permanent spec layer is re-derived from it (via `/sweetforge.feature -codeBase <feature>`), and the original vibe note becomes redundant — `/sweetforge.consolidate` then detects that its content has been absorbed into the permanent layer and proposes to remove it.

In other words, `vibe coding/` is a **bridge**, not a graveyard: notes are meant to live long enough to feed Plan mode and the subsequent spec re-derivation, then disappear.

### Templates layer

```
.sweetforge/
├── doc/
│   └── userguide.md                              ← You are here
├── index/                                        ← structural index (auto-generated)
│   ├── _meta.json                                ← commit hash, date, manifest metadata
│   ├── backend-entities.md                       ← Java entities, fields, enums
│   ├── backend-api.md                            ← REST endpoints, services
│   ├── frontend-pages.md                         ← pages, tabs, data fetching
│   ├── frontend-components.md                    ← reusable UI components, props
│   ├── frontend-hooks.md                         ← custom hooks, API surface
│   ├── frontend-lib.md                           ← API client, constants, types
│   └── packages.md                               ← sweet-* exports, structure
├── templates/
│   ├── Functional Architecture/
│   │   ├── Functional Overview.md                ← used by /sweetforge.overview
│   │   ├── Functional Feature.md                 ← used by /sweetforge.feature
│   │   ├── Functional Component.md               ← used by /sweetforge.component
│   │   └── Data Model.md                         ← used by /sweetforge.datamodel
│   ├── Technical Architecture/                   ← legacy templates, not automated
│   │   ├── Architecture Technique - Overview.md
│   │   ├── Architecture Technique - Backend.md
│   │   └── Architecture Technique - Frontend.md
│   └── API Reference/                            ← legacy template, not automated
│       └── API Reference.md
└── specs/                                        ← legacy output directory
```

**Active templates** are the four under `Functional Architecture/`. Every `sweetforge.*` command that writes to the spec layer loads one of them and follows its heading order exactly.

**Legacy templates** under `Technical Architecture/` and `API Reference/` are preserved for reference but are **not wired to any modern command**. They were used by retired commands (`/sweetforge.backend`, `/sweetforge.frontend`, `/sweetforge.synthesize`). Treat them as archive material — you can either delete them or fill them by hand if you need that level of documentation.

**Legacy output directory** `.sweetforge/specs/` also exists for historical reasons. All modern commands write to `_specification/` at the project root instead. Nothing reads from `.sweetforge/specs/` today.

---

## 3. Templates Reference

### Active templates (4)

| Template | Command | Produces | Scope |
|---|---|---|---|
| **Functional Overview.md** | `/sweetforge.overview` | `_specification/Functional Architecture/functional-overview.md` | Application (macro) |
| **Functional Feature.md** | `/sweetforge.feature` | `_specification/Functional Architecture/<feature>/Functional Feature.md` | One feature |
| **Functional Component.md** | `/sweetforge.component` | `_specification/Components/<component>.md` | One reusable component |
| **Data Model.md** | `/sweetforge.datamodel` | `_specification/Functional Architecture/data-model.md` | Consolidated entities |

Each template has a fixed heading structure. The command that consumes it MUST generate every chapter in the template, MUST preserve the heading order, and MUST replace placeholders with concrete values derived from the source (description or codebase).

### Legacy templates (not wired to any command)

| Template | Intended scope | Status |
|---|---|---|
| Architecture Technique - Overview.md | System-level technical view | unmaintained |
| Architecture Technique - Backend.md | Backend stack, layers, config | unmaintained |
| Architecture Technique - Frontend.md | Frontend stack, rendering, state | unmaintained |
| API Reference.md | REST endpoints catalog | unmaintained |

If you need any of these, fill them manually. There is no automated command that populates them today.

---

## 4. Commands Overview

SweetForge ships **11 slash commands**, grouped by purpose.

### Spec creation (4 commands)

| Command | Level | Main job |
|---|---|---|
| `/sweetforge.overview` | Application | Create or update the single application-wide overview |
| `/sweetforge.feature` | Feature | Create or update a feature spec (greenfield, reverse-engineering, or mass) |
| `/sweetforge.component` | Component | Create or update a reusable component spec |
| `/sweetforge.datamodel` | Data model | Consolidate every entity mentioned in specs into one data-model file |

### Volatile notes (1 command)

| Command | Purpose |
|---|---|
| `/sweetforge.vibe` | Create a lightweight feature spec under `_specification/vibe coding/` designed to be consumed by Plan mode |

### Spec maintenance / audit (3 commands)

| Command | Purpose |
|---|---|
| `/sweetforge.complete` | Enrich an existing spec by folding in answered open questions or merging content from sibling specs |
| `/sweetforge.consolidate` | Audit `vibe coding/` against the permanent spec layer; propose deletion or purge of absorbed notes |
| `/sweetforge.check` | Read-only health report: unresolved open questions + cross-file inconsistencies |

### Performance optimization (1 command)

| Command | Purpose |
|---|---|
| `/sweetforge.index` | Generate or refresh the structural index (`.sweetforge/index/`) so `-codebase` commands read compact manifests instead of raw source |

### Code-side helpers (2 commands)

| Command | Purpose |
|---|---|
| `/sweetforge.code.commit-message` | Generate a commit message from the current diff |
| `/sweetforge.code.quality` | Analyse the code of the front-end |

---

## 5. Typical Workflows

### A — Bootstrap from an existing codebase (reverse-engineering)

Use this when the application already exists and you want to produce documentation from scratch.

```
1. /sweetforge.index --full
     → parses the entire codebase (~28 000 lines) using parallel sub-agents
     → produces 7 compact manifests under .sweetforge/index/ (~1 800 lines)
     → all subsequent -codebase commands will read these manifests instead
       of re-parsing raw source, cutting token usage by ~15x

2. /sweetforge.overview -codebase "<short app description>"
     → reads the manifests (fast path), creates functional-overview.md
     → this is the root document; everything else references it

3. /sweetforge.feature -codeBase -all
     → reads the manifests once, then iterates over every requirement
     → for each, presents a confirmation list and asks "yes / adjust / abort"
     → on confirmation, writes one Functional Feature.md per requirement

4. /sweetforge.component -codeBase <component>
     → run once per reusable component you want documented in isolation
     → typical targets: sweet-gantt, DataTable, LivrableModal, etc.

5. /sweetforge.datamodel -codebase
     → reads backend-entities.md + frontend-lib.md manifests
     → produces the consolidated data-model.md

6. /sweetforge.check
     → read-only audit: flags unresolved [NEEDS CLARIFICATION], TBDs,
       cross-file inconsistencies, business-rule collisions
     → acts as the "am I done?" check
```

### B — Greenfield feature (new idea → vibe note → Plan mode → code → permanent spec)

Use this when you have an idea that does not exist in the codebase yet. The vibe note is the **bridge between the idea and Plan mode**: you draft it quickly, pass it to Plan mode, let Claude plan and implement the code, then re-derive the permanent spec from the resulting code.

```
1. /sweetforge.vibe <short idea>
     → creates _specification/vibe coding/<slug>.md
     → iterate on the note directly: refine the behavior, add rules,
       capture open questions and design decisions until the note is
       structured enough for Plan mode to produce a sensible plan

2. Open the vibe note in Plan mode
     → Plan mode reads the note and produces an implementation plan
     → review / adjust the plan, then let Claude implement it
     → after this step the feature's code exists in the codebase,
       but the permanent spec layer does not yet describe it

3. /sweetforge.feature -codeBase <feature>
     → reverse-engineers the freshly-written code
     → scans _specification/vibe coding/ as a first-class source: the
       original vibe note contributes design intent and rationale that
       the code alone cannot express
     → writes _specification/Functional Architecture/<slug>/Functional Feature.md
     → optionally triggers a /sweetforge.component spec if the feature
       references a specific reusable component

4. /sweetforge.consolidate
     → audits vibe coding/ against the permanent layer
     → detects that the vibe note has been absorbed (fully or partially)
     → proposes to delete it (fully absorbed) or purge it (partially —
       extract any remaining unique items into the run summary, then delete)

5. /sweetforge.check
     → final audit: no unresolved open questions, no cross-file
       inconsistencies introduced by the new spec
```

The whole cycle is what makes a vibe note a **bridge document**: it exists long enough for Plan mode to consume it and for the code to be implemented, then it dissolves once the permanent spec layer has captured everything it carried.

### C — Iterative maintenance

Day-to-day upkeep of the spec layer.

```
After code changes for a feature X:
  /sweetforge.index
    → incremental: re-indexes only the files changed since the last run
    → takes seconds instead of re-parsing the full codebase
  /sweetforge.feature -codeBase X
    → reads fresh manifests, re-derives the feature spec
    → detects any contradiction with the previous version
    → enriches in place (never silently overwrites)

After answering open questions in a spec:
  /sweetforge.complete -openQuestion @<spec_file>
    → folds the answers back into Scope, Business Rules, Acceptance Criteria
    → rewrites the Open Questions section as Resolved / Still open

Periodic health check (every sprint / before release):
  /sweetforge.check
    → lists all [NEEDS CLARIFICATION] / [TBD] markers
    → reports cross-file inconsistencies with severity (blocker / warning)
```

### D — Clean up the volatile layer

```
/sweetforge.consolidate
  → for each vibe note, checks if its information has been absorbed into
    the permanent spec layer (Functional Architecture + Components)
  → presents two sections:
      - Fully absorbed → "safe to delete" (with yes / no / select prompt)
      - Partially absorbed → per-file decision: keep / purge / delete / skip
  → purge = extract unique items into the final report output, then delete the file
  → delete = hard drop, unique items lost
```

---

## 6. Command Reference

### `/sweetforge.overview`

**Invocation**: `/sweetforge.overview [-codebase] <short application description>`

Creates or updates the single application-wide overview file. The output path is fixed: `_specification/Functional Architecture/functional-overview.md`.

- **No flag**: build the overview from the description alone (greenfield).
- **`-codebase`**: also analyse the existing codebase (reverse engineering) to describe what the application actually does today.

### `/sweetforge.feature`

**Invocation**: `/sweetforge.feature [-codeBase [-all] | -new] <short feature description>`

Creates or updates feature-level specs.

| Mode | Behavior |
|---|---|
| `/sweetforge.feature -new <desc>` | Greenfield feature spec, no code scanning |
| `/sweetforge.feature <desc>` | Alias of `-new` |
| `/sweetforge.feature -codeBase <desc>` | Single-feature reverse engineering: matches the description against the overview + source code + `vibe coding/` notes + existing specs, detects inconsistencies, asks for confirmation, then writes one `Functional Feature.md` + optionally one `Functional Component.md` if a specific/complex component is involved |
| `/sweetforge.feature -codeBase -all` | Mass reverse engineering: iterates over **every** requirement in `functional-overview.md`, presents the full list for confirmation, then processes each one. **`-all` cannot be combined with a focus description.** |

**Output**: `_specification/Functional Architecture/<feature-slug>/Functional Feature.md` (+ optionally `_specification/Components/<component-slug>.md`).

### `/sweetforge.component`

**Invocation**: `/sweetforge.component [-codeBase] <component name>`

Creates or updates a single component spec in isolation. Unlike `/sweetforge.feature` (which produces a component spec as a side effect), this command is **component-first**: no feature spec is ever produced.

- **No flag**: greenfield component spec from the description.
- **`-codeBase`**: reverse-engineer from the source code — captures props, events, exported types, internal state, peer dependencies, and every caller. Also checks existing feature specs for references to the component.

**Output**: `_specification/Components/<component-slug>.md`.

**Key rule**: before finalizing the slug, the command checks whether the component is already documented under a slightly different slug (`sweet-releaseGrid.md` vs `sweet-release-grid`) and reuses the existing slug to avoid fragmentation.

### `/sweetforge.datamodel`

**Invocation**: `/sweetforge.datamodel [-codebase]`

Consolidates entity/data-model information from **every** spec file under `Functional Architecture/` and `Components/` into a single `data-model.md`. Never invents entities — only merges what is already declared in the specs.

- **No flag**: consolidate from specs only.
- **`-codebase`**: also cross-reference against backend Java entities (classes extending `BaseEntity`, annotated with `@Data` / `@SuperBuilder`) and against TypeScript types / interfaces / enums. Entities that exist in code but are not yet documented in any spec are surfaced as "code-only" and added to the output with a warning.

**Output**: `_specification/Functional Architecture/data-model.md`.

**Authority order on contradictions**: `functional-overview.md` > code (if `-codebase`) > feature spec > component spec. Every contradiction is reported in the final summary, never silently resolved.

### `/sweetforge.index`

**Invocation**: `/sweetforge.index [--full]`

Generates or refreshes the **structural index** — a set of 7 compact manifest files under `.sweetforge/index/` that capture the codebase's architecture (entities, routes, pages, components, hooks, types, packages) in a format ~15x smaller than the raw source.

- **No flag** (default): **incremental** mode. Reads `_meta.json` to find the last indexed commit, runs `git diff` to detect which files changed, and re-indexes only the affected manifests. If nothing changed since the last run, reports "up to date" and stops.
- **`--full`**: forces a complete re-index of all source directories, regardless of what changed. Use this after a major merge, rebase, or when `_meta.json` is missing or corrupt.

**Output**: 7 manifest files + `_meta.json` under `.sweetforge/index/`.

| Manifest | What it captures |
|---|---|
| `backend-entities.md` | Java model classes, fields, types, annotations, enums |
| `backend-api.md` | Controllers: routes, HTTP methods, params, response types; service signatures |
| `frontend-pages.md` | Pages, tabs, data fetching patterns, navigation, route structure |
| `frontend-components.md` | Reusable components, props API, consumers |
| `frontend-hooks.md` | Custom hooks, API surface, state shape, consumers |
| `frontend-lib.md` | API client catalog, constants, utility functions, TypeScript type declarations |
| `packages.md` | sweet-* package exports, internal structure, dependencies, props |

**How other commands use it**: every `-codebase` command (`overview`, `feature`, `component`, `datamodel`, `code.quality`) checks `_meta.json` before parsing raw source. If the index is fresh (no source files changed since the last indexed commit), the command reads the manifests directly — skipping raw source parsing entirely. If some files changed, it reads the manifests for unchanged scopes and parses only the delta. If the index does not exist, it falls back to full source parsing and suggests running `/sweetforge.index` first.

**Parallelization**: uses up to 7 `Explore` sub-agents in parallel (one per manifest scope), so a full index of ~28 000 lines of source code completes in a single pass.

**When to run it**:

| Trigger | Mode |
|---|---|
| First time setting up SweetForge on an existing codebase | `--full` |
| After a major merge or rebase | `--full` |
| Before running any `-codebase` command after code changes | (default — incremental) |
| After pulling from a remote | (default — incremental) |

**Graceful degradation**: the index is an optimization, not a requirement. Every command works without it — just slower and more token-intensive.

---

### `/sweetforge.vibe`

**Invocation**: `/sweetforge.vibe <short idea>`

Creates a lightweight spec file under `_specification/vibe coding/<feature-slug>.md` from a short idea. Uses the `_specs/template.md` template (lighter than the functional feature template), in a format **designed to be read directly by Plan mode** so Claude can turn the idea into an implementation plan and then into code.

**Role in the workflow**: a vibe note is a **bridge document**, not a permanent spec. Its lifecycle is:

```
draft (via /sweetforge.vibe)
   ↓
passed to Plan mode → Claude plans and implements the code
   ↓
permanent spec re-derived from the code (via /sweetforge.feature -codeBase)
   ↓
vibe note becomes redundant
   ↓
deleted or purged (via /sweetforge.consolidate)
```

See [Workflow B](#b--greenfield-feature-new-idea--vibe-note--plan-mode--code--permanent-spec) in §5 for the full step-by-step.

### `/sweetforge.complete`

**Invocation**: `/sweetforge.complete [-openQuestion] [-files <list>] <target spec file>`

Enriches an existing spec file in place. Two independent modes, combinable in one run:

- **`-openQuestion`**: scans the `Open Questions` section of the target file, detects questions that have been answered inline (`=> answer`, `→ answer`, `Answer: ...`), and folds them back into the relevant chapters (Scope, Business Rules, Acceptance Criteria) with cross-references. Rewrites the Open Questions section into `Resolved (for reference)` / `Still open` sub-sections.
- **`-files <list>`**: merges content from one or more sibling spec files into the target, harmonizing vocabulary and avoiding duplication.

**When to use**: after answering open questions manually, run this command to fold them back into the permanent structure of the spec.

### `/sweetforge.consolidate`

**Invocation**: `/sweetforge.consolidate` (no arguments)

Audits the `_specification/vibe coding/` folder against the permanent spec layer (Functional Architecture + Components) and proposes cleanup.

For every vibe file, the command:
1. Decomposes the file into atomic information items (bullets, decisions, rules, questions).
2. For each item, checks semantically whether the equivalent information is already captured in a permanent spec.
3. Classifies the file as `fully_absorbed`, `partially_absorbed`, `not_absorbed`, or `empty`.

Then it asks two decisions:

**Decision 1 — fully absorbed files**: `yes / no / select` → deleted if confirmed.

**Decision 2 — partially / not absorbed files** (per file): `keep / purge / delete / skip`.
- `keep` — leave intact
- `purge` — extract the still-unique items into the final command output, then **delete** the source file. The items are preserved in the terminal output for manual relocation into the relevant spec.
- `delete` — hard drop, unique items lost
- `skip` — defer the decision

**Strictly read-only on the permanent layer.** The command only mutates files under `vibe coding/`.

### `/sweetforge.check`

**Invocation**: `/sweetforge.check` (no arguments)

**Strictly read-only** audit of the spec layer. Never creates, modifies, renames, or deletes any file. Two independent audits run in a single pass:

**Audit 1 — Open questions**: scans every spec file for `[NEEDS CLARIFICATION]`, `[TBD]`, `[TODO]`, `[FIXME]`, `[WIP]`, `[PLACEHOLDER]`, unresolved Open Questions sub-sections, and dangling BR references.

**Audit 2 — Cross-file inconsistencies**: compares every pair of specs using the 6-category inconsistency catalog (behavioral, structural, scope, business rules, naming drift, existence) plus two spec-specific checks (cross-reference breakage, dangling type references, BR numbering collisions). Reports blocker/warning severity.

**Output**: structured report in the chat, with three sections (Open questions, Inconsistencies, Suggested next steps).

> **Note**: the two code-side commands (`/sweetforge.code.commit-message` and `/sweetforge.code.quality`) are documented in their own section — see [§8 Code-Side Commands](#8-code-side-commands).

---

## 7. Consistency & Quality

The family shares a common **consistency check** policy across the reverse-engineering and audit commands (`/sweetforge.feature -codeBase*`, `/sweetforge.component -codeBase`, `/sweetforge.datamodel -codebase`, `/sweetforge.check`).

### The 6 inconsistency categories

| Category | Example | Default severity |
|---|---|---|
| **Structural** | Overview says `pourcentage: int 0-100`, code has `BigDecimal`, spec says `string` | `blocker` |
| **Behavioral** | Overview says "drag-over auto-scrolls", code has no auto-scroll sensor | `blocker` |
| **Scope** | One source lists a capability in-scope, another lists it out-of-scope | `blocker` |
| **Business-rule** | Same RG-XX paraphrased differently, or enforced in one file but not another | `blocker` |
| **Naming drift** | `livrable` vs `deliverable`, `onToggleDay` vs `onDateToggle` | `warning` |
| **Existence** | Source A references a field/endpoint that source B explicitly denies | `blocker` |

Two extra categories apply to `/sweetforge.check`:
- **Cross-reference breakage** — a link to `BR-XX` / `UC-XX` / a sibling spec file that no longer exists.
- **BR numbering collision** — two specs both define `BR-07` with different content.

### Matching rules

- **Semantic, not lexical.** Same concept expressed with different wording counts as a match (so `livrable` absorbs `deliverable`).
- **Omission is not a contradiction.** If spec A describes a field and spec B simply does not mention it, that is an omission — not flagged. Only explicit denial counts.
- **Rationale matters.** A business rule captured without its "why" does not absorb a note that explains the "why" — the rationale remains unabsorbed.

### Never silently resolve

Every command that detects an inconsistency:
1. **Reports it to the user** — either in the confirmation summary (before writing) or in the final run summary (after writing).
2. **Encodes blockers into the written spec** as `[NEEDS CLARIFICATION: <concern> — <source_a> says X, <source_b> says Y]` markers inside the chapter concerned. This guarantees that the contradiction stays visible in the final document and cannot be forgotten.
3. **Never picks a winner silently**, even when an authority order would allow it.

### Acting on inconsistencies

| Finding | Recommended action |
|---|---|
| `[BLOCKER]` structural | Re-derive the contradicted chapter from the code via `/sweetforge.feature -codeBase <feature>` |
| `[BLOCKER]` business rule | Edit the losing file manually to align it with the winning source |
| `[WARN]` naming drift | Normalize vocabulary across files — there's no autofix |
| Dangling `[NEEDS CLARIFICATION]` | Answer the question inline in the source file, then run `/sweetforge.complete -openQuestion @<file>` to fold it back |

---

## 8. Structural Index

The structural index is a **caching layer** between the raw source code and the SweetForge commands that consume it. It solves a practical problem: every `-codebase` command needs to read and understand the codebase, but the codebase is large (~28 000 lines across 249 files) and mostly stable between runs.

### The problem without an index

```
/sweetforge.overview -codebase
  → reads ~28 000 lines of source code
  → extracts ~2 000 lines of structural information
  → writes 1 overview spec

(user edits 3 files)

/sweetforge.feature -codebase "milestones"
  → reads ~28 000 lines of source code again (only 3 changed)
  → extracts structural information again
  → writes 1 feature spec
```

Every run re-parses everything from scratch. The token cost and execution time are proportional to the full codebase size, not to the delta.

### The solution with an index

```
/sweetforge.index --full          ← once: parses 28 000 lines, writes 7 manifests (~1 800 lines)

/sweetforge.overview -codebase    ← reads 1 800 lines of manifests (fast path)

(user edits 3 files)

/sweetforge.index                 ← incremental: re-parses only the 3 changed files
/sweetforge.feature -codebase "milestones"  ← reads fresh manifests (fast path)
```

Token consumption drops by ~15x. Execution is faster because manifests are compact and pre-structured.

### What the manifests capture vs. don't capture

**Captured** (structural, stable):
- Entity names, fields, types, relationships, enums
- REST endpoints with methods, paths, params, response types
- Page/tab tree with data fetching patterns
- Component props APIs and consumer lists
- Hook signatures and state shapes
- Package exports and dependencies

**Not captured** (requires reading raw source):
- Internal algorithm implementations
- Complex business logic in service methods
- Bugs, code smells, or quality issues at the line level
- JSX template details

For most commands, the manifests are sufficient. For deep-dive scenarios (e.g., `/sweetforge.code.quality` reviewing a specific file), the command reads the manifest as a structural map and then spot-reads individual files for detail.

### Freshness guarantee

Every manifest file starts with a header showing when it was last generated:

```markdown
<!-- Auto-generated by /sweetforge.index — do not edit manually -->
<!-- Last indexed: 2026-04-12T18:30:00Z | Commit: 4b80559 | Mode: full -->
```

The `_meta.json` file stores the commit hash. Consuming commands run `git diff --name-only <lastIndexCommit>..HEAD` to verify freshness before trusting the manifests.

### When the index is stale

If source files changed since the last index, consuming commands have three options:
1. **Hybrid path** — read manifests for unchanged scopes, parse only the changed files directly.
2. **Suggest refresh** — append *"Tip: run `/sweetforge.index` first for faster execution."*
3. **Fall back** — parse raw source for everything (current behavior, always works).

The index never causes incorrect output — at worst it causes a command to fall back to slower full parsing.

---

## 9. Code-Side Commands

Two commands in the `sweetforge.*` family operate **on the source code** rather than on the spec layer. They are grouped under the `sweetforge.code.*` namespace to make the separation explicit: they never read from or write to `_specification/`, and they never modify spec templates.

| Command | Purpose | Reads | Writes |
|---|---|---|---|
| `/sweetforge.code.commit-message` | Generate a conventional commit message from staged changes | `git status`, `git diff --staged` | Proposes a message; commits only on user approval |
| `/sweetforge.code.quality` | Senior-level code review of the front-end | front-end sources (pages, components, hooks, libs, types, i18n) | A Markdown review report under `_reviews/` |

### `/sweetforge.code.commit-message`

**Invocation**: `/sweetforge.code.commit-message`

**What it does**:
1. Runs `git status` and `git diff --staged` to inspect what is currently staged.
2. Analyzes the diff and drafts a commit message that:
   - Uses the present tense.
   - Explains **why** the change was made, not just **what** changed.
   - Picks a conventional type prefix with an emoji (see table below).
3. Shows the summary of staged changes plus the proposed commit message to the user.
4. **Asks for confirmation before committing.** Never auto-commits.

**Commit types**:

| Emoji | Type | Meaning |
|---|---|---|
| ✨ | `feat:` | New feature |
| 🐛 | `fix:` | Bug fix |
| 🔨 | `refactor:` | Refactoring code |
| 📝 | `docs:` | Documentation |
| 🎨 | `style:` | Styling / formatting |
| ✅ | `test:` | Tests |
| ⚡ | `perf:` | Performance |

**Format**:

```
<emoji> <type>: <concise_description>
<optional_body_explaining_why>
```

**Typical flow**:
```
1. git add <files>
2. /sweetforge.code.commit-message
   → command reads the staged diff
   → proposes: "✨ feat: add drag-and-drop to release grid
               Releases can now be reorganized visually rather than via the edit modal."
   → asks: "commit? (yes/no)"
3. yes → command runs `git commit -m "..."`
   no  → nothing happens; you can refine the staged set and re-run
```

### `/sweetforge.code.quality`

**Invocation**: `/sweetforge.code.quality`

**What it does**: performs a **comprehensive, senior/staff-level code review** of the front-end codebase and writes the output to a file under `_reviews/`. No automatic refactoring — the command only observes and recommends.

**Scope**:

| In scope | Out of scope |
|---|---|
| Pages, components, hooks, libs, types, i18n files | Backend Java code |
| Pattern consistency across the codebase | Adding new features or changing behavior |
| Performance and maintainability concerns | Automated test coverage (none exist today) |
| | Third-party library upgrades |

**Analysis categories** — the review walks through every category below and produces findings per category:

- **Architecture & code organization** — folder structure, separation of concerns, modularity, adherence to patterns (hooks, services, etc.), component reusability.
- **Separation of concerns** — are components, pages, hooks, services, utilities, types and styles properly separated?
- **Component decomposition** — are components at the right level of granularity? Over-large, over-coupled, or not reusable enough?
- **Feature-based vs technical organization** — would a domain-based structure serve the project better than a purely technical one?
- **Code quality** — readability, naming, unnecessary complexity, code duplication (DRY), lint / formatting conventions, dead code.
- **Comments & documentation** — are components, props, state, and complex hooks clearly commented (with a beginner-friendly bias)?
- **Performance** — unnecessary re-renders, missing memoization, redundant API calls, bundle size, lazy loading, image optimization, proper hook usage.
- **UI / UX** — visual consistency, accessibility (ARIA, keyboard, contrast), responsive design, feedback (loading, error, empty states).
- **Security** — XSS / injection protection, sensitive-data handling, client-side input validation, token / storage hygiene.
- **Data handling & API integration** — API call structure, error and loading handling, caching, separation between business logic and UI.
- **Tooling & dependencies** — library relevance, unused or outdated deps, build / env configuration.
- **State and data flow** — where do state, API calls, and business logic live? Suggest a better organization.
- **Scalability & maintainability** — will the current structure hold as the app grows? Risks, bottlenecks, technical debt.

**Output format**:
- Structured analysis by category.
- Concrete examples from the actual codebase (with file paths).
- **Severity level** for each issue: `low` / `medium` / `critical`.
- Actionable recommendation — including a proposed target directory structure when refactoring is suggested.
- A final summary with **priorities**.

**Output file**: saved under `_reviews/` as a Markdown document. Re-running the command produces a new review file — older reviews are preserved so you can track how quality evolves over time.

**When to run it**:
- Before a release, as a quality gate.
- After a big feature is merged, to catch pattern drift.
- Periodically (every few sprints) to surface slow-accumulating tech debt.

**Edge cases to keep in mind when reading the report**:
- Some apparent duplication may be intentional (similar-but-subtly-different logic per page).
- Performance optimizations should be weighed against readability — not every re-render is a problem.
- Fixing one pattern inconsistency may cascade across many files — evaluate the blast radius before acting.

### Relationship to the spec layer

These two commands are intentionally **separate** from the spec-management family. They do not touch `_specification/`, do not read templates, and do not participate in the consistency check across specs. Their namespace prefix (`sweetforge.code.`) reflects this: they are code-side tools that happen to live in the same command family for convenience, not part of the documentation pipeline itself.

If you want a quality signal on the **spec layer** rather than on the code, use `/sweetforge.check` instead — it plays a similar "health report" role for the permanent spec documents.

---

## 10. Best Practices

### Choose the right command for the right level

| If you're thinking about... | Use |
|---|---|
| "What is this application, at a macro level?" | `/sweetforge.overview` |
| "How does this feature behave?" | `/sweetforge.feature` |
| "What is the contract of this reusable component?" | `/sweetforge.component` |
| "What are all the entities and their relationships?" | `/sweetforge.datamodel` |
| "I have a rough idea, I want to dump it somewhere" | `/sweetforge.vibe` |
| "Is my spec layer healthy?" | `/sweetforge.check` |

### Treat `vibe coding/` as a bridge, not a graveyard

A vibe note has a well-defined lifecycle: **draft → Plan mode → code → re-derived spec → deletion**. Respect each step:

- **Draft freely** at the start — refine the idea until the note is structured enough that Plan mode can turn it into a sensible implementation plan.
- **Feed the note to Plan mode** — this is its primary purpose. A vibe note that never reaches Plan mode is a vibe note that has not served its role.
- **Re-derive the permanent spec** after Plan mode has implemented the code: run `/sweetforge.feature -codeBase <feature>` so the `Functional Feature.md` reflects what now exists in the codebase, enriched by the rationale and intent captured in the vibe note.
- **Retire the note** with `/sweetforge.consolidate` once its content has been absorbed. **A vibe note that has already been absorbed should not survive** — it's an intermediate artifact, not a document.

If a note was drafted but the idea turned out to be wrong, just delete it. There is no requirement that every vibe note eventually produce code.

### Respect the confirmation flow

Every `-codeBase*` command **pauses** for a `yes / adjust / abort` confirmation after gathering sources but **before** writing. Read the summary carefully:
- If `Inconsistencies detected` shows blockers, weigh whether to `abort` and fix the sources, or to `yes` and have them encoded as `[NEEDS CLARIFICATION]` in the output.
- `adjust` lets you redirect the search (different feature, different files) without aborting entirely.

### Re-run `/sweetforge.check` before shipping

Before a release, run `/sweetforge.check`. Zero open questions + zero blocker inconsistencies is the target. Warnings (naming drift, soft disagreements) are acceptable but worth reviewing.

### Keep the index fresh

Run `/sweetforge.index` (incremental) before any `-codebase` command session. It only re-parses files that changed since the last run — typically a few seconds. After a major merge or rebase, run `/sweetforge.index --full` to rebuild from scratch. Every `-codebase` command will remind you if the index is missing or stale.

### Keep specs in sync with code

| When | Action |
|---|---|
| A feature's code changes significantly | `/sweetforge.index` then `/sweetforge.feature -codeBase <feature>` |
| A component's API changes | `/sweetforge.index` then `/sweetforge.component -codeBase <component>` |
| A new entity is added to the backend | `/sweetforge.index` then `/sweetforge.datamodel -codebase` |
| An open question was answered inline | Run `/sweetforge.complete -openQuestion @<file>` |

### Vocabulary hygiene

Pick one term per concept at the app level and stick to it across every spec (e.g. `livrable` OR `deliverable`, not both). `/sweetforge.check` flags terminology drift as a warning — use it as a linter.

---

## 11. Troubleshooting

### "`$SPEC_FUNCTIONAL_DIR` is empty or missing"

You are trying to run a command that reads from `_specification/Functional Architecture/`, but the folder is empty. Start with `/sweetforge.overview` (and probably `/sweetforge.feature -codeBase -all`) first.

### "`-all` and a focus description are mutually exclusive"

You tried `/sweetforge.feature -codeBase -all <something>`. `-all` processes **every** requirement in the overview and cannot be combined with a focus description. Use either:
- `/sweetforge.feature -codeBase <focus>` — single feature
- `/sweetforge.feature -codeBase -all` — every requirement (no extra text)

### A command wrote to the wrong file

All modern commands have **fixed output paths** declared in a `## Paths` block at the top of each command file. If the output seems wrong, open the command file under `.claude/commands/sweetforge.*.md` and verify the `Paths` variables — they are the single source of truth for output locations.

### `[NEEDS CLARIFICATION]` markers keep piling up

This is normal during reverse engineering. Resolve them one by one:
1. Open the spec file, find the `[NEEDS CLARIFICATION: ...]` marker.
2. Answer the question inline on the same line (after a `=>`, `→`, or `Answer:`).
3. Run `/sweetforge.complete -openQuestion @<file>` to fold the answer back into the relevant chapter.
4. Run `/sweetforge.check` to verify the marker is gone.

### A spec file contradicts the code

Run `/sweetforge.feature -codeBase <feature>` (or `/sweetforge.component -codeBase <component>`). The command will detect the contradiction, surface it in the confirmation summary, and — if you proceed — rewrite the contradicted chapter from the code while encoding the old value as a `[NEEDS CLARIFICATION]` marker. You then decide which side is right.

### "Tip: run `/sweetforge.index` first for faster execution"

A `-codebase` command printed this because `.sweetforge/index/_meta.json` was missing or stale. Run `/sweetforge.index` (or `/sweetforge.index --full` for first-time setup) and re-run the command. The index is an optimization — the command still works without it, just slower.

### The index seems outdated after a rebase or force-push

If `_meta.json` references a commit that no longer exists in the history (e.g. after `git rebase`), `/sweetforge.index` will detect this and automatically fall back to a full rebuild. You can also force it explicitly with `/sweetforge.index --full`.

### A vibe note is stale but I'm not sure what's been absorbed

Run `/sweetforge.consolidate`. It will classify every note as fully / partially / not absorbed and show you exactly which permanent spec files capture which items. You can then delete, purge, or keep each note with an informed decision.

### The command I remember is gone

Several commands have been retired or renamed as the family evolved:

| Retired / renamed | Current equivalent |
|---|---|
| `/sweetforge.backend` | *(no direct replacement — use `/sweetforge.overview -codebase` + `/sweetforge.feature -codeBase -all` + `/sweetforge.datamodel -codebase`)* |
| `/sweetforge.frontend` | *(same as above)* |
| `/sweetforge.synthesize` | *(rolled into the commands above; cross-consistency is handled by `/sweetforge.check`)* |
| `/sweetforge.specFromCodeBase` | `/sweetforge.feature -codeBase -all` |
| `/sweetforge.spec` | `/sweetforge.feature` (renamed) |
| `/sweetforge.componentFromCodeBase` | `/sweetforge.component` (renamed) |

### Legacy directories

- `.sweetforge/specs/` — legacy output directory from retired scan commands. Nothing reads or writes here today. You can delete it if you don't need the historical artifacts.
- `.sweetforge/templates/Technical Architecture/` and `.sweetforge/templates/API Reference/` — legacy templates, not wired to any modern command. Keep them if you plan to fill them by hand; delete them otherwise.
