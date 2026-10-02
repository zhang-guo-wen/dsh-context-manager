import { readFile, stat } from 'node:fs/promises'
import { basename } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent-preset-registry'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-workspace'
import { discoverBaselineInstructionFiles } from '@deepseek-ai/dsh-agent-instructions'
import { renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { inside, readDocumentFile, readableWorkspaceFile, revisionOf, saveExistingFile, saveWorkspacePrompt, workspacePromptPath } from './documents.ts'
import { knownContextFiles } from './known-files.ts'
import type { ContextRequest, ContextView, DocumentRequest, DocumentRow, DocumentValue, SaveDocumentRequest, WorkspaceRow } from './types.ts'

declare module '@deepseek-ai/cordis' { interface Context { contextManager: ContextManagerRemote } }

export class ContextManagerRemote extends TypertRemoteService {
  constructor(ctx: Context) { super(ctx, 'contextManager') }

  private workspaces(): WorkspaceRow[] {
    return (this.ctx.get('workspaceRegistry')?.list() ?? []).map(row => ({ id: row.id, title: row.title, path: row.path }))
  }

  private workspace(id?: string): WorkspaceRow | undefined {
    const rows = this.workspaces()
    if (!id) return rows[0]
    const row = rows.find(item => item.id === id)
    if (!row) throw new Error('Selected workspace no longer exists')
    return row
  }

  private async scope(presetId?: string): Promise<({ key: object } & AsyncDisposable) | undefined> {
    if (!presetId) return undefined
    const presets = this.ctx.get('agentPresets')
    if (!presets) throw new Error('Agent presets are unavailable')
    return await presets.acquireScope(presetId)
  }

  private async documents(workspace: WorkspaceRow, scope?: object): Promise<DocumentRow[]> {
    const result: DocumentRow[] = []
    const skills = this.ctx.get('skills')
    if (skills) {
      for (const skill of await skills.list({ cwd: workspace.path, scope })) {
        let size = 0
        if (skill.path) {
          try { size = (await stat(skill.path)).size } catch { /* virtual or removed source */ }
        } else {
          try { size = Buffer.byteLength((await skills.get(skill.name, { cwd: workspace.path, scope }))?.content ?? '') } catch { /* provider unavailable */ }
        }
        result.push({ kind: 'skill', id: skill.name, name: skill.name, description: skill.description,
          size, source: skill.source, provider: skill.provider, ...(skill.path ? { path: skill.path } : {}),
          editable: !!skill.path && inside(workspace.path, skill.path) })
      }
    }
    for (const file of await discoverBaselineInstructionFiles({ cwd: workspace.path })) {
      let size = 0
      try { size = (await stat(file.absolutePath)).size } catch { continue }
      result.push({ kind: 'rule', id: file.absolutePath, name: file.displayPath, description: file.displayPath,
        size, source: 'workspace-instructions', path: file.absolutePath, editable: inside(workspace.path, file.absolutePath) })
    }
    const seen = new Set(result.map(row => row.path))
    for (const file of await knownContextFiles(workspace.path)) {
      if (!seen.has(file.path)) { result.push(file); seen.add(file.path) }
    }
    const promptPath = workspacePromptPath(workspace.path)
    let promptSize = 0
    try { promptSize = (await stat(promptPath)).size } catch { /* not created yet */ }
    result.push({ kind: 'workspace-prompt', id: 'workspace', name: basename(promptPath),
      description: 'Workspace system prompt contributed by context manager', size: promptSize,
      source: 'context-manager', path: promptPath, editable: true })
    return result
  }

  @Remote('listContext')
  async listContext(request: ContextRequest): Promise<ContextView> {
    const workspaces = this.workspaces()
    const presets = (await this.ctx.get('agentPresets')?.list() ?? []).map(row => ({ id: row.id, name: row.name ?? row.id, ...(row.broken ? { broken: row.broken } : {}) }))
    const workspace = this.workspace(request.workspaceId)
    if (!workspace) return { workspaces, presets, documents: [], promptSections: [], runtimeContexts: [], systemPrompt: '' }
    await using lease = await this.scope(request.presetId)
    const documents = await this.documents(workspace, lease?.key)
    let promptSections: ContextView['promptSections'] = []
    let runtimeContexts: ContextView['runtimeContexts'] = []
    let systemPrompt = ''
    let promptError: string | undefined
    try {
      const assembly = await this.ctx.get('systemPrompt')?.assemble({ scope: lease?.key, cwd: workspace.path } as { scope?: object; cwd: string })
      if (assembly) {
        promptSections = assembly.sections.map(row => ({ name: row.name, text: row.text, size: Buffer.byteLength(row.text) }))
        runtimeContexts = assembly.contexts.map(row => ({ name: row.name, text: row.text, size: Buffer.byteLength(row.text) }))
        try { systemPrompt = renderPrompt(assembly) }
        catch (error) {
          promptError = String(error)
          systemPrompt = assembly.sections.map(section => section.text).filter(Boolean).join('\n\n')
        }
      }
    } catch (error) { promptError = String(error) }
    return { workspaces, presets, workspaceId: workspace.id, ...(request.presetId ? { presetId: request.presetId } : {}),
      documents, promptSections, runtimeContexts, systemPrompt, ...(promptError ? { promptError } : {}) }
  }

  private async row(request: DocumentRequest, workspace: WorkspaceRow, scope?: object): Promise<DocumentRow> {
    const row = (await this.documents(workspace, scope)).find(item => item.kind === request.kind && item.id === request.id)
    if (!row) throw new Error('Document is no longer available in this workspace and Agent view')
    return row
  }

  @Remote('readDocument')
  async readDocument(request: DocumentRequest): Promise<DocumentValue> {
    const workspace = this.workspace(request.workspaceId)
    if (!workspace) throw new Error('Select a workspace first')
    await using lease = await this.scope(request.presetId)
    const row = await this.row(request, workspace, lease?.key)
    if (row.kind === 'workspace-prompt') {
      try {
        const file = await readableWorkspaceFile(workspace.path, workspacePromptPath(workspace.path))
        const current = await readDocumentFile(file)
        return { ...row, content: current.content, revision: current.revision }
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return { ...row, content: '', revision: null }
        throw error
      }
    }
    if (row.path) {
      const file = row.editable ? await readableWorkspaceFile(workspace.path, row.path) : row.path
      const current = await readDocumentFile(file)
      return { ...row, content: current.content, revision: current.revision }
    }
    const content = (await this.ctx.get('skills')?.get(row.id, { cwd: workspace.path, scope: lease?.key }))?.content
    if (content === undefined) throw new Error('Skill content is unavailable')
    return { ...row, content, revision: revisionOf(content) }
  }

  @Remote('saveDocument')
  async saveDocument(request: SaveDocumentRequest): Promise<DocumentValue> {
    const workspace = this.workspace(request.workspaceId)
    if (!workspace) throw new Error('Select a workspace first')
    await using lease = await this.scope(request.presetId)
    const row = await this.row(request, workspace, lease?.key)
    if (!row.editable) throw new Error('This document is owned by another provider and cannot be edited here')
    const revision = row.kind === 'workspace-prompt'
      ? await saveWorkspacePrompt(workspace.path, request.content, request.revision)
      : await saveExistingFile(workspace.path, row.path!, request.content, request.revision)
    return { ...row, size: Buffer.byteLength(request.content), content: request.content, revision }
  }
}
