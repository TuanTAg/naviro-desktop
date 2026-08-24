import type { ExecutionHostId } from './execution-host'

export const NAVIRO_WORKSPACE_SCHEMA_VERSION = 1 as const

export type NaviroWorkspaceRootKind = 'folder' | 'git' | 'remote'
export type NaviroWorkspaceRootAccess = 'read-only' | 'read-write'

export type NaviroWorkspaceRoot = {
  id: string
  name: string
  path: string
  kind: NaviroWorkspaceRootKind
  access: NaviroWorkspaceRootAccess
  connectionId?: string | null
  executionHostId?: ExecutionHostId | null
  orcaProjectId?: string | null
  orcaWorkspaceId?: string | null
}

export type NaviroWorkspace = {
  id: string
  name: string
  roots: NaviroWorkspaceRoot[]
  primaryRootId?: string | null
  createdAt: number
  updatedAt: number
}

export type NaviroFileRef = {
  workspaceId: string
  rootId: string
  relativePath: string
}

export type NaviroWorkspaceDocument = {
  schemaVersion: typeof NAVIRO_WORKSPACE_SCHEMA_VERSION
  workspace: NaviroWorkspace
}

export type NaviroWorkspaceCatalog = {
  schemaVersion: typeof NAVIRO_WORKSPACE_SCHEMA_VERSION
  activeWorkspaceId: string | null
  workspaces: NaviroWorkspace[]
}
