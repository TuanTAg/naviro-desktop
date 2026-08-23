import type { SearchResult } from '../../../../shared/code-search-types'
import type { NaviroWorkspaceRoot } from '../../../../shared/naviro-workspace-types'

export type NaviroWorkspaceSearchFile = SearchResult['files'][number] & {
  rootId: string
  rootName: string
}

export type NaviroWorkspaceSearchResult = {
  files: NaviroWorkspaceSearchFile[]
  totalMatches: number
  truncated: boolean
  errors: { rootId: string; message: string }[]
}

export function mergeNaviroRootSearchResults(
  results: readonly { root: NaviroWorkspaceRoot; result: SearchResult }[],
  errors: NaviroWorkspaceSearchResult['errors'] = []
): NaviroWorkspaceSearchResult {
  return {
    files: results.flatMap(({ root, result }) =>
      result.files.map((file) => ({ ...file, rootId: root.id, rootName: root.name }))
    ),
    totalMatches: results.reduce((total, item) => total + item.result.totalMatches, 0),
    truncated: results.some((item) => item.result.truncated),
    errors
  }
}

export async function searchNaviroWorkspaceRoots(
  query: string,
  roots: readonly NaviroWorkspaceRoot[]
): Promise<NaviroWorkspaceSearchResult> {
  const settled = await Promise.allSettled(
    roots.map(async (root) => ({
      root,
      result: await window.api.fs.search({
        query,
        rootPath: root.path,
        connectionId: root.connectionId ?? undefined,
        maxResults: 500
      })
    }))
  )
  const results: { root: NaviroWorkspaceRoot; result: SearchResult }[] = []
  const errors: NaviroWorkspaceSearchResult['errors'] = []
  settled.forEach((item, index) => {
    const root = roots[index]
    if (item.status === 'fulfilled') results.push(item.value)
    else errors.push({ rootId: root.id, message: String(item.reason) })
  })
  return mergeNaviroRootSearchResults(results, errors)
}
