import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import { TYPERT_REMOTE } from '../remote.ts'
import type { ContextRequest, ContextView, DocumentRequest, DocumentValue, SaveDocumentRequest } from '../types.ts'
import { ContextSection, type ContextActions } from './ContextSection.tsx'
import { NS, zh, en, type ContextKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' { interface LocaleNamespaceMap { 'settings.contextManager': ContextKey } }

interface Namespace {
  listContext(request: ContextRequest): Promise<RemoteResult<ContextView>>
  readDocument(request: DocumentRequest): Promise<RemoteResult<DocumentValue>>
  saveDocument(request: SaveDocumentRequest): Promise<RemoteResult<DocumentValue>>
}

export const inject = ['slots', 'locale', 'remote']
export async function apply(ctx: Context): Promise<void> {
  const dispose = await ctx.remote.$mount(TYPERT_REMOTE)
  ctx.effect(() => () => dispose(), 'context-manager: client remote')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'context-manager: locales')
  const t = ctx.locale.bind(NS)
  const call = async <T>(method: (remote: Namespace) => Promise<RemoteResult<T>>): Promise<T> => {
    const remote = ctx.get('remote.contextManager') as Namespace | undefined
    if (!remote) throw new Error('Context manager is unavailable')
    const result = await method(remote)
    if (!result.ok) throw new Error(result.error.message)
    return result.value
  }
  const actions: ContextActions = {
    listContext: request => call(remote => remote.listContext(request)),
    readDocument: request => call(remote => remote.readDocument(request)),
    saveDocument: request => call(remote => remote.saveDocument(request)),
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'context-manager', order: 16,
    label: () => t('nav'), locale: NS, inject: () => actions }, ContextSection))
}
