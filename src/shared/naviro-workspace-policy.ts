import type { NaviroWorkspaceRoot } from './naviro-workspace-types'

export type NaviroTerminalLaunchRequest = {
  worktreeId: string
  cwd: string
}

export function getNaviroTerminalLaunchRequest(
  root: NaviroWorkspaceRoot
): NaviroTerminalLaunchRequest | null {
  if (root.access === 'read-only' || !root.orcaWorkspaceId) return null
  return { worktreeId: root.orcaWorkspaceId, cwd: root.path }
}

export function isNaviroFileReadOnly(root: NaviroWorkspaceRoot): boolean {
  return root.access === 'read-only'
}

export function classifyNaviroRootAvailability(
  root: NaviroWorkspaceRoot,
  pathExists: boolean
): 'available' | 'missing' | 'unbound' {
  if (!root.orcaWorkspaceId) return 'unbound'
  return pathExists ? 'available' : 'missing'
}
