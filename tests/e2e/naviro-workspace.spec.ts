import path from 'node:path'
import { expect, test } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'

const CATALOG_KEY = 'naviro.workspace.catalog.v1'

test.describe('Naviro Workbench', () => {
  test('creates and reopens a named workspace', async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await orcaPage.evaluate((key) => window.localStorage.removeItem(key), CATALOG_KEY)
    await orcaPage.reload()
    await waitForSessionReady(orcaPage)

    await orcaPage.getByRole('button', { name: 'Projects', exact: true }).click()
    await expect(orcaPage.getByRole('dialog', { name: 'New workspace' })).toBeVisible()
    await orcaPage.getByRole('textbox', { name: 'Workspace name' }).fill('Release Desk')
    await orcaPage.getByRole('button', { name: 'Create workspace' }).click()
    await expect(orcaPage.getByRole('heading', { name: 'Release Desk' })).toBeVisible()

    await orcaPage.reload()
    await waitForSessionReady(orcaPage)
    await orcaPage.getByRole('button', { name: 'Projects', exact: true }).click()
    await expect(orcaPage.getByRole('heading', { name: 'Release Desk' })).toBeVisible()
  })

  test('renders unrelated roots separately in Explorer and search scope', async ({
    orcaPage,
    testRepoPath
  }) => {
    await waitForSessionReady(orcaPage)
    const workspaceOwner = await orcaPage.evaluate((repoPath) => {
      const state = window.__store?.getState()
      const worktree = state?.allWorktrees().find((candidate) => candidate.path === repoPath)
      return worktree ? { repoId: worktree.repoId, worktreeId: worktree.id } : null
    }, testRepoPath)
    expect(workspaceOwner).not.toBeNull()
    const unrelatedPath = path.join(path.dirname(testRepoPath), 'unrelated-documents')
    await orcaPage.evaluate(
      ({ key, repoPath, unrelatedPath, owner }) => {
        const now = Date.now()
        window.localStorage.setItem(
          key,
          JSON.stringify({
            schemaVersion: 1,
            activeWorkspaceId: 'workspace-e2e',
            workspaces: [
              {
                id: 'workspace-e2e',
                name: 'Multi-root Desk',
                roots: [
                  {
                    id: 'root-client',
                    name: 'Client',
                    path: repoPath,
                    kind: 'git',
                    access: 'read-write',
                    executionHostId: 'local',
                    orcaProjectId: owner?.repoId,
                    orcaWorkspaceId: owner?.worktreeId
                  },
                  {
                    id: 'root-documents',
                    name: 'Documents',
                    path: unrelatedPath,
                    kind: 'folder',
                    access: 'read-only'
                  }
                ],
                primaryRootId: 'root-client',
                createdAt: now,
                updatedAt: now
              }
            ]
          })
        )
      },
      { key: CATALOG_KEY, repoPath: testRepoPath, unrelatedPath, owner: workspaceOwner }
    )
    await orcaPage.reload()
    await waitForSessionReady(orcaPage)
    await orcaPage.getByRole('button', { name: 'Files', exact: true }).click()

    await expect(orcaPage.getByRole('button', { name: /Client/ })).toBeVisible()
    await expect(orcaPage.getByRole('button', { name: /Documents/ })).toBeVisible()
    await expect(orcaPage.getByText('Client', { exact: true }).last()).toBeVisible()
    await expect(orcaPage.getByText('Documents', { exact: true }).last()).toBeVisible()
  })
})
