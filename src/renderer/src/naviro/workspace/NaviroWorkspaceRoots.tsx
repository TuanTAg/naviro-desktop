import { useEffect, useState } from 'react'
import { FolderSync, GitBranch, Pencil, TerminalSquare, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { NaviroWorkspaceRoot } from '../../../../shared/naviro-workspace-types'
import { classifyNaviroRootAvailability } from '../../../../shared/naviro-workspace-policy'
import {
  openNaviroRootSourceControl,
  openNaviroRootTerminal,
  reconnectNaviroRoot
} from './naviro-root-runtime'
import {
  removeNaviroWorkspaceRoot,
  renameNaviroWorkspaceRoot,
  setNaviroWorkspaceRootAccess
} from './naviro-workspace-state'

type RootAvailability = 'checking' | 'available' | 'missing' | 'unbound'

function useRootAvailability(roots: readonly NaviroWorkspaceRoot[]): Record<string, RootAvailability> {
  const [availability, setAvailability] = useState<Record<string, RootAvailability>>({})
  useEffect(() => {
    let cancelled = false
    setAvailability(Object.fromEntries(roots.map((root) => [root.id, 'checking'])))
    void Promise.all(
      roots.map(async (root) => {
        if (!root.orcaWorkspaceId) {
          return [root.id, 'unbound'] as const
        }
        try {
          const exists = await window.api.fs.pathExists({
            filePath: root.path,
            connectionId: root.connectionId ?? undefined
          })
          return [root.id, classifyNaviroRootAvailability(root, exists)] as const
        } catch {
          return [root.id, 'missing'] as const
        }
      })
    ).then((entries) => {
      if (!cancelled) {
        setAvailability(Object.fromEntries(entries))
      }
    })
    return () => {
      cancelled = true
    }
  }, [roots])
  return availability
}

function availabilityLabel(value: RootAvailability): string {
  if (value === 'available') {
    return 'Available'
  }
  if (value === 'missing') {
    return 'Missing'
  }
  if (value === 'unbound') {
    return 'Needs connection'
  }
  return 'Checking'
}

export function NaviroWorkspaceRoots({
  roots
}: {
  roots: readonly NaviroWorkspaceRoot[]
}): React.JSX.Element {
  const availability = useRootAvailability(roots)
  const [renameRoot, setRenameRoot] = useState<NaviroWorkspaceRoot | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [removeRoot, setRemoveRoot] = useState<NaviroWorkspaceRoot | null>(null)
  const [reconnectingRootId, setReconnectingRootId] = useState<string | null>(null)

  if (roots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm font-medium">No roots yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Add folders from any parent or drive.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {roots.map((root) => {
          const status = availability[root.id] ?? 'checking'
          const connected = status === 'available'
          return (
            <article key={root.id} className="rounded-lg border border-border bg-card p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{root.name}</h3>
                    <Badge variant="outline">{root.kind}</Badge>
                    <Badge variant={connected ? 'secondary' : 'outline'}>{availabilityLabel(status)}</Badge>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={root.path}>
                    {root.path}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Rename ${root.name}`}
                  onClick={() => {
                    setRenameRoot(root)
                    setRenameValue(root.name)
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${root.name}`}
                  onClick={() => setRemoveRoot(root)}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Select
                  value={root.access}
                  onValueChange={(value) =>
                    setNaviroWorkspaceRootAccess(root.id, value as NaviroWorkspaceRoot['access'])
                  }
                >
                  <SelectTrigger size="sm" aria-label={`Access for ${root.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read-write">Read & write</SelectItem>
                    <SelectItem value="read-only">Read only</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!connected || root.kind !== 'git' || root.access === 'read-only'}
                  onClick={() => {
                    if (!openNaviroRootSourceControl(root)) {
                      toast.error('Unable to open this root')
                    }
                  }}
                >
                  <GitBranch /> Git
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!connected || root.access === 'read-only'}
                  title={root.access === 'read-only' ? 'Terminal is disabled for read-only roots' : undefined}
                  onClick={() => {
                    if (!openNaviroRootTerminal(root)) {
                      toast.error('Unable to open a terminal for this root')
                    }
                  }}
                >
                  <TerminalSquare /> Terminal
                </Button>
                {!connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reconnectingRootId === root.id}
                    onClick={async () => {
                      setReconnectingRootId(root.id)
                      const reconnected = await reconnectNaviroRoot(root)
                      setReconnectingRootId(null)
                      if (!reconnected) {
                        toast.error(`Could not reconnect ${root.name}`)
                      }
                    }}
                  >
                    <FolderSync className={reconnectingRootId === root.id ? 'animate-spin' : undefined} />
                    Reconnect
                  </Button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      <Dialog open={renameRoot !== null} onOpenChange={(open) => !open && setRenameRoot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename root</DialogTitle>
            <DialogDescription>This changes only the Naviro alias, never the folder name.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            aria-label="Root alias"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameRoot(null)}>Cancel</Button>
            <Button
              disabled={!renameValue.trim()}
              onClick={() => {
                if (renameRoot) {
                  renameNaviroWorkspaceRoot(renameRoot.id, renameValue)
                }
                setRenameRoot(null)
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeRoot !== null} onOpenChange={(open) => !open && setRemoveRoot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove root from workspace?</DialogTitle>
            <DialogDescription>
              {removeRoot?.path} stays on disk. Naviro removes only this workspace reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveRoot(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeRoot) {
                  removeNaviroWorkspaceRoot(removeRoot.id)
                }
                setRemoveRoot(null)
              }}
            >
              Remove reference
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
