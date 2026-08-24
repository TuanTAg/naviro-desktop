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
import { translate } from '@/i18n/i18n'
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
    if (catalog.workspaces.length === 0) {
      setCreateDialogOpen(true)
    }
  }, [catalog.workspaces.length])

  const addRoots = async (): Promise<void> => {
    if (!workspace) {
      return
    }
    const paths = await window.api.repos.pickFolders()
    if (paths.length === 0) {
      return
    }
    setAddingRoots(true)
    const result = await addPickedNaviroRoots(paths)
    setAddingRoots(false)
    if (result.added.length > 0) {
      const count = result.added.length
      toast.success(
        count === 1
          ? translate('naviro.workspace.addedRoot', 'Added {{count}} root', { count })
          : translate('naviro.workspace.addedRoots', 'Added {{count}} roots', { count })
      )
    }
    result.errors.forEach((error) => toast.error(error.path, { description: error.message }))
  }

  const saveWorkspace = async (): Promise<void> => {
    if (!workspace) {
      return
    }
    const result = await window.api.fs.saveDownloadedFile({
      suggestedName: safeWorkspaceFilename(workspace.name),
      content: serializeNaviroWorkspace(workspace),
      encoding: 'utf8'
    })
    if (!result.canceled) {
      toast.success(translate('naviro.workspace.saved', 'Workspace saved'), {
        description: result.destinationPath
      })
    }
  }

  const importWorkspaceFile = async (file: File): Promise<void> => {
    try {
      const document = parseNaviroWorkspaceDocument(JSON.parse(await file.text()))
      importAndActivateNaviroWorkspace(document.workspace)
      let disconnectedCount = 0
      for (const root of document.workspace.roots) {
        if (!(await reconnectNaviroRoot(root))) {
          disconnectedCount += 1
        }
      }
      if (disconnectedCount > 0) {
        toast.warning(
          translate(
            'naviro.workspace.openedWithUnavailableRoots',
            'Workspace opened with unavailable roots'
          ),
          {
            description:
              disconnectedCount === 1
                ? translate(
                    'naviro.workspace.rootNeedsReconnection',
                    '{{count}} root needs reconnection.',
                    { count: disconnectedCount }
                  )
                : translate(
                    'naviro.workspace.rootsNeedReconnection',
                    '{{count}} roots need reconnection.',
                    { count: disconnectedCount }
                  )
          }
        )
      } else {
        toast.success(translate('naviro.workspace.opened', 'Workspace opened'))
      }
    } catch (error) {
      toast.error(translate('naviro.workspace.openFailed', 'Could not open workspace'), {
        description: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return (
    <main className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <div className="mr-auto min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {translate('naviro.workspace.label', 'Naviro workspace')}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {workspace?.name ?? translate('naviro.workspace.noneOpen', 'No workspace open')}
          </h1>
        </div>
        {catalog.workspaces.length > 0 ? (
          <Select value={workspace?.id ?? undefined} onValueChange={activateNaviroWorkspace}>
            <SelectTrigger
              size="sm"
              className="max-w-52"
              aria-label={translate('naviro.workspace.recentAria', 'Recent workspaces')}
            >
              <SelectValue placeholder={translate('naviro.workspace.openRecent', 'Open recent')} />
            </SelectTrigger>
            <SelectContent>
              {catalog.workspaces.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus /> {translate('naviro.workspace.new', 'New')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload /> {translate('naviro.workspace.open', 'Open')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".naviro-workspace,.json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void importWorkspaceFile(file)
            }
            event.currentTarget.value = ''
          }}
        />
        <Button variant="outline" size="sm" disabled={!workspace} onClick={() => void saveWorkspace()}>
          <Download /> {translate('naviro.workspace.save', 'Save')}
        </Button>
        <Button size="sm" disabled={!workspace || addingRoots} onClick={() => void addRoots()}>
          <FolderPlus className={addingRoots ? 'animate-pulse' : undefined} />
          {translate('naviro.workspace.addRoots', 'Add roots')}
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
            {view === 'projects'
              ? translate('naviro.shell.projects', 'Projects')
              : translate('naviro.shell.files', 'Files')}
          </button>
        ))}
      </div>

      {!workspace ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-lg font-semibold">
              {translate('naviro.workspace.createOrOpen', 'Create or open a workspace')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {translate(
                'naviro.workspace.groupsRoots',
                'A workspace groups roots without changing them on disk.'
              )}
            </p>
          </div>
        </div>
      ) : initialView === 'projects' ? (
        <div className="scrollbar-sleek min-h-0 flex-1 overflow-auto p-5">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold">
                {translate('naviro.workspace.roots', 'Roots')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {translate(
                  'naviro.workspace.rootBoundaries',
                  'Each root keeps its own filesystem, Git, access, and execution context.'
                )}
              </p>
            </div>
            <NaviroWorkspaceRoots roots={workspace.roots} />
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
          <section className="min-h-0 overflow-hidden">
            <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {translate('naviro.workspace.explorer', 'Explorer')}
            </div>
            <div className="h-[calc(100%-37px)] min-h-0"><NaviroWorkspaceExplorer roots={workspace.roots} /></div>
          </section>
          <section className="min-h-0 overflow-hidden">
            <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {translate('naviro.workspace.search', 'Workspace search')}
            </div>
            <div className="h-[calc(100%-37px)] min-h-0"><NaviroWorkspaceSearch workspaceId={workspace.id} roots={workspace.roots} /></div>
          </section>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate('naviro.workspace.newTitle', 'New workspace')}</DialogTitle>
            <DialogDescription>
              {translate(
                'naviro.workspace.newDescription',
                'Existing workspaces stay in your recent list.'
              )}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder={translate('naviro.workspace.name', 'Workspace name')}
            aria-label={translate('naviro.workspace.name', 'Workspace name')}
            autoFocus
          />
          <DialogFooter>
            {catalog.workspaces.length > 0 ? (
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {translate('naviro.common.cancel', 'Cancel')}
              </Button>
            ) : null}
            <Button
              disabled={!workspaceName.trim()}
              onClick={() => {
                createAndActivateNaviroWorkspace(workspaceName)
                setWorkspaceName('')
                setCreateDialogOpen(false)
              }}
            >
              {translate('naviro.workspace.create', 'Create workspace')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
