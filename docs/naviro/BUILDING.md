# Naviro build and validation

## Pinned toolchain

- Node.js: 24 (from `package.json` engines)
- pnpm: 10.24.0 (from `packageManager`)
- Git: required
- Native modules: Python 3, a C/C++ compiler, and platform build tools

Use Corepack so a different system pnpm does not silently change the lockfile:

```bash
corepack enable
corepack prepare pnpm@10.24.0 --activate
pnpm --version
```

On Ubuntu/Debian CI, native builds install `build-essential` and `python3`; the repository also pins an external `node-gyp` workaround where required. On Windows, use a current Visual Studio Build Tools installation with the Desktop development with C++ workload and Python available to Node's build tooling.

## Clean setup

```bash
git clone https://github.com/TuanTAg/naviro-desktop.git
cd naviro-desktop
git remote add upstream https://github.com/stablyai/orca.git
git fetch upstream main
pnpm install --frozen-lockfile
```

## Development and validation

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

Focused Naviro tests:

```bash
pnpm exec vitest run --config config/vitest.config.ts \
  src/shared/naviro-workspace-path.test.ts \
  src/shared/naviro-workspace-model.test.ts \
  src/shared/naviro-workspace-policy.test.ts \
  src/shared/naviro-workspace-schema.test.ts \
  src/renderer/src/naviro/workspace/naviro-workspace-search.test.ts

pnpm run test:e2e tests/e2e/naviro-workspace.spec.ts --workers=1
```

Windows packaging:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build:win
```

The PR workflow supplies independent Linux static analysis, typecheck, unit tests, desktop packaging, Windows packaging, and changed Electron E2E coverage.

## Phase 0 environment evidence

Baseline inspection was performed on 2026-08-23 with Linux x86_64, Node `v24.19.0`, Corepack pnpm `10.24.0`, Git `2.51.1`, Python `3.12.13`, and GCC `13.3.0`.

The clean dependency install in the Work Mode sandbox was attempted with:

```bash
COREPACK_HOME=/tmp/naviro-corepack corepack pnpm install --frozen-lockfile
```

It was blocked before package installation because the sandbox's restricted network disconnected the package registry request. This is an environment blocker, not a passing build. Validation evidence must therefore come from the repository's GitHub Actions runners after the implementation branch is pushed; results are recorded in `STATUS.md`.
