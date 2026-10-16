import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Button, Input, Menu, Modal, Tag, Toast, IconChevronDownOutlineRegular, fileSizeText } from '@deepseek-ai/dsh-client-ui-primitives'
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
/** One floating result report. `seq` keys the mounted `Toast`, so reporting the
 * same copy again restarts its hold and fade instead of extending the running
 * cycle. `kind` picks the success glyph and the longer failure hold. */
interface ToastReport { text: string; seq: number; kind: 'success' | 'error' }
/** A failure report names what broke, so it is held longer than the host default. */
const FAILURE_HOLD_MS = 6000

function Picker({ label, value, options, onChange }: {
  label: string; value: string; options: { id: string; label: string }[]; onChange(value: string): void
}) {
  const [open, setOpen] = useState(false)
  return <Menu open={open} portal selectedId={value} items={options} onClose={() => setOpen(false)}
    onSelect={id => { onChange(id); setOpen(false) }}
    anchor={<Button variant="outline" size="sm" aria-label={label} aria-haspopup="menu" aria-expanded={open}
      onClick={() => setOpen(value => !value)}><span className={css.pickerText}>{options.find(option => option.id === value)?.label ?? label}</span><IconChevronDownOutlineRegular size={14} /></Button>} />
}

/**
 * First-paint placeholder shaped like the rows it replaces, so the roster does
 * not reflow when the read answers. The status line stays outside the
 * placeholder's `aria-hidden` subtree.
 */
function ContextSkeleton({ label }: { label: string }) {
  return <>
    <p className={css.visuallyHidden} role="status">{label}</p>
    <div className={css.skeletonList} aria-hidden="true">
      {[0, 1, 2].map(index => <div key={index} className={css.skeletonRow}>
        <span className={css.skeletonBar} /><span className={css.skeletonBar} /></div>)}
    </div>
  </>
}

