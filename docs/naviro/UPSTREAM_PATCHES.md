# Naviro upstream patches

## Patch: mount Naviro pages in the desktop shell

- Phase: 1–2
- Files: `AppWorkspaceShell.tsx`, `use-app-chrome-layout.ts`, sidebar composition, titlebar label, renderer HTML title
- Orca behavior changed: the shell can display a Naviro-owned page while keeping the Orca terminal workbench mounted but hidden; the sidebar has a Naviro navigation section.
- Why an extension alone was insufficient: the existing app shell is the only owner of page/workbench visibility and cross-platform titlebar placement.
- Regression protection: existing shell tests plus `tests/e2e/naviro-workspace.spec.ts`; full typecheck, unit, package, and Electron CI gates.
- Conflict risk: medium in app-shell layout, low in title and sidebar composition.
- Rework path: keep the Naviro external store and pages; reapply only the small visibility and composition seams after upstream changes.

## Patch: return to the Orca workbench on workspace activation

- Phase: 1
- File: `src/renderer/src/lib/worktree-activation.ts`
- Orca behavior changed: successful folder-workspace or worktree activation first selects the Naviro `workbench` surface.
- Why an extension alone was insufficient: activation originates from many existing Orca controls; a single shared seam prevents a hidden active workspace.
- Regression protection: existing worktree activation tests and Naviro E2E navigation.
- Conflict risk: low.
- Rework path: move the call into a future upstream navigation event hook if one becomes available.

## Patch: fetch upstream release tags in fork CI

- Phase: 0
- File: `.github/workflows/pr.yml`
- Orca behavior changed: only fork CI fetches upstream desktop release tags before the cross-version wire check; `stablyai/orca` behavior is unchanged.
- Why an extension alone was insufficient: GitHub forks do not inherit upstream tags, while the existing harness intentionally fails when no stable release tag is present.
- Regression protection: the `cross-version wire compatibility` job must select and test a real published Orca baseline.
- Conflict risk: low.
- Rework path: drop this patch if upstream makes the harness fork-aware or the fork starts mirroring release tags.

No main-process, filesystem-provider, Git, terminal-process, SSH, or remote-wire patch was introduced.
