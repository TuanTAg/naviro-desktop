import { detectLanguage } from '@/lib/language-detect'
import { activateAndRevealWorktree } from '@/lib/worktree-activation'
import { useAppStore } from '@/store'
import { normalizeWorkspacePathForComparison } from '../../../../shared/naviro-workspace-path'
import type { NaviroWorkspaceRoot } from '../../../../shared/naviro-workspace-types'
import {
  getNaviroTerminalLaunchRequest,
  isNaviroFileReadOnly
} from '../../../../shared/naviro-workspace-policy'
import {
  addNaviroWorkspaceRoot,
  bindNaviroWorkspaceRoot,
  getActiveNaviroWorkspace
} from './naviro-workspace-state'

export type NaviroRootRegistrationError = {
  path: string
  message: string
}

export type NaviroRootRegistrationResult = {
  added: NaviroWorkspaceRoot[]
  errors: NaviroRootRegistrationError[]
}

function samePath(left: string, right: string): boolean {
  return normalizeWorkspacePathForComparison(left) === normalizeWorkspacePathForComparison(right)
}

async function registerLocalPath(
  path: string
): Promise<Omit<NaviroWorkspaceRoot, 'id' | 'name' | 'access'>> {
  const currentState = useAppStore.getState()
  let repo = currentState.repos.find(
    (candidate) =>
      (candidate.executionHostId === undefined ||
        candidate.executionHostId === null ||
        candidate.executionHostId === 'local') &&
      samePath(candidate.path, path)
  )

  if (!repo) {
    let result = await window.api.repos.add({ path, kind: 'git' })
    if ('error' in result && result.error.includes('Not a valid git repository')) {
      result = await window.api.repos.add({ path, kind: 'folder' })
    }
    if ('error' in result) {
      throw new Error(result.error)
    }
    repo = result.repo
    await useAppStore.getState().fetchRepos()
  }

  await useAppStore.getState().fetchWorktrees(repo.id)
  const refreshedState = useAppStore.getState()
  const localWorkspaces = (refreshedState.worktreesByRepo[repo.id] ?? []).filter(
    (candidate) => (candidate.hostId ?? 'local') === 'local'
  )
  const workspace =
    localWorkspaces.find(
      (candidate) => samePath(candidate.path, repo.path) || samePath(candidate.path, path)
    ) ?? localWorkspaces[0]

  return {
    path: repo.path,
    kind: repo.kind === 'folder' ? 'folder' : 'git',
    connectionId: repo.connectionId ?? null,
    executionHostId: repo.executionHostId ?? 'local',
    orcaProjectId: repo.id,
    orcaWorkspaceId: workspace?.id ?? null
  }
}

export async function addPickedNaviroRoots(
  paths: readonly string[]
): Promise<NaviroRootRegistrationResult> {
  const added: NaviroWorkspaceRoot[] = []
  const errors: NaviroRootRegistrationError[] = []
  for (const path of paths) {
    try {
      const workspace = getActiveNaviroWorkspace()
      if (!workspace) {
        throw new Error('Create or open a workspace before adding roots')
      }
      const normalizedPath = normalizeWorkspacePathForComparison(path)
      if (
        workspace.roots.some(
          (root) => normalizeWorkspacePathForComparison(root.path) === normalizedPath
        )
      ) {
        throw new Error('This folder is already a root in the workspace')
      }
      const registered = await registerLocalPath(path)
      const name =
        registered.path.replace(/[\\/]+$/, '').split(/[\\/]/).at(-1) || registered.path
      added.push(addNaviroWorkspaceRoot({ ...registered, name, access: 'read-write' }))
    } catch (error) {
      errors.push({ path, message: error instanceof Error ? error.message : String(error) })
    }
  }
  return { added, errors }
}

export async function reconnectNaviroRoot(root: NaviroWorkspaceRoot): Promise<boolean> {
  if (root.kind === 'remote') {
    const state = useAppStore.getState()
    const repo = state.repos.find(
      (candidate) =>
        candidate.executionHostId === root.executionHostId && samePath(candidate.path, root.path)
    )
    if (!repo) {
      return false
    }
    await state.fetchWorktrees(
      repo.id,
      root.executionHostId ? { executionHostId: root.executionHostId } : undefined
    )
    const workspace = useAppStore
      .getState()
      .worktreesByRepo[repo.id]?.find(
        (candidate) =>
          candidate.hostId === root.executionHostId && samePath(candidate.path, root.path)
      )
    bindNaviroWorkspaceRoot(root.id, {
      kind: 'remote',
      connectionId: repo.connectionId ?? root.connectionId ?? null,
      executionHostId: repo.executionHostId ?? root.executionHostId ?? null,
      orcaProjectId: repo.id,
      orcaWorkspaceId: workspace?.id ?? null
    })
    return workspace != null
  }
  try {
    const registered = await registerLocalPath(root.path)
    bindNaviroWorkspaceRoot(root.id, registered)
    return registered.orcaWorkspaceId != null
  } catch {
    return false
  }
}

function activateRoot(root: NaviroWorkspaceRoot): boolean {
  if (!root.orcaWorkspaceId) {
    return false
  }
  return Boolean(
    activateAndRevealWorktree(root.orcaWorkspaceId, {
      executionHostId: root.executionHostId ?? undefined,
      providesInitialSurface: true
    })
  )
}

export function openNaviroRootSourceControl(root: NaviroWorkspaceRoot): boolean {
  if (!activateRoot(root)) {
    return false
  }
  const state = useAppStore.getState()
  state.setRightSidebarTab('source-control')
  state.setRightSidebarOpen(true)
  return true
}

export function openNaviroRootFile(
  root: NaviroWorkspaceRoot,
  filePath: string,
  relativePath: string
): boolean {
  if (!activateRoot(root) || !root.orcaWorkspaceId) {
    return false
  }
  useAppStore.getState().openFile(
    {
      filePath,
      relativePath,
      worktreeId: root.orcaWorkspaceId,
      language: detectLanguage(filePath),
      mode: 'edit',
      readOnly: isNaviroFileReadOnly(root)
    },
    { focusEditor: true }
  )
  return true
}

export function openNaviroRootTerminal(root: NaviroWorkspaceRoot): boolean {
  const request = getNaviroTerminalLaunchRequest(root)
  if (!request || !activateRoot(root)) {
    return false
  }
  const state = useAppStore.getState()
  const tab = state.createTab(request.worktreeId, undefined, undefined, {
    activate: true,
    recordInteraction: true,
    startupCwd: request.cwd
  })
  state.setActiveTab(tab.id)
  state.setActiveTabType('terminal')
  return true
}
