# Naviro project status

Last updated: 2026-08-24.

## Executive summary

- Product: Naviro
- Repository: `TuanTAg/naviro-desktop`
- Current milestone: M1 — Naviro Workbench
- Completed implementation scope: Phase 0–2
- Integration status: merged into `main` through [PR #1](https://github.com/TuanTAg/naviro-desktop/pull/1)
- Acceptance status: review gate; one E2E stability follow-up and the final Phase 0–2 review record remain
- Phase 3 status: not started and not yet authorized

Phase 0–2 delivered the Naviro Desktop foundation without introducing Naviro Server, new backend services, mobile clients, connectors, memory, or application-domain backends.

## Phase overview

| Phase | Status | Evidence |
| --- | --- | --- |
| 0 — Orca Baseline | Complete | Baseline, remotes, pinned toolchain, build procedure, upstream strategy, and patch ledger recorded |
| 1 — Naviro Desktop Shell | Complete | Naviro identity, product navigation, localization, and bridge to existing Orca capabilities merged |
| 2 — Naviro Multi-root Workspace | Complete, review follow-up open | Workspace model, persistence, import/export, root manager, Explorer, root-aware search, Git/terminal bridges, read-only policy, unit tests, and Electron E2E merged |
| 3 — Naviro Server / Work Service Foundation | Not started; approval required | Standalone server/API boundary is the next proposed phase |
| 4+ | Planned only | Assistant, tasks/projects/notes, AI Gateway, orchestration, automation, connectors, memory, remote workers, mobile, security, and productization remain deferred |

## Integration record

- Starting Orca baseline: `063b8042988bd4c7df1f7acf08949b36be082e04`
- Final PR source commit: `fe58c3cb6ae46ee5cdedf7d7bfad67081a505021`
- Merge commit on `main`: `a6cc18911bd7667e749d701ae982599adfce1a1e`
- PR merged: 2026-08-24
- Changed files in PR: 40
- Phase 3+ implementation included: none

## Delivered M1 capabilities

### Phase 0 — baseline and governance

- Verified `origin`, `upstream`, and merge-base relationship.
- Pinned Node.js 24 and pnpm 10.24.0.
- Documented clean setup, validation, packaging, and upstream synchronization.
- Kept Naviro changes isolated and recorded direct Orca-core seams.

### Phase 1 — Naviro desktop shell

- Added Naviro desktop title and work-oriented navigation.
- Added Home, Assistant, Inbox, Tasks, Notes, Projects, Automations, Agents, Files, Git, and Terminal entry points.
- Preserved access to Orca editor, terminal, Git, worktrees, SSH, tools, settings, and agents.
- Kept future server-backed application surfaces as placeholders.

### Phase 2 — multi-root workspace

- Creates, imports, saves, reopens, and persists named Naviro workspaces.
- Groups unrelated local folder and Git roots without moving or copying them.
- Preserves stable workspace/root IDs independent of paths.
- Renders separate top-level Explorer roots.
- Searches selected roots while retaining `rootId` in results.
- Opens terminals at the selected writable root.
- Activates Source Control for one selected Git root; no aggregate Git state.
- Enforces read-only editor and terminal policy.
- Handles duplicate, missing, unbound, Windows, and POSIX paths.
- Adds no new IPC, SSH, or remote-wire contract.

## Validation evidence

The Work Mode environment could not complete a clean local dependency install because registry access was restricted. GitHub Actions is therefore the authoritative validation environment.

| Target | Result | Evidence |
| --- | --- | --- |
| Root-directory guard and PR LoC check | Pass | Final PR run |
| Lint and static analysis | Pass | Native, type-aware, React Doctor, localization, reliability, and max-lines gates |
| Typecheck | Pass | Full TypeScript project matrix |
| Unit tests | Pass | Node.js 24 and Node.js 26 shards |
| Git compatibility | Pass | Baseline Git binary compatibility matrix |
| Remote-wire compatibility | Pass | Mixed-version client/server journey |
| Linux package | Pass | Package build and smoke checks |
| Windows package | Pass | Windows-specific boundaries, package build, and CLI smoke check |
| Focused Naviro Electron E2E | Pass on code commit; one later retry timed out | Full PR checks passed at `cadbc7bdf`; the README-only run at `fe58c3cb` timed out while clicking “Create workspace”, while the second Naviro scenario passed |
| Windows NSIS installer | Pass | Dedicated Windows workflow built and uploaded the installer and checksum |

The last PR run contained 49 jobs: 46 passed, 2 were skipped, and 1 focused Electron E2E job failed on a pointer-actionability timeout. This is tracked as an M1 test-stability follow-up because:

- the same E2E suite passed on the preceding code commit;
- the later commit changed only `README.md`;
- lint, typecheck, unit tests, Linux packaging, Windows packaging, Git compatibility, and wire compatibility all remained green.

M1 should not be described as having a fully green final-head CI run until this E2E case is rerun successfully or made deterministic.

## Windows installer

- Workflow run: [Naviro Windows Installer](https://github.com/TuanTAg/naviro-desktop/actions/runs/32626809484)
- Artifact source commit: `cadbc7bdff3b888be675403c6be92c14829f8fcb`
- Package: unsigned NSIS installer for Windows x64
- Installer filename: `orca-windows-setup.exe`
- Installer size: 176,088,906 bytes
- Installer SHA-256: `70e8f0d0f95b843132904cad331df785359449e25a095f236b93d4f7b8b6b68b`
- Verified delivery ZIP SHA-256: `43e4e33209f3d5ff7b36c8e5e25538eab047f9c4dff995f665728bff94341f59`

The executable/package identity remains Orca and the installer is unsigned during M1. Full Naviro package identity, signing, icons, update channels, and public release handling are deferred to productization.

## Architecture decisions

- `NaviroWorkspace` remains an aggregation layer above Orca repo/worktree/folder workspace models.
- `FolderWorkspace.folderPath` remains single-root.
- Stable workspace/root IDs are random and not path-derived.
- Portable workspace documents use schema version 1.
- Runtime bindings remain optional and execution-host aware.
- Explorer, search, terminal, Git, and editor operations reuse existing Orca boundaries.
- Read-only roots cannot open mutating terminals.
- Root removal is logical only and never removes user projects or disk content.
- The invariant remains: `context root != Git root != write root`.

## Known constraints and follow-ups

- Rerun or stabilize the “creates and reopens a named workspace” Electron E2E interaction.
- Produce the final `PHASE_0_2_REVIEW.md` severity review before formally accepting M1.
- M1 has no UI for creating a new remote root; imported remote metadata may retain existing Orca bindings.
- Tasks, notes, inbox, assistant, and automation entries do not yet have Naviro backends.
- The app/package identity remains Orca and the installer is unsigned.
- `naviro-server` and `naviro-mobile` repositories have not been created.

## Next proposed phase

### Phase 3 — Naviro Server / Work Service Foundation

Status: **not started — explicit owner approval required**.

Phase 3 should create a standalone Naviro service/API boundary and connect Naviro Desktop to it. The first increment should remain narrow:

- create the `naviro-server` repository only after Phase 3 is approved;
- establish the service skeleton, configuration, health/version endpoints, and API versioning;
- define the Desktop ↔ Server API/WebSocket boundary;
- provide the minimum persistence and local-first runtime foundation required by later features;
- document development, deployment, security assumptions, and compatibility rules.

Phase 3 should not yet implement the full assistant, tasks/projects/notes, AI Gateway, agent orchestrator, automations, connectors, durable memory, remote workers, or mobile client. Those belong to later phases after the server contract is stable.

`naviro-mobile` should not be created during the Phase 3 foundation. It remains deferred until the server API is sufficiently stable.

## Phase 3 entry gate

Before starting Phase 3:

1. rerun or fix the remaining Electron E2E timeout;
2. complete the Phase 0–2 review record;
3. record owner acceptance of M1;
4. explicitly authorize creation of `naviro-server` and Phase 3 implementation.

Until those conditions are met, implementation remains stopped after Phase 2.
