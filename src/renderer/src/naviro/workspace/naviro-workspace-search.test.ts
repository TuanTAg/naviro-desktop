import { describe, expect, it } from 'vitest'
import type { NaviroWorkspaceRoot } from '../../../../shared/naviro-workspace-types'
import { mergeNaviroRootSearchResults } from './naviro-workspace-search'

function root(id: string, name: string): NaviroWorkspaceRoot {
  return { id, name, path: `/work/${id}`, kind: 'folder', access: 'read-write' }
}

describe('Naviro multi-root search', () => {
  it('preserves root identity when paths overlap', () => {
    const result = mergeNaviroRootSearchResults([
      {
        root: root('client', 'client'),
        result: {
          files: [{ filePath: '/work/client/src/app.ts', relativePath: 'src/app.ts', matches: [] }],
          totalMatches: 1,
          truncated: false
        }
      },
      {
        root: root('server', 'server'),
        result: {
          files: [{ filePath: '/work/server/src/app.ts', relativePath: 'src/app.ts', matches: [] }],
          totalMatches: 2,
          truncated: true
        }
      }
    ])
    expect(result.files.map((file) => [file.rootName, file.relativePath])).toEqual([
      ['client', 'src/app.ts'],
      ['server', 'src/app.ts']
    ])
    expect(result.totalMatches).toBe(3)
    expect(result.truncated).toBe(true)
  })
})
