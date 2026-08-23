import { useSyncExternalStore } from 'react'

export type NaviroSurface =
  | 'workbench'
  | 'home'
  | 'assistant'
  | 'inbox'
  | 'notes'
  | 'projects'
  | 'files'
  | 'agents'

type NaviroShellSnapshot = {
  activeSurface: NaviroSurface
}

let snapshot: NaviroShellSnapshot = { activeSurface: 'workbench' }
const listeners = new Set<() => void>()

export function getNaviroShellSnapshot(): NaviroShellSnapshot {
  return snapshot
}

export function setNaviroSurface(activeSurface: NaviroSurface): void {
  if (snapshot.activeSurface === activeSurface) {
    return
  }
  snapshot = { activeSurface }
  listeners.forEach((listener) => listener())
}

export function showNaviroWorkbench(): void {
  setNaviroSurface('workbench')
}

export function useNaviroShellSnapshot(): NaviroShellSnapshot {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getNaviroShellSnapshot,
    getNaviroShellSnapshot
  )
}
