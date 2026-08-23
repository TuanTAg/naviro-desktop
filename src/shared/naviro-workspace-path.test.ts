import { describe, expect, it } from 'vitest'
import {
  joinWorkspaceNativePath,
  normalizeWorkspacePathForComparison,
  workspaceRootIdentityKey
} from './naviro-workspace-path'

describe('Naviro workspace path identity', () => {
  it('normalizes Windows separators, casing, and trailing slashes', () => {
    expect(normalizeWorkspacePathForComparison('C:\\Work\\Naviro\\', 'win32')).toBe(
      'c:/work/naviro'
    )
    expect(normalizeWorkspacePathForComparison('c:/work/naviro', 'win32')).toBe('c:/work/naviro')
  })

  it('keeps POSIX paths case-sensitive', () => {
    expect(normalizeWorkspacePathForComparison('/Work/Naviro/', 'posix')).toBe('/Work/Naviro')
    expect(normalizeWorkspacePathForComparison('/work/naviro', 'posix')).not.toBe('/Work/Naviro')
  })

  it('scopes duplicate detection to the execution host', () => {
    expect(workspaceRootIdentityKey('/srv/app', 'ssh:alpha')).not.toBe(
      workspaceRootIdentityKey('/srv/app', 'ssh:beta')
    )
  })

  it('joins native paths without assuming the desktop platform', () => {
    expect(joinWorkspaceNativePath('D:\\apps\\naviro', 'src')).toBe('D:\\apps\\naviro\\src')
    expect(joinWorkspaceNativePath('/opt/naviro', 'src')).toBe('/opt/naviro/src')
  })
})
