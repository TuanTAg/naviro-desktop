import { describe, expect, it } from 'vitest'
import {
  parseNaviroWorkspaceCatalog,
  parseNaviroWorkspaceDocument,
  serializeNaviroWorkspace
} from './naviro-workspace-schema'
import type { NaviroWorkspace } from './naviro-workspace-types'

const workspace: NaviroWorkspace = {
  id: 'workspace-1',
  name: 'Product',
  roots: [
    {
      id: 'root-1',
      name: 'desktop',
      path: '/work/desktop',
      kind: 'git',
      access: 'read-write'
    }
  ],
  primaryRootId: 'root-1',
  createdAt: 100,
  updatedAt: 200
}

describe('Naviro workspace schema', () => {
  it('round-trips a portable workspace document', () => {
    expect(parseNaviroWorkspaceDocument(JSON.parse(serializeNaviroWorkspace(workspace))).workspace).toEqual(
      workspace
    )
  })

  it('omits Orca runtime bindings from a portable document', () => {
    const saved = JSON.parse(
      serializeNaviroWorkspace({
        ...workspace,
        roots: [
          {
            ...workspace.roots[0],
            orcaProjectId: 'repo-runtime',
            orcaWorkspaceId: 'worktree-runtime'
          }
        ]
      })
    )
    expect(saved.workspace.roots[0]).not.toHaveProperty('orcaProjectId')
    expect(saved.workspace.roots[0]).not.toHaveProperty('orcaWorkspaceId')
  })

  it('rejects unsupported versions', () => {
    expect(() => parseNaviroWorkspaceDocument({ schemaVersion: 2, workspace })).toThrow(
      'Unsupported Naviro workspace schema version'
    )
  })

  it('rejects duplicate stable root ids', () => {
    expect(() =>
      parseNaviroWorkspaceDocument({
        schemaVersion: 1,
        workspace: { ...workspace, roots: [workspace.roots[0], workspace.roots[0]] }
      })
    ).toThrow('Workspace root ids must be unique')
  })

  it('rejects duplicate normalized root paths during import', () => {
    expect(() =>
      parseNaviroWorkspaceDocument({
        schemaVersion: 1,
        workspace: {
          ...workspace,
          roots: [
            workspace.roots[0],
            {
              ...workspace.roots[0],
              id: 'root-2',
              path: '/work/desktop/'
            }
          ]
        }
      })
    ).toThrow('Workspace root paths must be unique per host')
  })

  it('drops a stale active workspace pointer during catalog recovery', () => {
    expect(
      parseNaviroWorkspaceCatalog({
        schemaVersion: 1,
        activeWorkspaceId: 'missing',
        workspaces: [workspace]
      }).activeWorkspaceId
    ).toBeNull()
  })
})
