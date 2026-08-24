import { ArrowRight, Bot, Inbox, NotebookPen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { translate } from '@/i18n/i18n'
import type { NaviroSurface } from './naviro-shell-state'
import { setNaviroSurface } from './naviro-shell-state'

const SURFACE_COPY: Record<
  Exclude<NaviroSurface, 'workbench' | 'projects' | 'files'>,
  { title: () => string; description: () => string; icon: typeof Sparkles }
> = {
  home: {
    title: () => translate('naviro.surface.home.title', 'A calm place for all your work'),
    description: () =>
      translate(
        'naviro.surface.home.description',
        'Bring several folders together, keep their boundaries clear, and choose where each action runs.'
      ),
    icon: Sparkles
  },
  assistant: {
    title: () => translate('naviro.surface.assistant.title', 'Assistant'),
    description: () =>
      translate(
        'naviro.surface.assistant.description',
        'The assistant surface is reserved for a later milestone. Orca agent sessions remain available in the workbench.'
      ),
    icon: Sparkles
  },
  inbox: {
    title: () => translate('naviro.surface.inbox.title', 'Inbox'),
    description: () =>
      translate(
        'naviro.surface.inbox.description',
        'A unified inbox will arrive in a later milestone. This shell entry is intentionally non-destructive.'
      ),
    icon: Inbox
  },
  notes: {
    title: () => translate('naviro.surface.notes.title', 'Notes'),
    description: () =>
      translate(
        'naviro.surface.notes.description',
        'Workspace-scoped notes are planned after the multi-root foundation is stable.'
      ),
    icon: NotebookPen
  },
  agents: {
    title: () => translate('naviro.surface.agents.title', 'Agents'),
    description: () =>
      translate(
        'naviro.surface.agents.description',
        'Existing Orca agents continue to run in the workbench while Naviro orchestration is developed.'
      ),
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
          {translate('naviro.brand', 'Naviro')}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{copy.title()}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {copy.description()}
        </p>
        {surface === 'home' ? (
          <Button className="mt-6" onClick={() => setNaviroSurface('projects')}>
            {translate('naviro.surface.openWorkspace', 'Open a workspace')}
            <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </section>
    </main>
  )
}
