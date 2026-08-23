import type { FilesystemPathFlavor } from './filesystem-entry-types'

function isRootPath(value: string): boolean {
  return value === '/' || /^[a-z]:\/$/i.test(value) || /^\/\/[^/]+\/[^/]+\/?$/.test(value)
}

export function inferWorkspacePathFlavor(value: string): FilesystemPathFlavor {
  return /^[a-z]:[\\/]/i.test(value) || value.startsWith('\\\\') || value.includes('\\')
    ? 'win32'
    : 'posix'
}

export function normalizeWorkspacePathForComparison(
  value: string,
  flavor: FilesystemPathFlavor = inferWorkspacePathFlavor(value)
): string {
  const slashPath = value.trim().replace(/\\/g, '/')
  const hadUncPrefix = slashPath.startsWith('//')
  let normalized = slashPath.replace(/\/{2,}/g, '/')
  if (hadUncPrefix) {
    normalized = `/${normalized}`
  }
  if (normalized.length > 1 && normalized.endsWith('/') && !isRootPath(normalized)) {
    normalized = normalized.slice(0, -1)
  }
  return flavor === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized
}

export function workspaceRootIdentityKey(
  path: string,
  executionHostId: string | null | undefined
): string {
  return `${executionHostId ?? 'local'}:${normalizeWorkspacePathForComparison(path)}`
}

export function joinWorkspaceNativePath(basePath: string, childName: string): string {
  const separator = inferWorkspacePathFlavor(basePath) === 'win32' ? '\\' : '/'
  const base = basePath.replace(/[\\/]+$/, '')
  const child = childName.replace(/^[\\/]+/, '')
  if (base.length === 0) {
    return separator === '\\' && /^[a-z]:$/i.test(basePath) ? `${basePath}\\${child}` : `/${child}`
  }
  return `${base}${separator}${child}`
}

export function joinWorkspaceRelativePath(basePath: string, childName: string): string {
  const base = basePath.replace(/[\\/]+$/, '').replace(/\\/g, '/')
  const child = childName.replace(/^[\\/]+/, '').replace(/\\/g, '/')
  return base ? `${base}/${child}` : child
}
