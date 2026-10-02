import { useEffect, useId, useState } from 'react'
import { Button, Input, Menu, Modal, SegmentedTabs, Tag, IconChevronDownOutlineRegular, fileSizeText } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ContextRequest, ContextView, DocumentRequest, DocumentRow, DocumentValue, PromptRow, SaveDocumentRequest } from '../types.ts'
import type { ContextKey } from './locales.ts'
import css from './ContextSection.module.css'

export interface ContextActions {
  listContext(request: ContextRequest): Promise<ContextView>
  readDocument(request: DocumentRequest): Promise<DocumentValue>
  saveDocument(request: SaveDocumentRequest): Promise<DocumentValue>
}
type Props = PropsRuntime<'settings.section'> & PropsLocale<'settings.contextManager'> & InjectFace<ContextActions>
type Tab = 'skill' | 'rule' | 'prompt' | 'system'

function Picker({ label, value, options, onChange }: {
  label: string; value: string; options: { id: string; label: string }[]; onChange(value: string): void
}) {
  const [open, setOpen] = useState(false)
  return <Menu open={open} portal selectedId={value} items={options} onClose={() => setOpen(false)}
    onSelect={id => { onChange(id); setOpen(false) }}
    anchor={<Button variant="outline" size="sm" aria-label={label} aria-haspopup="menu" aria-expanded={open}
      onClick={() => setOpen(value => !value)}><span className={css.pickerText}>{options.find(option => option.id === value)?.label ?? label}</span><IconChevronDownOutlineRegular size={14} /></Button>} />
}

