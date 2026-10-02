import { createHash } from 'node:crypto'
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

export const MAX_DOCUMENT_BYTES = 1_048_576

export function revisionOf(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export function inside(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel === '' || rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

export async function readableWorkspaceFile(root: string, path: string): Promise<string> {
  const canonicalRoot = await realpath(root)
  const canonicalFile = await realpath(path)
  if (!inside(canonicalRoot, canonicalFile)) throw new Error('Document is outside the selected workspace')
  const info = await stat(canonicalFile)
  if (!info.isFile() || info.size > MAX_DOCUMENT_BYTES) throw new Error('Document is not a supported text file')
  return canonicalFile
}

export async function readDocumentFile(path: string): Promise<{ content: string; revision: string }> {
  const content = await readFile(path, 'utf8')
  if (Buffer.byteLength(content) > MAX_DOCUMENT_BYTES) throw new Error('Document is too large')
  return { content, revision: revisionOf(content) }
}

export async function saveExistingFile(root: string, path: string, content: string, revision: string | null): Promise<string> {
  if (Buffer.byteLength(content) > MAX_DOCUMENT_BYTES) throw new Error('Document is too large')
  const canonicalFile = await readableWorkspaceFile(root, path)
  const current = await readDocumentFile(canonicalFile)
  if (revision !== current.revision) throw new Error('Document changed since it was opened; reload before saving')
  await writeFile(canonicalFile, content, 'utf8')
  return revisionOf(content)
}

export function workspacePromptPath(root: string): string {
  return join(root, '.dsh', 'context-manager', 'system-prompt.md')
}

export async function saveWorkspacePrompt(root: string, content: string, revision: string | null): Promise<string> {
  if (Buffer.byteLength(content) > MAX_DOCUMENT_BYTES) throw new Error('Document is too large')
  const canonicalRoot = await realpath(root)
  const dshDirectory = join(root, '.dsh')
  await mkdir(dshDirectory, { recursive: true })
  if (!inside(canonicalRoot, await realpath(dshDirectory))) throw new Error('Prompt directory is outside the selected workspace')
  const directory = dirname(workspacePromptPath(root))
  await mkdir(directory, { recursive: true })
  const canonicalDirectory = await realpath(directory)
  if (!inside(canonicalRoot, canonicalDirectory)) throw new Error('Prompt directory is outside the selected workspace')
  const target = resolve(canonicalDirectory, 'system-prompt.md')
  let current: { content: string; revision: string } | undefined
  try {
    const canonicalFile = await realpath(target)
    if (!inside(canonicalRoot, canonicalFile)) throw new Error('Prompt file is outside the selected workspace')
    current = await readDocumentFile(canonicalFile)
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
  }
  if ((current?.revision ?? null) !== revision) throw new Error('Prompt changed since it was opened; reload before saving')
  await writeFile(target, content, 'utf8')
  return revisionOf(content)
}
