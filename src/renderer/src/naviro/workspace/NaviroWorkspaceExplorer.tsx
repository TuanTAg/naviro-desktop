import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import type { DirEntry } from '../../../../shared/filesystem-entry-types'
import {
  joinWorkspaceNativePath,
  joinWorkspaceRelativePath
} from '../../../../shared/naviro-workspace-path'
import type { NaviroWorkspaceRoot } from '../../../../shared/naviro-workspace-types'
import { openNaviroRootFile } from './naviro-root-runtime'

type DirectoryState = {
  entries?: DirEntry[]
  loading?: boolean
  error?: string
}

type TreeLocation = {
  absolutePath: string
  relativePath: string
}

function sortEntries(entries: readonly DirEntry[]): DirEntry[] {
  return [...entries].sort(
    (left, right) =>
      Number(right.isDirectory) - Number(left.isDirectory) || left.name.localeCompare(right.name)
  )
}

function DirectoryRows({
  root,
  location,
  depth,
  directoryState,
  expanded,
  toggleDirectory
}: {
  root: NaviroWorkspaceRoot
  location: TreeLocation
  depth: number
  directoryState: Record<string, DirectoryState>
  expanded: Set<string>
  toggleDirectory: (root: NaviroWorkspaceRoot, location: TreeLocation) => void
}): React.JSX.Element {
  const stateKey = `${root.id}:${location.absolutePath}`
  const state = directoryState[stateKey]
  if (state?.loading) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground" style={{ paddingLeft: depth * 16 + 28 }}>
        <Loader2 className="size-3 animate-spin" />
        {translate('naviro.explorer.loading', 'Loading…')}
      </div>
    )
  }
  if (state?.error) {
    return (
      <div className="py-1 text-xs text-destructive" style={{ paddingLeft: depth * 16 + 28 }}>
        {state.error}
      </div>
    )
  }
  return (
    <>
      {(state?.entries ?? []).map((entry) => {
        const child: TreeLocation = {
          absolutePath: joinWorkspaceNativePath(location.absolutePath, entry.name),
          relativePath: joinWorkspaceRelativePath(location.relativePath, entry.name)
        }
        const childKey = `${root.id}:${child.absolutePath}`
        const isExpanded = expanded.has(childKey)
        return (
          <div key={childKey}>
            <button
              type="button"
              className="flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-left text-xs text-foreground/80 hover:bg-accent hover:text-accent-foreground"
              style={{ paddingLeft: depth * 16 + 12 }}
              onClick={() => {
                if (entry.isDirectory) {
                  toggleDirectory(root, child)
                } else if (!openNaviroRootFile(root, child.absolutePath, child.relativePath)) {
                  toast.error(
                    translate(
                      'naviro.errors.rootNotConnected',
                      'This root is not connected to an Orca workspace'
                    )
                  )
                }
              }}
            >
              {entry.isDirectory ? (
                isExpanded ? (
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                )
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              {entry.isDirectory ? (
                isExpanded ? (
                  <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                )
              ) : (
                <File className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 truncate">{entry.name}</span>
            </button>
            {entry.isDirectory && isExpanded ? (
              <DirectoryRows
                root={root}
                location={child}
                depth={depth + 1}
                directoryState={directoryState}
                expanded={expanded}
                toggleDirectory={toggleDirectory}
              />
            ) : null}
          </div>
        )
      })}
    </>
  )
}

export function NaviroWorkspaceExplorer({
  roots
}: {
  roots: readonly NaviroWorkspaceRoot[]
}): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [directoryState, setDirectoryState] = useState<Record<string, DirectoryState>>({})

  const toggleDirectory = async (
    root: NaviroWorkspaceRoot,
    location: TreeLocation
  ): Promise<void> => {
    const key = `${root.id}:${location.absolutePath}`
    if (expanded.has(key)) {
      setExpanded((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
      return
    }
    setExpanded((current) => new Set(current).add(key))
    if (directoryState[key]?.entries) {
      return
    }
    setDirectoryState((current) => ({ ...current, [key]: { loading: true } }))
    try {
      const entries = await window.api.fs.readDir({
        dirPath: location.absolutePath,
        connectionId: root.connectionId ?? undefined
      })
      setDirectoryState((current) => ({
        ...current,
        [key]: { entries: sortEntries(entries) }
      }))
    } catch (error) {
      setDirectoryState((current) => ({
        ...current,
        [key]: { error: error instanceof Error ? error.message : String(error) }
      }))
    }
  }

  if (roots.length === 0) {
    return (
      <p className="p-5 text-sm text-muted-foreground">
        {translate('naviro.explorer.empty', 'Add a root to browse files.')}
      </p>
    )
  }

  return (
    <div className="scrollbar-sleek min-h-0 overflow-auto p-3">
      {roots.map((root) => {
        const rootLocation = { absolutePath: root.path, relativePath: '' }
        const key = `${root.id}:${root.path}`
        const isExpanded = expanded.has(key)
        return (
          <section key={root.id} className={cn('mb-2 rounded-md border border-border', isExpanded && 'bg-card')}>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"
              onClick={() => void toggleDirectory(root, rootLocation)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <Folder className="size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{root.name}</span>
              <span className="max-w-[45%] truncate text-[11px] text-muted-foreground">{root.path}</span>
            </button>
            {isExpanded ? (
              <DirectoryRows
                root={root}
                location={rootLocation}
                depth={0}
                directoryState={directoryState}
                expanded={expanded}
                toggleDirectory={(selectedRoot, selectedLocation) => {
                  void toggleDirectory(selectedRoot, selectedLocation)
                }}
              />
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
