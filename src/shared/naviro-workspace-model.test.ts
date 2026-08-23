import { describe, expect, it } from 'vitest'
import {
  addWorkspaceRoot,
  createNaviroWorkspace,
  hasDuplicateWorkspaceRoot,
  removeWorkspaceRoot,
  updateWorkspaceRoot
} from './naviro-workspace-model'

describe('Naviro workspace model', () => {
  it('uses generated stable ids rather than path-derived ids', () => {
    const workspace = createNaviroWorkspace('Product', () => 'workspace-random', 10)
    expect(workspace.id).toBe('workspace-random')
  })

  it('allows roots with the same alias when their paths differ', () => {
    let workspace = createNaviroWorkspace('Product', () => 'workspace-1', 10)
    workspace = addWorkspaceRoot(
      workspace,
      {
        id: 'root-a',
        name: 'app',
        path: '/clients/one/app',
        kind: 'git',
        access: 'read-write'
      },
      20
    )
    workspace = addWorkspaceRoot(
      workspace,
      {
        id: 'root-b',
        name: 'app',
        path: '/clients/two/app',
        kind: 'folder',
        access: 'read-only'
      },
      30
    )
    expect(workspace.roots).toHaveLength(2)
  })

  it('rejects equivalent Windows paths on the same host', () => {
    const workspace = addWorkspaceRoot(
      createNaviroWorkspace('Product', () => 'workspace-1', 10),
      {
        id: 'root-a',
        name: 'desktop',
        path: 'C:\\Work\\Desktop',
        kind: 'git',
        access: 'read-write'
      },
      20
    )
    expect(
      hasDuplicateWorkspaceRoot(workspace, {
        path: 'c:/work/desktop/',
        executionHostId: null
      })
    ).toBe(true)
  })

  it('renames and removes roots without changing their filesystem paths', () => {
    const initial = addWorkspaceRoot(
      createNaviroWorkspace('Product', () => 'workspace-1', 10),
      {
        id: 'root-a',
        name: 'desktop',
        path: '/work/desktop',
        kind: 'folder',
        access: 'read-write'
      },
      20
    )
    const renamed = updateWorkspaceRoot(initial, 'root-a', { name: 'client' }, 30)
    expect(renamed.roots[0]).toMatchObject({ name: 'client', path: '/work/desktop' })
    expect(removeWorkspaceRoot(renamed, 'root-a', 40).roots).toEqual([])
  })

  it('keeps folder and Git roots from unrelated drives in one logical workspace', () => {
    let workspace = createNaviroWorkspace('Product', () => 'workspace-1', 10)
    workspace = addWorkspaceRoot(
      workspace,
      {
        id: 'root-git',
        name: 'client',
        path: 'C:\\clients\\app',
        kind: 'git',
        access: 'read-write'
      },
      20
    )
    workspace = addWorkspaceRoot(
      workspace,
      {
        id: 'root-folder',
        name: 'documents',
        path: 'E:\\documents',
        kind: 'folder',
        access: 'read-only'
      },
      30
    )
    expect(workspace.roots.map(({ kind, path }) => ({ kind, path }))).toEqual([
      { kind: 'git', path: 'C:\\clients\\app' },
      { kind: 'folder', path: 'E:\\documents' }
    ])
  })
})
