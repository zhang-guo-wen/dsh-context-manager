import { afterEach, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readDocumentFile, saveExistingFile, saveWorkspacePrompt, workspacePromptPath } from '../src/documents.ts'
import { knownContextFiles } from '../src/known-files.ts'

const roots: string[] = []
async function temp(): Promise<string> { const root = await mkdtemp(join(tmpdir(), 'dsh-context-')); roots.push(root); return root }
afterEach(async () => { await Promise.all(roots.splice(0).map(path => rm(path, { recursive: true, force: true }))) })

it('edits a workspace document only when its revision still matches', async () => {
  const root = await temp(), path = join(root, 'AGENTS.md')
  await writeFile(path, 'Before')
  const { revision } = await readDocumentFile(path)
  await expect(saveExistingFile(root, path, 'After', revision)).resolves.toMatch(/^[a-f0-9]{64}$/)
  await expect(saveExistingFile(root, path, 'Stale', revision)).rejects.toThrow('changed since it was opened')
  expect(await readFile(path, 'utf8')).toBe('After')
})

it('rejects files whose real path escapes the workspace', async () => {
  const root = await temp(), outside = await temp(), target = join(outside, 'private.md')
  await writeFile(target, 'private')
  const link = join(root, 'linked.md')
  await symlink(target, link, 'file')
  await expect(saveExistingFile(root, link, 'overwrite', null)).rejects.toThrow('outside the selected workspace')
  expect(await readFile(target, 'utf8')).toBe('private')
})

it('creates an editable workspace prompt and rejects stale saves', async () => {
  const root = await temp()
  const revision = await saveWorkspacePrompt(root, 'Use concise answers.', null)
  expect(await readFile(workspacePromptPath(root), 'utf8')).toBe('Use concise answers.')
  await expect(saveWorkspacePrompt(root, 'Changed', null)).rejects.toThrow('changed since it was opened')
  await expect(saveWorkspacePrompt(root, 'Changed', revision)).resolves.toMatch(/^[a-f0-9]{64}$/)
})

it('discovers Claude rule candidates without claiming they were injected', async () => {
  const root = await temp()
  await mkdir(join(root, '.git'))
  await mkdir(join(root, '.claude', 'rules', 'nested'), { recursive: true })
  await mkdir(join(root, 'packages', 'app', '.claude'), { recursive: true })
  await writeFile(join(root, '.claude', 'rules', 'nested', 'review.md'), '---\npaths: ["src/**"]\n---\nReview changes.')
  await writeFile(join(root, 'packages', 'CLAUDE.md'), 'Package instructions')
  await writeFile(join(root, 'packages', 'app', '.claude', 'CLAUDE.md'), 'App instructions')
  const rows = await knownContextFiles(join(root, 'packages', 'app'))
  expect(rows).toContainEqual(expect.objectContaining({ kind: 'rule', name: join('.claude', 'rules', 'nested', 'review.md'), source: 'claude-compat:project-candidate', editable: false }))
  expect(rows).toContainEqual(expect.objectContaining({ kind: 'prompt-file', name: join('packages', 'CLAUDE.md'), source: 'claude-compat:project-candidate' }))
  expect(rows).toContainEqual(expect.objectContaining({ kind: 'prompt-file', name: join('packages', 'app', '.claude', 'CLAUDE.md'), editable: true }))
})