export function ContextSection(props: Props) {
  const { t } = props
  const [view, setView] = useState<ContextView | null>(null)
  const [workspaceId, setWorkspaceId] = useState('')
  const [presetId, setPresetId] = useState('')
  const [tab, setTab] = useState<Tab>('skill')
  const [query, setQuery] = useState('')
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [document, setDocument] = useState<DocumentValue | null>(null)
  const [prompt, setPrompt] = useState<PromptRow | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const tabId = useId()
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    void props.listContext({ ...(workspaceId ? { workspaceId } : {}), ...(presetId ? { presetId } : {}) })
      .then(result => { if (active) { setView(result); if (!workspaceId && result.workspaceId) setWorkspaceId(result.workspaceId) } })
      .catch(failure => { if (active) setError(String(failure)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [props.listContext, workspaceId, presetId, revision])

  const openDocument = async (row: DocumentRow) => {
    setError(''); setNotice('')
    try {
      const result = await props.readDocument({ workspaceId, ...(presetId ? { presetId } : {}), kind: row.kind, id: row.id })
      setDocument(result); setDraft(result.content)
    } catch (failure) { setError(String(failure)) }
  }
  const save = async () => {
    if (!document || busy) return
    setBusy(true); setError('')
    try {
      const result = await props.saveDocument({ workspaceId, ...(presetId ? { presetId } : {}),
        kind: document.kind, id: document.id, content: draft, revision: document.revision })
      setDocument(result); setNotice(t('saved')); setRevision(value => value + 1)
    } catch (failure) { setError(String(failure)) }
    finally { setBusy(false) }
  }
  const close = () => { if (!busy) { setDocument(null); setPrompt(null); setError('') } }
  const rows = (view?.documents ?? []).filter(row => tab === 'skill' ? row.kind === 'skill'
    : tab === 'rule' ? row.kind === 'rule' : tab === 'prompt' && (row.kind === 'prompt-file' || row.kind === 'workspace-prompt'))
    .filter(row => `${row.name} ${row.description} ${row.source}`.toLowerCase().includes(query.toLowerCase()))
  const sections = (view?.promptSections ?? []).filter(row => `${row.name} ${row.text}`.toLowerCase().includes(query.toLowerCase()))
  const runtime = (view?.runtimeContexts ?? []).filter(row => `${row.name} ${row.text}`.toLowerCase().includes(query.toLowerCase()))
  const tabs: Tab[] = ['skill', 'rule', 'prompt', 'system']
  return <div className={css.page}>
    <header className={css.header}><div><h2>{t('title')}</h2><p>{t('subtitle')}</p></div>
      <Button className={css.refresh} variant="outline" size="sm" onClick={() => setRevision(value => value + 1)}>{t('refresh')}</Button></header>
    <div className={css.controls}>
      <Picker label={t('workspace')} value={workspaceId} options={(view?.workspaces ?? []).map(row => ({ id: row.id, label: row.title }))}
        onChange={id => { setWorkspaceId(id); setDocument(null); setPrompt(null) }} />
      <Picker label={t('agent')} value={presetId} options={[{ id: '', label: t('allAgents') }, ...(view?.presets ?? []).map(row => ({ id: row.id, label: row.name }))]}
        onChange={id => { setPresetId(id); setDocument(null); setPrompt(null) }} />
      <Input className={css.search ?? ''} aria-label={t('search')} placeholder={t('search')} value={query} onChange={event => setQuery(event.currentTarget.value)} />
    </div>
    <SegmentedTabs<Tab> label={t('nav')} value={tab} onChange={setTab} items={tabs.map(value => ({ value, label: t(value),
      id: `${tabId}-${value}-tab`, panelId: `${tabId}-${value}-panel` })) as [{ value: Tab; label: string; id: string; panelId: string }, ...{ value: Tab; label: string; id: string; panelId: string }[]]} />
    {loading && <p role="status" className={css.hint}>{t('loading')}</p>}
    {error && !document && <p role="alert" className={css.error}>{error}</p>}
    {notice && <p role="status" className={css.notice}>{notice}</p>}
    {!loading && !view?.workspaces.length && <p className={css.empty}>{t('emptyWorkspace')}</p>}
    {view && tab !== 'system' && <section role="tabpanel" id={`${tabId}-${tab}-panel`} aria-labelledby={`${tabId}-${tab}-tab`}>
      {tab === 'rule' && <p className={css.hint}>{t('candidate')}</p>}
      <div className={css.list}>{rows.map(row => <article className={css.row} key={`${row.kind}:${row.id}`}>
        <div className={css.rowBody}><strong>{row.name}</strong><p>{row.description}</p><div className={css.meta}>
          <Tag tone="quiet">{row.source}</Tag><span>{fileSizeText(row.size)}</span></div></div>
        <Button variant="outline" size="sm" onClick={() => { void openDocument(row) }}>{row.editable ? t('edit') : t('view')}</Button>
      </article>)}</div>
      {!rows.length && <p className={css.empty}>{t('empty')}</p>}
    </section>}
    {view && tab === 'system' && <section role="tabpanel" id={`${tabId}-system-panel`} aria-labelledby={`${tabId}-system-tab`}>
      <p className={css.hint}>{t('systemHint')}</p>
      {view.promptError && <p role="status" className={css.hint}>{t('promptError')} {view.promptError}</p>}
      <div className={css.list}>
        {[...sections, ...runtime].map(row => <article className={css.row} key={row.name}>
          <div className={css.rowBody}><strong>{row.name}</strong><div className={css.meta}><span>{fileSizeText(row.size)}</span></div></div>
          <Button variant="outline" size="sm" onClick={() => setPrompt(row)}>{t('view')}</Button>
        </article>)}
        {view.systemPrompt && <article className={css.row}><div className={css.rowBody}><strong>{t('system')}</strong>
          <div className={css.meta}><span>{fileSizeText(new TextEncoder().encode(view.systemPrompt).length)}</span></div></div>
          <Button variant="outline" size="sm" onClick={() => setPrompt({ name: t('system'), text: view.systemPrompt, size: view.systemPrompt.length })}>{t('view')}</Button></article>}
      </div>
      {!sections.length && !runtime.length && !view.systemPrompt && <p className={css.empty}>{t('empty')}</p>}
    </section>}
    <Modal open={!!document || !!prompt} title={document?.name ?? prompt?.name ?? ''} closeLabel={t('close')} onClose={close}
      footer={<><Button variant="outline" onClick={close}>{t('close')}</Button>
        {document?.editable && <Button onClick={() => { void save() }} disabled={busy || draft === document.content}>{t(busy ? 'saving' : 'save')}</Button>}</>}>
      {document?.editable ? <textarea className={css.editor} aria-label={document.name} value={draft} disabled={busy}
        onChange={event => setDraft(event.currentTarget.value)} />
        : <pre className={css.preview}>{document?.content ?? prompt?.text ?? ''}</pre>}
      {document && !document.editable && <p className={css.hint}>{t('readOnly')}</p>}
      {error && (document || prompt) && <p role="alert" className={css.error}>{error}</p>}
    </Modal>
  </div>
}