/** One empty state: why this list is empty, then what to do about it. */
function EmptyState({ title, hint }: { title: string; hint: string }) {
  return <><p className={css.empty}>{title}</p><p className={css.emptyHint}>{hint}</p></>
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
  const [toast, setToast] = useState<ToastReport | null>(null)
  // The floating report is one-shot but the retry entry is not, so whether the
  // last read failed outlives the banner it announced.
  const [readFailed, setReadFailed] = useState(false)
  const toastSeq = useRef(0)
  const [document, setDocument] = useState<DocumentValue | null>(null)
  const [prompt, setPrompt] = useState<PromptRow | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const tabId = useId()
  // Keyboard navigation moves focus as well as selection, so the strip keeps
  // each button's node. The strip is the settings dialog's own underline
  // pattern (the one the built-in Plugins page draws), not a segmented track.
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  // The read effect reports a failure with the locale-bound `t`, but keying the
  // effect on it would re-read the roster whenever the dictionary binding moves.
  const latestT = useRef(t)
  latestT.current = t
  /** Report a settled action result in the floating banner; never a busy state. */
  const report = (text: string, kind: 'success' | 'error' = 'success') => {
    setToast({ text, seq: ++toastSeq.current, kind })
  }
  /** A re-read owns no floating report: its visible state is the roster itself. */
  const reRead = useCallback(() => { setRevision(value => value + 1) }, [])
  useEffect(() => {
    let active = true
    setLoading(true)
    // A re-read clears the failure it is about to answer, but not a save result
    // this section reported: saving re-reads the roster, and the success banner
    // has to survive that.
    setToast(current => current?.kind === 'error' ? null : current)
    void props.listContext({ ...(workspaceId ? { workspaceId } : {}), ...(presetId ? { presetId } : {}) })
      .then(result => { if (active) { setView(result); setReadFailed(false); if (!workspaceId && result.workspaceId) setWorkspaceId(result.workspaceId) } })
      .catch(failure => { if (active) { setReadFailed(true); report(`${latestT.current('readError')}: ${String(failure)}`, 'error') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [props.listContext, workspaceId, presetId, revision])

  const openDocument = async (row: DocumentRow) => {
    setToast(null)
    try {
      const result = await props.readDocument({ workspaceId, ...(presetId ? { presetId } : {}), kind: row.kind, id: row.id })
      setDocument(result); setDraft(result.content)
    } catch (failure) { report(`${t('readError')}: ${String(failure)}`, 'error') }
  }
  const save = async () => {
    if (!document || busy) return
    setBusy(true)
    try {
      const result = await props.saveDocument({ workspaceId, ...(presetId ? { presetId } : {}),
        kind: document.kind, id: document.id, content: draft, revision: document.revision })
      setDocument(result); report(t('saved')); setRevision(value => value + 1)
    } catch (failure) { report(`${t('saveError')}: ${String(failure)}`, 'error') }
    finally { setBusy(false) }
  }
  // Closing reports nothing itself, but a report about the document that just
  // went away must not outlive it.
  const close = () => { if (!busy) { setDocument(null); setPrompt(null); setToast(null) } }
  const searched = query.trim() !== ''
  const matches = (text: string) => text.toLowerCase().includes(query.toLowerCase())
  // The pools before the query, so an empty list can tell "this source has
  // nothing" apart from "the search hid everything".
  const docPool = (view?.documents ?? []).filter(row => tab === 'skill' ? row.kind === 'skill'
    : tab === 'rule' ? row.kind === 'rule' : tab === 'prompt' && (row.kind === 'prompt-file' || row.kind === 'workspace-prompt'))
  const rows = docPool.filter(row => matches(`${row.name} ${row.description} ${row.source}`))
  const sectionPool = view?.promptSections ?? []
  const runtimePool = view?.runtimeContexts ?? []
  const sections = sectionPool.filter(row => matches(`${row.name} ${row.text}`))
  const runtime = runtimePool.filter(row => matches(`${row.name} ${row.text}`))
  const systemRows = (view?.systemPrompt ? 1 : 0)
  const pool = tab === 'system' ? sectionPool.length + runtimePool.length + systemRows : docPool.length
  const shown = tab === 'system' ? sections.length + runtime.length + systemRows : rows.length
  const noWorkspace = view !== null && view.workspaces.length === 0
  const dialogOpen = document !== null || prompt !== null
  const tabs: Tab[] = ['skill', 'rule', 'prompt', 'system']
  return <div className={css.page}>
    <header className={css.header}><div><h2>{t('title')}</h2><p>{t('subtitle')}</p></div>
      <Button className={css.refresh} variant="outline" size="sm" disabled={loading} onClick={reRead}>{t('refresh')}</Button></header>
    <div className={css.controls}>
      <Picker label={t('workspace')} value={workspaceId} options={(view?.workspaces ?? []).map(row => ({ id: row.id, label: row.title }))}
        onChange={id => { setWorkspaceId(id); setDocument(null); setPrompt(null) }} />
      <Picker label={t('agent')} value={presetId} options={[{ id: '', label: t('allAgents') }, ...(view?.presets ?? []).map(row => ({ id: row.id, label: row.name }))]}
        onChange={id => { setPresetId(id); setDocument(null); setPrompt(null) }} />
      <Input className={css.search ?? ''} aria-label={t('search')} placeholder={t('search')} value={query} onChange={event => setQuery(event.currentTarget.value)} />
    </div>
    <div className={css.tabs} role="tablist" aria-label={t('nav')}>
      {tabs.map((value, index) => <button
        key={value}
        ref={element => { tabRefs.current[index] = element }}
        id={`${tabId}-${value}-tab`}
        type="button"
        role="tab"
        className={css.tab}
        aria-selected={tab === value}
        aria-controls={`${tabId}-${value}-panel`}
        data-active={tab === value ? 'true' : undefined}
        tabIndex={tab === value ? 0 : -1}
        onClick={() => setTab(value)}
        onKeyDown={event => {
          let next: number
          switch (event.key) {
            case 'ArrowRight': next = (index + 1) % tabs.length; break
            case 'ArrowLeft': next = (index - 1 + tabs.length) % tabs.length; break
            case 'Home': next = 0; break
            case 'End': next = tabs.length - 1; break
            default: return
          }
          event.preventDefault()
          const nextValue = tabs[next] as Tab
          const nextButton = tabRefs.current[next] as HTMLButtonElement
          setTab(nextValue)
          nextButton.focus()
        }}
      >{t(value)}</button>)}
    </div>
    {/* First paint is a placeholder shaped like the roster; a refresh keeps the
        roster it already has and only reports itself in the status line. */}
    {loading && view === null && <ContextSkeleton label={t('loading')} />}
    {noWorkspace && <EmptyState title={t('emptyWorkspace')} hint={t('emptyWorkspaceHint')} />}
    {view && !noWorkspace && tab !== 'system' && <section role="tabpanel" id={`${tabId}-${tab}-panel`} aria-labelledby={`${tabId}-${tab}-tab`}>
      {tab === 'rule' && <p className={css.hint}>{t('candidate')}</p>}
      <div className={css.list}>{rows.map(row => <article className={css.row} key={`${row.kind}:${row.id}`}>
        <div className={css.rowBody}><strong>{row.name}</strong><p>{row.description}</p><div className={css.meta}>
          <Tag tone="quiet">{row.source}</Tag><span>{fileSizeText(row.size)}</span></div></div>
        <Button variant="outline" size="sm" onClick={() => { void openDocument(row) }}>{row.editable ? t('edit') : t('view')}</Button>
      </article>)}</div>
      {!shown && (searched && pool > 0
        ? <EmptyState title={t('noMatch')} hint={t('noMatchHint')} />
        : <EmptyState title={t('empty')} hint={t('emptyHint')} />)}
    </section>}
    {view && !noWorkspace && tab === 'system' && <section role="tabpanel" id={`${tabId}-system-panel`} aria-labelledby={`${tabId}-system-tab`}>
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
      {!shown && (searched && pool > 0
        ? <EmptyState title={t('noMatch')} hint={t('noMatchHint')} />
        : <EmptyState title={t('empty')} hint={t('emptyHint')} />)}
    </section>}
    {/* Transient state sits below the roster, so a refresh never moves the rows
        the reader is looking at. */}
    {loading && view !== null && <p role="status" className={css.hint}>{t('refreshing')}</p>}
    {/* Read failures keep the last roster and their retry here, where the
        roster is; the report itself floats, so a long list cannot scroll it
        out of view and the settings dialog's mask cannot cover it. */}
    {readFailed && <div className={css.retry}><Button variant="outline" size="sm" onClick={reRead}>{t('retry')}</Button></div>}
    {/* Keyed by `seq`, so reporting the same copy twice restarts the cycle;
        `onDone` clears only the report this banner was mounted for. A success
        takes the host default hold, the one the archive banner uses, so all
        three plugins report success for the same span; only a failure — which
        names what broke — is held longer. */}
    {toast && (toast.kind === 'success'
      ? <Toast key={toast.seq} text={toast.text} tone="success"
        onDone={() => { setToast(current => current?.seq === toast.seq ? null : current) }} />
      : <Toast key={toast.seq} text={toast.text} holdMs={FAILURE_HOLD_MS}
        onDone={() => { setToast(current => current?.seq === toast.seq ? null : current) }} />)}
    <Modal open={dialogOpen} title={document?.name ?? prompt?.name ?? ''} closeLabel={t('close')} onClose={close}
      footer={<>
        <Button variant="outline" onClick={close}>{t('close')}</Button>
        {document?.editable && <Button onClick={() => { void save() }} disabled={busy || draft === document.content}>{t(busy ? 'saving' : 'save')}</Button>}</>}>
      {document?.editable ? <textarea className={css.editor} aria-label={document.name} value={draft} disabled={busy}
        onChange={event => setDraft(event.currentTarget.value)} />
        : <pre className={css.preview}>{document?.content ?? prompt?.text ?? ''}</pre>}
      {document && !document.editable && <p className={css.hint}>{t('readOnly')}</p>}
    </Modal>
  </div>
}
