# Naviro

Naviro is an AI Work OS that brings workspaces, files, tasks, notes, assistants, coding agents, Git, terminals, and automations into one calm desktop shell.

Naviro Desktop is a controlled fork of [stablyai/orca](https://github.com/stablyai/orca). The current milestone keeps Orca's proven editor, terminal, Git, worktree, SSH, and agent runtime intact while adding a Naviro-owned workspace layer above it.

## Current milestone

M1 — Naviro Workbench includes only:

- Phase 0 — reproducible Orca baseline
- Phase 1 — Naviro desktop identity and navigation shell
- Phase 2 — logical multi-root workspaces

Implementation stops after Phase 2. Naviro Server, mobile clients, AI Gateway, connectors, long-term memory, and backend automations require separate approval.

## Multi-root model

A Naviro workspace groups unrelated roots without flattening them into a fake filesystem or changing Orca's single-root `FolderWorkspace` model.

```text
Naviro Workspace
├── Client       -> Git repository on D:\clients\app
├── Service      -> Git repository on /srv/service
└── Documents    -> ordinary folder on another drive
```

Every root keeps its own stable identity, native path, access mode, Git boundary, and execution host. Adding or removing a root never moves, copies, renames, or deletes the underlying folder.

## Development

The repository pins Node 24 and pnpm 10.24.0. See [Naviro build and validation](docs/naviro/BUILDING.md) for clean setup, test, package, and CI commands.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Project scope and evidence:

- [Current scope](docs/naviro/CURRENT_SCOPE.md)
- [Roadmap](docs/naviro/ROADMAP.md)
- [Architecture](docs/naviro/ARCHITECTURE.md)
- [Definition of Done](docs/naviro/DEFINITION_OF_DONE.md)
- [Upstream strategy](docs/naviro/UPSTREAM_STRATEGY.md)
- [Implementation status](docs/naviro/STATUS.md)

## Non-negotiable principles

1. Preserve upstream compatibility and Orca runtime behavior.
2. Keep Naviro additions isolated under clearly owned modules.
3. Keep context root, Git root, and write root distinct.
4. Preserve folder workspaces, Git worktrees, SSH, remote wire compatibility, and platform-native paths.
5. Never move or copy user project folders when managing logical roots.
6. Stop at the authorized phase boundary.

## Attribution and license

Naviro Desktop builds on Orca and retains its license and upstream history. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
