# Naviro M1 status

Last updated: 2026-08-23.

## Project

- Product: Naviro
- Repository: `TuanTAg/naviro-desktop`
- Milestone: M1 — Naviro Workbench
- Authorized scope: Phase 0–2 only
- Working branch: `codex/naviro-m1-phase-0-2`
- Overall status: implementation in progress; CI evidence pending

## Phase overview

| Phase | Status | Evidence |
|---|---|---|
| 0 — Orca Baseline | Implemented, validation pending | Baseline/remotes/toolchain/build procedure recorded; sandbox package install blocked by restricted network |
| 1 — Naviro Desktop Shell | Implemented, validation pending | Naviro title/shell/navigation and Orca workbench bridge added |
| 2 — Multi-root Workspace | Implemented, validation pending | Model, persistence, root manager, Explorer, search, Git/terminal bridges, tests and E2E added |
| 3+ | Blocked by scope | No server, mobile, connector, memory, gateway, or backend automation work started |

## Baseline

`main`, `origin/main`, and `upstream/main` were verified at `063b8042988bd4c7df1f7acf08949b36be082e04`. The merge base with `upstream/main` was the same commit. The initial worktree was clean.

## Validation

| Target | Status | Evidence |
|---|---|---|
| Dependency install | Blocked locally | Registry request disconnected under sandbox network policy |
| Typecheck | Pending CI | PR `typecheck` job |
| Unit tests | Pending CI | PR `test` matrix and focused Naviro specs |
| Lint/static analysis | Pending CI | PR `static analysis` job |
| Linux desktop package | Pending CI | PR `package` job |
| Windows package | Pending CI | PR `package (Windows)` job |
| Electron E2E | Pending CI | `tests/e2e/naviro-workspace.spec.ts` |

No target is marked passing without runner evidence.

## Architecture decisions

- Multi-root is a Naviro catalog above Orca repo/worktree models.
- Stable workspace/root IDs are random and not path-derived.
- Portable documents use schema version 1; runtime bindings remain optional.
- Catalog persistence uses renderer local storage; portable save uses the existing filesystem download API.
- Root registration, filesystem access, editor, terminal, Git, and folder selection reuse existing Orca boundaries.
- Read-only roots open read-only editor tabs and cannot open terminals.
- Root removal is logical only and never removes an Orca project or disk content.
- Product UI identity changes do not rename Orca protocols, environment variables, helpers, executables, or update channels during M1.

## Known constraints and debt

- M1 has no UI for creating a new remote root; imported remote metadata can retain existing Orca bindings. This avoids a new SSH/wire contract in Phase 2.
- The app/package executable identity remains Orca for compatibility; wider productization is deferred.
- The dedicated `$electron` UI skill named by `AGENTS.md` was unavailable in this session. The implementation uses repository Playwright/Electron CI as the verification path.
- CI results and the final Phase 0–2 severity review must be appended before M1 is accepted.

## Next action

Run the PR matrix, fix all M1-blocking findings, update this evidence, produce `PHASE_0_2_REVIEW.md`, and stop.
