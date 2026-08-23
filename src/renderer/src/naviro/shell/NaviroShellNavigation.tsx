import {
  Bot,
  CalendarClock,
  CheckSquare2,
  Files,
  FolderKanban,
  GitBranch,
  Home,
  Inbox,
  NotebookPen,
  Sparkles,
  TerminalSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import {
  setNaviroSurface,
  showNaviroWorkbench,
  useNaviroShellSnapshot,
  type NaviroSurface
} from './naviro-shell-state'

type NavItem = {
  label: string
  icon: typeof Home
  surface: Exclude<NaviroSurface, 'workbench'>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: Home, surface: 'home' },
  { label: 'Assistant', icon: Sparkles, surface: 'assistant' },
  { label: 'Inbox', icon: Inbox, surface: 'inbox' },
  { label: 'Notes', icon: NotebookPen, surface: 'notes' },
  { label: 'Projects', icon: FolderKanban, surface: 'projects' },
  { label: 'Files', icon: Files, surface: 'files' },
  { label: 'Agents', icon: Bot, surface: 'agents' }
]

function navigationButtonClass(active: boolean): string {
  return cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium tracking-tight transition-colors',
    active
      ? 'bg-worktree-sidebar-accent text-worktree-sidebar-accent-foreground'
      : 'text-worktree-sidebar-foreground/60 hover:bg-worktree-sidebar-foreground/8'
  )
}

export function NaviroShellNavigation(): React.JSX.Element {
  const { activeSurface } = useNaviroShellSnapshot()
  const activeView = useAppStore((state) => state.activeView)
  const openTaskPage = useAppStore((state) => state.openTaskPage)
  const openAutomationsPage = useAppStore((state) => state.openAutomationsPage)

  const openSurface = (surface: NavItem['surface']): void => {
    setNaviroSurface(surface)
    useAppStore.getState().setActiveView('terminal')
  }

  const openWorkbench = (): void => {
    showNaviroWorkbench()
    useAppStore.getState().setActiveView('terminal')
  }

  const openGit = (): void => {
    openWorkbench()
    const state = useAppStore.getState()
    state.setRightSidebarTab('source-control')
    state.setRightSidebarOpen(true)
  }

  return (
    <nav className="flex flex-col gap-0.5 px-2 pt-2" aria-label="Naviro">
      <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-worktree-sidebar-foreground/35">
        Naviro
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = activeView === 'terminal' && activeSurface === item.surface
        return (
          <button
            key={item.surface}
            type="button"
            onClick={() => openSurface(item.surface)}
            aria-current={active ? 'page' : undefined}
            className={navigationButtonClass(active)}
          >
            <Icon
              className={cn('size-4 shrink-0', !active && 'text-worktree-sidebar-foreground/30')}
              strokeWidth={active ? 2.25 : 1.75}
            />
            <span>{item.label}</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => {
          showNaviroWorkbench()
          openTaskPage()
        }}
        aria-current={activeView === 'tasks' ? 'page' : undefined}
        className={navigationButtonClass(activeView === 'tasks')}
      >
        <CheckSquare2 className="size-4 shrink-0 text-worktree-sidebar-foreground/30" />
        <span>Tasks</span>
      </button>
      <button
        type="button"
        onClick={() => {
          showNaviroWorkbench()
          openAutomationsPage()
        }}
        aria-current={activeView === 'automations' ? 'page' : undefined}
        className={navigationButtonClass(activeView === 'automations')}
      >
        <CalendarClock className="size-4 shrink-0 text-worktree-sidebar-foreground/30" />
        <span>Automations</span>
      </button>
      <button
        type="button"
        onClick={openGit}
        className={navigationButtonClass(false)}
        title="Open source control for the active root"
      >
        <GitBranch className="size-4 shrink-0 text-worktree-sidebar-foreground/30" />
        <span>Git</span>
      </button>
      <button
        type="button"
        onClick={openWorkbench}
        aria-current={
          activeView === 'terminal' && activeSurface === 'workbench' ? 'page' : undefined
        }
        className={navigationButtonClass(
          activeView === 'terminal' && activeSurface === 'workbench'
        )}
      >
        <TerminalSquare className="size-4 shrink-0 text-worktree-sidebar-foreground/30" />
        <span>Terminal</span>
      </button>
      <div className="mx-2 mt-2 border-t border-worktree-sidebar-border/70 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-worktree-sidebar-foreground/35">
        Orca tools
      </div>
    </nav>
  )
}
