import { useEffect, useRef, useState } from 'react'
import { Download, FolderPlus, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
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
import { cn } from '@/lib/utils'
import { setNaviroSurface } from '@/naviro/shell/naviro-shell-state'
import { parseNaviroWorkspaceDocument, serializeNaviroWorkspace } from '../../../../shared/naviro-workspace-schema'
import { addPickedNaviroRoots, reconnectNaviroRoot } from './naviro-root-runtime'
import { NaviroWorkspaceExplorer } from './NaviroWorkspaceExplorer'
import { NaviroWorkspaceRoots } from './NaviroWorkspaceRoots'
import { NaviroWorkspaceSearch } from './NaviroWorkspaceSearch'
import {
  activateNaviroWorkspace,
  createAndActivateNaviroWorkspace,
  importAndActivateNaviroWorkspace,
  useNaviroWorkspaceCatalog
} from './naviro-workspace-state'

export type NaviroWorkspacePageView = 'projects' | 'files'

function safeWorkspaceFilename(name: string): string {
  const safeName = name.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '')
  return `${safeName || 'workspace'}.naviro-workspace`
}

export default function NaviroWorkspacePage({
  initialView
}: {
  initialView: NaviroWorkspacePageView
}): React.JSX.Element {
  const catalog = useNaviroWorkspaceCatalog()
  const workspace =
    catalog.workspaces.find((item) => item.id === catalog.activeWorkspaceId) ?? null
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [addingRoots, setAddingRoots] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (catalog.workspaces.length === 0) setCreateDialogOpen(true)
  }, [catalog.workspaces.length])

  const addRoots = async (): Promise<void> => {
    if (!workspace) return
    const paths = await window.api.repos.pickFolders()
    if (paths.length === 0) return
    setAddingRoots(true)
    const result = await addPickedNaviroRoots(paths)
    setAddingRoots(false)
    if (result.added.length > 0) toast.success(`Added ${result.added.length} root${result.added.length === 1 ? '' : 's'}`)
    result.errors.forEach((error) => toast.error(error.path, { description: error.message }))
  }

  const saveWorkspace = async (): Promise<void> => {
    if (!workspace) return
    const result = await window.api.fs.saveDownloadedFile({
      suggestedName: safeWorkspaceFilename(workspace.name),
      content: serializeNaviroWorkspace(workspace),
      encoding: 'utf8'
    })
    if (!result.canceled) toast.success('Workspace saved', { description: result.destinationPath })
  }

  const importWorkspaceFile = async (file: File): Promise<void> => {
    try {
      const document = parseNaviroWorkspaceDocument(JSON.parse(await file.text()))
      importAndActivateNaviroWorkspace(document.workspace)
      let disconnectedCount = 0
      for (const root of document.workspace.roots) {
        if (!(await reconnectNaviroRoot(root))) disconnectedCount += 1
      }
      if (disconnectedCount > 0) {
        toast.warning('Workspace opened with unavailable roots', {
          description: `${disconnectedCount} root${disconnectedCount === 1 ? '' : 's'} need reconnection.`
        })
      } else {
        toast.success('Workspace opened')
      }
    } catch (error) {
      toast.error('Could not open workspace', {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return (
    <main className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <div className="mr-auto min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Naviro workspace</p>
          <h1 className="truncate text-lg font-semibold tracking-tight">{workspace?.name ?? 'No workspace open'}</h1>
        </div>
        {catalog.workspaces.length > 0 ? (
          <Select value={workspace?.id ?? undefined} onValueChange={activateNaviroWorkspace}>
            <SelectTrigger size="sm" className="max-w-52" aria-label="Recent workspaces">
              <SelectValue placeholder="Open recent" />
            </SelectTrigger>
            <SelectContent>
              {catalog.workspaces.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus /> New
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload /> Open
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".naviro-workspace,.json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void importWorkspaceFile(file)
            event.currentTarget.value = ''
          }}
        />
        <Button variant="outline" size="sm" disabled={!workspace} onClick={() => void saveWorkspace()}>
          <Download /> Save
        </Button>
        <Button size="sm" disabled={!workspace || addingRoots} onClick={() => void addRoots()}>
          <FolderPlus className={addingRoots ? 'animate-pulse' : undefined} /> Add roots
        </Button>
      </header>

      <div className="flex items-center gap-1 border-b border-border px-5 py-2">
        {(['projects', 'files'] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setNaviroSurface(view)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
              initialView === view ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={initialView === view ? 'page' : undefined}
          >
            {view}
          </button>
        ))}
      </div>

      {!workspace ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-lg font-semibold">Create or open a workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">A workspace groups roots without changing them on disk.</p>
          </div>
        </div>
      ) : initialView === 'projects' ? (
        <div className="scrollbar-sleek min-h-0 flex-1 overflow-auto p-5">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Roots</h2>
              <p className="mt-1 text-sm text-muted-foreground">Each root keeps its own filesystem, Git, access, and execution context.</p>
            </div>
            <NaviroWorkspaceRoots roots={workspace.roots} />
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
          <section className="min-h-0 overflow-hidden">
            <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explorer</div>
            <div className="h-[calc(100%-37px)] min-h-0"><NaviroWorkspaceExplorer roots={workspace.roots} /></div>
          </section>
          <section className="min-h-0 overflow-hidden">
            <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspace search</div>
            <div className="h-[calc(100%-37px)] min-h-0"><NaviroWorkspaceSearch workspaceId={workspace.id} roots={workspace.roots} /></div>
          </section>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New workspace</DialogTitle>
            <DialogDescription>Existing workspaces stay in your recent list.</DialogDescription>
          </DialogHeader>
          <Input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Workspace name"
            aria-label="Workspace name"
            autoFocus
          />
          <DialogFooter>
            {catalog.workspaces.length > 0 ? <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button> : null}
            <Button
              disabled={!workspaceName.trim()}
              onClick={() => {
                createAndActivateNaviroWorkspace(workspaceName)
                setWorkspaceName('')
                setCreateDialogOpen(false)
              }}
            >
              Create workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
