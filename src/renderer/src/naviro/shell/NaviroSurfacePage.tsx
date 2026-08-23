import { ArrowRight, Bot, Inbox, NotebookPen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NaviroSurface } from './naviro-shell-state'
import { setNaviroSurface } from './naviro-shell-state'

const SURFACE_COPY: Record<
  Exclude<NaviroSurface, 'workbench' | 'projects' | 'files'>,
  { title: string; description: string; icon: typeof Sparkles }
> = {
  home: {
    title: 'A calm place for all your work',
    description: 'Bring several folders together, keep their boundaries clear, and choose where each action runs.',
    icon: Sparkles
  },
  assistant: {
    title: 'Assistant',
    description: 'The assistant surface is reserved for a later milestone. Orca agent sessions remain available in the workbench.',
    icon: Sparkles
  },
  inbox: {
    title: 'Inbox',
    description: 'A unified inbox will arrive in a later milestone. This shell entry is intentionally non-destructive.',
    icon: Inbox
  },
  notes: {
    title: 'Notes',
    description: 'Workspace-scoped notes are planned after the multi-root foundation is stable.',
    icon: NotebookPen
  },
  agents: {
    title: 'Agents',
    description: 'Existing Orca agents continue to run in the workbench while Naviro orchestration is developed.',
    icon: Bot
  }
}

export function NaviroSurfacePage({ surface }: { surface: NaviroSurface }): React.JSX.Element | null {
  if (surface === 'workbench' || surface === 'projects' || surface === 'files') {
    return null
  }
  const copy = SURFACE_COPY[surface]
  const Icon = copy.icon
  return (
    <main className="flex h-full min-h-0 flex-1 items-center justify-center bg-background px-8">
      <section className="w-full max-w-2xl rounded-xl border border-border bg-card p-8 shadow-xs">
        <Icon className="mb-5 size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Naviro
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
        {surface === 'home' ? (
          <Button className="mt-6" onClick={() => setNaviroSurface('projects')}>
            Open a workspace
            <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </section>
    </main>
  )
}
