import { readFileSync, realpathSync, statSync } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-workspace'
import { inside, MAX_DOCUMENT_BYTES, workspacePromptPath } from './documents.ts'
import { ContextManagerRemote } from './remote-service.ts'

export const name = 'context-manager'
export const inject = ['systemPrompt']

function workspaceCwd(context: { scope?: object; cwd?: string }): string | undefined {
  if (context.cwd) return context.cwd
  const scoped = context.scope as { session?: { header?: { cwd?: string } } } | undefined
  return scoped?.session?.header?.cwd
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.get('systemPrompt')!.section({
    name: 'context-manager:workspace', order: 10_300, interpolate: false,
    text: context => {
      const cwd = workspaceCwd(context)
      if (!cwd) return ''
      const workspace = ctx.get('workspaceRegistry')?.list()
        .filter(row => inside(row.path, cwd))
        .sort((a, b) => b.path.length - a.path.length)[0]
      if (!workspace) return ''
      const path = workspacePromptPath(workspace.path)
      try {
        const root = realpathSync(workspace.path)
        const file = realpathSync(path)
        if (!inside(root, file)) throw new Error('Workspace prompt resolves outside the workspace')
        if (statSync(file).size > MAX_DOCUMENT_BYTES) throw new Error('Workspace prompt is too large')
        return readFileSync(file, 'utf8')
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return ''
        throw error
      }
    },
  }), 'context-manager: workspace prompt')
  new ContextManagerRemote(ctx)
}
