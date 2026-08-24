import {
  NAVIRO_WORKSPACE_SCHEMA_VERSION,
  type NaviroWorkspace,
  type NaviroWorkspaceCatalog,
  type NaviroWorkspaceDocument,
  type NaviroWorkspaceRoot,
  type NaviroWorkspaceRootAccess,
  type NaviroWorkspaceRootKind
} from './naviro-workspace-types'
import { workspaceRootIdentityKey } from './naviro-workspace-path'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`)
  }
  return value.trim()
}

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new Error('Optional workspace identifiers must be strings')
  }
  return value
}

function timestamp(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid timestamp`)
  }
  return value
}

function parseRoot(value: unknown): NaviroWorkspaceRoot {
  if (!isRecord(value)) {
    throw new Error('Workspace root must be an object')
  }
  const kind = value.kind as NaviroWorkspaceRootKind
  if (!['folder', 'git', 'remote'].includes(kind)) {
    throw new Error('Workspace root kind is invalid')
  }
  const access = value.access as NaviroWorkspaceRootAccess
  if (!['read-only', 'read-write'].includes(access)) {
    throw new Error('Workspace root access is invalid')
  }
  return {
    id: requiredString(value.id, 'Workspace root id'),
    name: requiredString(value.name, 'Workspace root name'),
    path: requiredString(value.path, 'Workspace root path'),
    kind,
    access,
    connectionId: optionalString(value.connectionId),
    executionHostId: optionalString(value.executionHostId) as NaviroWorkspaceRoot['executionHostId'],
    orcaProjectId: optionalString(value.orcaProjectId),
    orcaWorkspaceId: optionalString(value.orcaWorkspaceId)
  }
}

export function parseNaviroWorkspace(value: unknown): NaviroWorkspace {
  if (!isRecord(value)) {
    throw new Error('Workspace must be an object')
  }
  if (!Array.isArray(value.roots)) {
    throw new Error('Workspace roots must be an array')
  }
  const roots = value.roots.map(parseRoot)
  const rootIds = new Set(roots.map((root) => root.id))
  if (rootIds.size !== roots.length) {
    throw new Error('Workspace root ids must be unique')
  }
  const rootPaths = new Set(
    roots.map((root) => workspaceRootIdentityKey(root.path, root.executionHostId))
  )
  if (rootPaths.size !== roots.length) {
    throw new Error('Workspace root paths must be unique per host')
  }
  const primaryRootId = optionalString(value.primaryRootId)
  if (primaryRootId && !rootIds.has(primaryRootId)) {
    throw new Error('Primary root must refer to a workspace root')
  }
  return {
    id: requiredString(value.id, 'Workspace id'),
    name: requiredString(value.name, 'Workspace name'),
    roots,
    primaryRootId,
    createdAt: timestamp(value.createdAt, 'Workspace createdAt'),
    updatedAt: timestamp(value.updatedAt, 'Workspace updatedAt')
  }
}

function requireSchemaVersion(value: UnknownRecord): void {
  if (value.schemaVersion !== NAVIRO_WORKSPACE_SCHEMA_VERSION) {
    throw new Error(`Unsupported Naviro workspace schema version: ${String(value.schemaVersion)}`)
  }
}

export function parseNaviroWorkspaceDocument(value: unknown): NaviroWorkspaceDocument {
  if (!isRecord(value)) {
    throw new Error('Workspace document must be an object')
  }
  requireSchemaVersion(value)
  return {
    schemaVersion: NAVIRO_WORKSPACE_SCHEMA_VERSION,
    workspace: parseNaviroWorkspace(value.workspace)
  }
}

export function parseNaviroWorkspaceCatalog(value: unknown): NaviroWorkspaceCatalog {
  if (!isRecord(value)) {
    throw new Error('Workspace catalog must be an object')
  }
  requireSchemaVersion(value)
  if (!Array.isArray(value.workspaces)) {
    throw new Error('Workspace catalog must contain workspaces')
  }
  const workspaces = value.workspaces.map(parseNaviroWorkspace)
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id))
  if (workspaceIds.size !== workspaces.length) {
    throw new Error('Workspace ids must be unique')
  }
  const requestedActiveId = optionalString(value.activeWorkspaceId)
  return {
    schemaVersion: NAVIRO_WORKSPACE_SCHEMA_VERSION,
    activeWorkspaceId:
      requestedActiveId && workspaceIds.has(requestedActiveId) ? requestedActiveId : null,
    workspaces
  }
}

export function serializeNaviroWorkspace(workspace: NaviroWorkspace): string {
  const portableWorkspace: NaviroWorkspace = {
    ...workspace,
    roots: workspace.roots.map((root) => ({
      id: root.id,
      name: root.name,
      path: root.path,
      kind: root.kind,
      access: root.access,
      ...(root.connectionId !== undefined ? { connectionId: root.connectionId } : {}),
      ...(root.executionHostId !== undefined ? { executionHostId: root.executionHostId } : {})
    }))
  }
  const document: NaviroWorkspaceDocument = {
    schemaVersion: NAVIRO_WORKSPACE_SCHEMA_VERSION,
    workspace: portableWorkspace
  }
  return `${JSON.stringify(document, null, 2)}\n`
}
