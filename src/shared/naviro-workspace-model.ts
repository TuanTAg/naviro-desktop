import { workspaceRootIdentityKey } from './naviro-workspace-path'
import {
  NAVIRO_WORKSPACE_SCHEMA_VERSION,
  type NaviroWorkspace,
  type NaviroWorkspaceCatalog,
  type NaviroWorkspaceRoot
} from './naviro-workspace-types'

export type NaviroIdFactory = () => string

export function createEmptyNaviroWorkspaceCatalog(): NaviroWorkspaceCatalog {
  return {
    schemaVersion: NAVIRO_WORKSPACE_SCHEMA_VERSION,
    activeWorkspaceId: null,
    workspaces: []
  }
}

export function createNaviroWorkspace(
  name: string,
  idFactory: NaviroIdFactory,
  now = Date.now()
): NaviroWorkspace {
  return {
    id: idFactory(),
    name: name.trim() || 'Untitled Workspace',
    roots: [],
    primaryRootId: null,
    createdAt: now,
    updatedAt: now
  }
}

export function getWorkspacePathName(path: string): string {
  const withoutTrailingSeparators = path.replace(/[\\/]+$/, '')
  return withoutTrailingSeparators.split(/[\\/]/).at(-1) || path
}

export function hasDuplicateWorkspaceRoot(
  workspace: NaviroWorkspace,
  candidate: Pick<NaviroWorkspaceRoot, 'path' | 'executionHostId'>,
  ignoredRootId?: string
): boolean {
  const candidateKey = workspaceRootIdentityKey(candidate.path, candidate.executionHostId)
  return workspace.roots.some(
    (root) =>
      root.id !== ignoredRootId &&
      workspaceRootIdentityKey(root.path, root.executionHostId) === candidateKey
  )
}

export function addWorkspaceRoot(
  workspace: NaviroWorkspace,
  root: NaviroWorkspaceRoot,
  now = Date.now()
): NaviroWorkspace {
  if (workspace.roots.some((existing) => existing.id === root.id)) {
    throw new Error('Workspace root id already exists')
  }
  if (hasDuplicateWorkspaceRoot(workspace, root)) {
    throw new Error('This folder is already a root in the workspace')
  }
  return {
    ...workspace,
    roots: [...workspace.roots, root],
    primaryRootId: workspace.primaryRootId ?? root.id,
    updatedAt: now
  }
}

export function updateWorkspaceRoot(
  workspace: NaviroWorkspace,
  rootId: string,
  updates: Partial<
    Pick<
      NaviroWorkspaceRoot,
      | 'name'
      | 'kind'
      | 'access'
      | 'connectionId'
      | 'executionHostId'
      | 'orcaProjectId'
      | 'orcaWorkspaceId'
    >
  >,
  now = Date.now()
): NaviroWorkspace {
  if (!workspace.roots.some((root) => root.id === rootId)) return workspace
  return {
    ...workspace,
    roots: workspace.roots.map((root) => (root.id === rootId ? { ...root, ...updates } : root)),
    updatedAt: now
  }
}

export function removeWorkspaceRoot(
  workspace: NaviroWorkspace,
  rootId: string,
  now = Date.now()
): NaviroWorkspace {
  if (!workspace.roots.some((root) => root.id === rootId)) return workspace
  const roots = workspace.roots.filter((root) => root.id !== rootId)
  return {
    ...workspace,
    roots,
    primaryRootId:
      workspace.primaryRootId === rootId ? (roots[0]?.id ?? null) : workspace.primaryRootId,
    updatedAt: now
  }
}

export function upsertWorkspaceInCatalog(
  catalog: NaviroWorkspaceCatalog,
  workspace: NaviroWorkspace
): NaviroWorkspaceCatalog {
  const existingIndex = catalog.workspaces.findIndex((item) => item.id === workspace.id)
  const workspaces = [...catalog.workspaces]
  if (existingIndex === -1) workspaces.push(workspace)
  else workspaces[existingIndex] = workspace
  return { ...catalog, workspaces, activeWorkspaceId: workspace.id }
}
