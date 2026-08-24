# Orca upstream strategy

## Remotes and baseline

```text
origin   https://github.com/TuanTAg/naviro-desktop.git
upstream https://github.com/stablyai/orca.git
baseline 063b8042988bd4c7df1f7acf08949b36be082e04
```

At M1 start, `git merge-base HEAD upstream/main`, `origin/main`, and `upstream/main` all resolved to the exact baseline commit above.

If the upstream remote is absent:

```bash
git remote add upstream https://github.com/stablyai/orca.git
git fetch upstream main
```

## Rules

1. Keep Naviro-owned renderer code under `src/renderer/src/naviro/` and shared contracts under `src/shared/naviro-*`.
2. Prefer adapters and existing preload APIs over new IPC or edits to Orca services.
3. Never replace Orca's folder-workspace path with a global array.
4. Record unavoidable edits to Orca-owned modules in `UPSTREAM_PATCHES.md`.
5. Preserve local, SSH, and paired-runtime execution ownership.
6. Keep upstream synchronization commits separate from product changes.

## Sync procedure

```bash
git fetch upstream
git switch <integration-branch>
git merge --no-ff upstream/main
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Resolve conflicts by keeping Naviro shell seams small and reviewing every direct core patch against its recorded intent.
