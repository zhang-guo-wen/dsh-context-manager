export type DocumentKind = 'skill' | 'rule' | 'prompt-file' | 'workspace-prompt'

export interface WorkspaceRow { id: string; title: string; path: string }
export interface PresetRow { id: string; name: string; broken?: string }
export interface DocumentRow {
  kind: DocumentKind
  id: string
  name: string
  description: string
  size: number
  source: string
  provider?: string
  path?: string
  editable: boolean
}
export interface PromptRow { name: string; text: string; size: number }
export interface ContextView {
  workspaces: WorkspaceRow[]
  presets: PresetRow[]
  workspaceId?: string
  presetId?: string
  documents: DocumentRow[]
  promptSections: PromptRow[]
  runtimeContexts: PromptRow[]
  systemPrompt: string
  promptError?: string
}
export interface ContextRequest { workspaceId?: string; presetId?: string }
export interface DocumentRequest extends ContextRequest { kind: DocumentKind; id: string }
export interface DocumentValue extends DocumentRow { content: string; revision: string | null }
export interface SaveDocumentRequest extends DocumentRequest { content: string; revision: string | null }
