# Naviro Workbench architecture

## Phase 0–2 boundary

```text
Naviro desktop shell
        │
NaviroWorkspace catalog
        │ root bindings
        ▼
Existing Orca repo/worktree/folder workspace runtime
        │
Editor · Terminal · Git · Diff · SSH · Agents
```

No Naviro Server is required or introduced in M1.

## Logical workspace

`NaviroWorkspace` is an aggregation layer. It owns a stable ID, name, stable logical roots, primary-root reference, timestamps, and a versioned portable document. It does not replace `FolderWorkspace.folderPath` and it does not own the user's files.

Each `NaviroWorkspaceRoot` records:

- a random stable ID that is not derived from its path;
- a user-editable alias;
- native path and kind (`folder`, `git`, or `remote`);
- `read-only` or `read-write` access;
- execution/connection ownership when applicable;
- optional bindings to an existing Orca project and workspace.

Root-qualified file references use `{ workspaceId, rootId, relativePath }`. Absolute paths are resolved only at the existing filesystem or runtime boundary.

## Operational rules

```text
context root != Git root != write root
```

- Explorer renders one top-level tree per root.
- Search fans out only to selected roots, then attaches root identity to every result.
- Terminal creation activates one bound Orca workspace and passes that root path as `startupCwd`.
- Git activates one Git root and opens Orca Source Control; there is no aggregate Git state.
- Editor tabs opened from read-only roots carry `readOnly: true`.
- Terminals are disabled for read-only roots because a shell is inherently mutating.
- Removing a root changes only the Naviro catalog.

## Persistence

The renderer persists a schema-versioned catalog in local storage, including the active workspace, so recent workspaces survive restart. Save produces a portable `.naviro-workspace` JSON document through Orca's existing download boundary. Open validates schema version and stable IDs before upserting the workspace.

Runtime-only transient state such as Explorer expansion and search results is not written into the portable document.

## Compatibility boundaries

M1 reuses `repos.pickFolders()`, repo registration, worktree discovery, filesystem `readDir`/`pathExists`/`search`, editor open, terminal tabs, and Source Control. It adds no IPC method and changes no remote RPC or SSH wire contract.
