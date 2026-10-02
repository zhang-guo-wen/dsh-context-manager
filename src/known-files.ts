import { readdir, stat } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import type { DocumentRow } from './types.ts'
import { inside } from './documents.ts'

async function fileSize(path: string): Promise<number | undefined> {
  try { const info = await stat(path); return info.isFile() ? info.size : undefined }
  catch { return undefined }
}

async function projectRoot(cwd: string): Promise<string> {
  let path = resolve(cwd)
  for (;;) {
    try { await stat(join(path, '.git')); return path } catch { /* walk upward */ }
    const parent = dirname(path)
    if (parent === path) return resolve(cwd)
    path = parent
  }
}

function directoryChain(root: string, cwd: string): string[] {
  const chain = [resolve(cwd)]
  while (chain[0] !== root) {
    const parent = dirname(chain[0]!)
    if (parent === chain[0]) return [resolve(cwd)]
    chain.unshift(parent)
  }
  return chain
}

async function markdownFiles(root: string): Promise<string[]> {
  const found: string[] = [], pending = [root]
  while (pending.length && found.length < 1000) {
    const current = pending.pop()!
    let entries: Dirent[]
    try { entries = await readdir(current, { withFileTypes: true }) }
    catch { continue }
    for (const entry of entries) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) pending.push(path)
      else if (entry.isFile() && entry.name.endsWith('.md')) found.push(path)
    }
  }
  return found.sort()
}

/** Known file sources are candidates; provider switches and path-scoped activation are separate. */
export async function knownContextFiles(workspace: string): Promise<DocumentRow[]> {
  const root = await projectRoot(workspace)
  const claudeHome = process.env.CLAUDE_CONFIG_DIR ?? process.env.CLAUDE_HOME ?? join(homedir(), '.claude')
  const files: Array<{ path: string; kind: 'rule' | 'prompt-file'; source: string }> = []
  for (const path of await markdownFiles(join(root, '.claude', 'rules'))) files.push({ path, kind: 'rule', source: 'claude-compat:project-candidate' })
  for (const path of await markdownFiles(join(claudeHome, 'rules'))) files.push({ path, kind: 'rule', source: 'claude-compat:user-candidate' })
  files.push({ path: join(claudeHome, 'CLAUDE.md'), kind: 'prompt-file', source: 'claude-compat:user-candidate' })
  for (const directory of directoryChain(root, workspace)) {
    for (const path of [join(directory, 'CLAUDE.md'), join(directory, '.claude', 'CLAUDE.md'),
      join(directory, 'CLAUDE.local.md')]) {
      files.push({ path, kind: 'prompt-file', source: 'claude-compat:project-candidate' })
    }
  }
  const result: DocumentRow[] = []
  for (const { path, kind, source } of files) {
    const size = await fileSize(path)
    if (size === undefined) continue
    result.push({ kind, id: path, name: inside(root, path) ? relative(root, path) : path,
      description: source, size, source, path, editable: inside(workspace, path) })
  }
  return result
}
