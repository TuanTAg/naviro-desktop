import { useState } from 'react'
import { FileSearch, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { translate } from '@/i18n/i18n'
import type { NaviroWorkspaceRoot } from '../../../../shared/naviro-workspace-types'
import { openNaviroRootFile } from './naviro-root-runtime'
import {
  searchNaviroWorkspaceRoots,
  type NaviroWorkspaceSearchResult
} from './naviro-workspace-search'

type SearchSnapshot = {
  rootSignature: string
  value: NaviroWorkspaceSearchResult
}

export function NaviroWorkspaceSearch({
  workspaceId,
  roots
}: {
  workspaceId: string
  roots: readonly NaviroWorkspaceRoot[]
}): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [deselectedRootIds, setDeselectedRootIds] = useState<Set<string>>(() => new Set())
  const [searchSnapshot, setSearchSnapshot] = useState<SearchSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const rootSignature = `${workspaceId}:${roots.map((root) => root.id).join(':')}`
  const result = searchSnapshot?.rootSignature === rootSignature ? searchSnapshot.value : null

  const runSearch = async (): Promise<void> => {
    if (!query.trim()) {
      return
    }
    const selectedRoots = roots.filter((root) => !deselectedRootIds.has(root.id))
    if (selectedRoots.length === 0) {
      toast.error(translate('naviro.search.selectRoot', 'Select at least one root'))
      return
    }
    setLoading(true)
    try {
      setSearchSnapshot({
        rootSignature,
        value: await searchNaviroWorkspaceRoots(query.trim(), selectedRoots)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form
        className="border-b border-border p-3"
        onSubmit={(event) => {
          event.preventDefault()
          void runSearch()
        }}
      >
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={translate(
              'naviro.search.placeholder',
              'Search across selected roots'
            )}
            aria-label={translate('naviro.search.aria', 'Search workspace roots')}
          />
          <Button type="submit" size="sm" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {translate('naviro.search.action', 'Search')}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {roots.map((root) => (
            <label key={root.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={!deselectedRootIds.has(root.id)}
                onCheckedChange={(checked) => {
                  setDeselectedRootIds((current) => {
                    const next = new Set(current)
                    if (checked === true) {
                      next.delete(root.id)
                    } else {
                      next.add(root.id)
                    }
                    return next
                  })
                }}
              />
              {root.name}
            </label>
          ))}
        </div>
      </form>
      <div className="scrollbar-sleek min-h-0 flex-1 overflow-auto p-3">
        {!result ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <FileSearch className="mr-2 size-4" />
            {translate('naviro.search.idle', 'Results retain their root identity.')}
          </div>
        ) : result.files.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {translate('naviro.search.empty', 'No matches found.')}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="px-1 text-xs text-muted-foreground">
              {result.totalMatches === 1
                ? translate('naviro.search.matchOne', '{{count}} match', {
                    count: result.totalMatches
                  })
                : translate('naviro.search.matchMany', '{{count}} matches', {
                    count: result.totalMatches
                  })}
              {result.truncated
                ? ` ${translate('naviro.search.truncated', '· results truncated')}`
                : ''}
            </p>
            {result.errors.map((error) => (
              <p key={error.rootId} className="rounded-md border border-destructive/30 p-2 text-xs text-destructive">
                {roots.find((root) => root.id === error.rootId)?.name}: {error.message}
              </p>
            ))}
            {result.files.map((file) => {
              const root = roots.find((candidate) => candidate.id === file.rootId)
              return (
                <button
                  key={`${file.rootId}:${file.filePath}`}
                  type="button"
                  className="block w-full rounded-md border border-border bg-card p-3 text-left hover:bg-accent"
                  onClick={() => {
                    if (root && !openNaviroRootFile(root, file.filePath, file.relativePath)) {
                      toast.error(
                        translate(
                          'naviro.errors.rootNotConnected',
                          'This root is not connected to an Orca workspace'
                        )
                      )
                    }
                  }}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{file.rootName}</span>
                    <span className="truncate">{file.relativePath}</span>
                  </div>
                  {file.matches.slice(0, 3).map((match) => (
                    <div key={`${match.line}:${match.column}`} className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {match.line}: {match.lineContent.trim()}
                    </div>
                  ))}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
