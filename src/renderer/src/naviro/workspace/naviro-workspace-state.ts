import { useSyncExternalStore } from 'react'
import {
  addWorkspaceRoot,
  createEmptyNaviroWorkspaceCatalog,
  createNaviroWorkspace,
  removeWorkspaceRoot,
  updateWorkspaceRoot,
  upsertWorkspaceInCatalog
} from '../../../../shared/naviro-workspace-model'
import { parseNaviroWorkspaceCatalog } from '../../../../shared/naviro-workspace-schema'
import type {
  NaviroWorkspace,
  NaviroWorkspaceCatalog,
  NaviroWorkspaceRoot
} from '../../../../shared/naviro-workspace-types'
import { createBrowserUuid } from '@/lib/browser-uuid'

const STORAGE_KEY = 'naviro.workspace.catalog.v1'

type Listener = () => void

function loadCatalog(): NaviroWorkspaceCatalog {
  if (typeof window === 'undefined') {
    return createEmptyNaviroWorkspaceCatalog()
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? parseNaviroWorkspaceCatalog(JSON.parse(stored)) : createEmptyNaviroWorkspaceCatalog()
  } catch (error) {
    console.warn('Failed to restore Naviro workspace catalog:', error)
    return createEmptyNaviroWorkspaceCatalog()
  }
}

let catalog = loadCatalog()
const listeners = new Set<Listener>()

function persistAndPublish(nextCatalog: NaviroWorkspaceCatalog): void {
  catalog = nextCatalog
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
    } catch (error) {
      console.warn('Failed to persist Naviro workspace catalog:', error)
    }
  }
  listeners.forEach((listener) => listener())
}

function generatedId(): string {
  return createBrowserUuid()
}

export function getNaviroWorkspaceCatalog(): NaviroWorkspaceCatalog {
  return catalog
}

export function useNaviroWorkspaceCatalog(): NaviroWorkspaceCatalog {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getNaviroWorkspaceCatalog,
    getNaviroWorkspaceCatalog
  )
}

export function getActiveNaviroWorkspace(): NaviroWorkspace | null {
  return catalog.workspaces.find((workspace) => workspace.id === catalog.activeWorkspaceId) ?? null
}

export function createAndActivateNaviroWorkspace(name: string): NaviroWorkspace {
  const workspace = createNaviroWorkspace(name, generatedId)
  persistAndPublish(upsertWorkspaceInCatalog(catalog, workspace))
  return workspace
}

export function activateNaviroWorkspace(workspaceId: string): void {
  if (!catalog.workspaces.some((workspace) => workspace.id === workspaceId)) {
    return
  }
  persistAndPublish({ ...catalog, activeWorkspaceId: workspaceId })
}

export function importAndActivateNaviroWorkspace(workspace: NaviroWorkspace): void {
  persistAndPublish(upsertWorkspaceInCatalog(catalog, workspace))
}

function replaceActiveWorkspace(nextWorkspace: NaviroWorkspace): void {
  persistAndPublish(upsertWorkspaceInCatalog(catalog, nextWorkspace))
}

export function addNaviroWorkspaceRoot(
  root: Omit<NaviroWorkspaceRoot, 'id'>
): NaviroWorkspaceRoot {
  const workspace = getActiveNaviroWorkspace()
  if (!workspace) {
    throw new Error('Create or open a workspace before adding roots')
  }
  const addedRoot = { ...root, id: generatedId() }
  replaceActiveWorkspace(addWorkspaceRoot(workspace, addedRoot))
  return addedRoot
}

export function renameNaviroWorkspaceRoot(rootId: string, name: string): void {
  const workspace = getActiveNaviroWorkspace()
  if (!workspace || name.trim().length === 0) {
    return
  }
  replaceActiveWorkspace(updateWorkspaceRoot(workspace, rootId, { name: name.trim() }))
}

export function setNaviroWorkspaceRootAccess(
  rootId: string,
  access: NaviroWorkspaceRoot['access']
): void {
  const workspace = getActiveNaviroWorkspace()
  if (!workspace) {
    return
  }
  replaceActiveWorkspace(updateWorkspaceRoot(workspace, rootId, { access }))
}

export function bindNaviroWorkspaceRoot(
  rootId: string,
  binding: Pick<
    NaviroWorkspaceRoot,
    'kind' | 'connectionId' | 'executionHostId' | 'orcaProjectId' | 'orcaWorkspaceId'
  >
): void {
  const workspace = getActiveNaviroWorkspace()
  if (!workspace) {
    return
  }
  replaceActiveWorkspace(
    updateWorkspaceRoot(workspace, rootId, {
      kind: binding.kind,
      connectionId: binding.connectionId,
      executionHostId: binding.executionHostId,
      orcaProjectId: binding.orcaProjectId,
      orcaWorkspaceId: binding.orcaWorkspaceId
    })
  )
}

export function removeNaviroWorkspaceRoot(rootId: string): void {
  const workspace = getActiveNaviroWorkspace()
  if (!workspace) {
    return
  }
  replaceActiveWorkspace(removeWorkspaceRoot(workspace, rootId))
}
