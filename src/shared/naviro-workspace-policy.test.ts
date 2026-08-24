import { describe, expect, it } from 'vitest'
import {
  classifyNaviroRootAvailability,
  getNaviroTerminalLaunchRequest,
  isNaviroFileReadOnly
} from './naviro-workspace-policy'
import type { NaviroWorkspaceRoot } from './naviro-workspace-types'

function root(overrides: Partial<NaviroWorkspaceRoot> = {}): NaviroWorkspaceRoot {
  return {
    id: 'root-1',
    name: 'client',
    path: 'D:\\clients\\naviro',
    kind: 'git',
    access: 'read-write',
    orcaWorkspaceId: 'repo::D:\\clients\\naviro',
    ...overrides
  }
}

describe('Naviro root operation policy', () => {
  it('opens a terminal in the selected root cwd', () => {
    expect(getNaviroTerminalLaunchRequest(root())).toEqual({
      worktreeId: 'repo::D:\\clients\\naviro',
      cwd: 'D:\\clients\\naviro'
    })
  })

  it('blocks terminals and editable files for read-only roots', () => {
    const readOnlyRoot = root({ access: 'read-only' })
    expect(getNaviroTerminalLaunchRequest(readOnlyRoot)).toBeNull()
    expect(isNaviroFileReadOnly(readOnlyRoot)).toBe(true)
  })

  it('marks a persisted root missing without deleting its metadata', () => {
    const persistedRoot = root()
    expect(classifyNaviroRootAvailability(persistedRoot, false)).toBe('missing')
    expect(persistedRoot.path).toBe('D:\\clients\\naviro')
  })

  it('distinguishes an unbound imported root from a missing bound root', () => {
    expect(classifyNaviroRootAvailability(root({ orcaWorkspaceId: null }), true)).toBe('unbound')
  })
})
