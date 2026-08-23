# M1 Definition of Done

## Phase 0 — Orca baseline

- [x] Exact fork and upstream baseline recorded.
- [x] `origin`/`upstream` strategy documented and configured locally.
- [x] Clean checkout, pinned toolchain, native prerequisites, and validation commands documented.
- [x] Local dependency-install blocker recorded exactly.
- [ ] Linux CI typecheck, unit, lint/static analysis, and package gates pass.
- [ ] Windows package CI gate passes.
- [ ] Focused Electron E2E passes or a remaining blocker is documented.

## Phase 1 — Naviro desktop shell

- [x] Naviro appears in the renderer title and titlebar shell.
- [x] Navigation contains Home, Assistant, Inbox, Tasks, Notes, Projects, Automations, Agents, Files, Git, and Terminal.
- [x] Placeholder pages do not implement Phase 3+ backends.
- [x] Orca worktrees, tools, settings, terminal, Git, and agents remain reachable.
- [x] New UI uses repository tokens, components, Lucide icons, and cross-platform titlebar seams.
- [ ] Regression CI passes.

## Phase 2 — Naviro multi-root workspace

- [x] Create, open/import, save, and reopen recent workspaces.
- [x] Add multiple unrelated folders through `repos.pickFolders()`.
- [x] Keep folder and Git roots independent; never move or copy them.
- [x] Rename and logically remove roots.
- [x] Render separate top-level Explorer roots.
- [x] Search selected roots and retain root identity in results.
- [x] Open a terminal with the selected writable root as cwd.
- [x] Open one Git root in existing Source Control; no aggregate Git state.
- [x] Enforce read-only editor/terminal semantics.
- [x] Detect duplicate normalized paths and safely retain missing/unbound roots.
- [x] Persist a versioned catalog and validate portable workspace documents.
- [x] Test Windows path normalization, stable IDs, duplicates, aliases, access policy, schema versions, merged search, and restart UI.
- [x] Add no IPC or remote-wire contract and leave Orca FolderWorkspace unchanged.
- [ ] Full CI passes.

## Hard stop

After CI and review evidence are recorded, stop. Do not begin Phase 3.
