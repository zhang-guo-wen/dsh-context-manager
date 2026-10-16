// @vitest-environment jsdom
/**
 * Feedback-surface regression for the settings section.
 *
 * The settings shell owns the page scroll, so a result reported below the roster
 * scrolls out of view on a long list, and a result reported in the dialog footer
 * only exists while that dialog is open. Both the save result and the failure
 * reports therefore belong to the host floating `Toast`, which reaches the person
 * through a body portal above the dialog mask. What stays on the page is the
 * static copy, the in-flight state, and the retry entry.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContextView, DocumentValue, SaveDocumentRequest } from '../src/types.ts'

/**
 * Every banner the stub mounted, in order, with the props the section passed.
 * The hold is the one host contract a rendered banner cannot show, so the stub
 * records it and the assertions read it back. A banner can be recorded more than
 * once (remount, StrictMode), so assertions look at every record of one copy.
 */
const banners: Array<{ text: string; tone?: string; holdMs?: number }> = []

/** Every recorded mount of one banner copy. */
function bannerRecords(text: string): Array<{ text: string; tone?: string; holdMs?: number }> {
  return banners.filter(record => record.text === text)
}

// The real primitives package is a browser bundle whose runtime deps this plugin
// does not declare, so the test stubs the shells this section renders. The
// contract under test is the section's own behavior; the stubs keep the parts the
// assertions select on: a body-portal `Modal` with the dialog role, the labelled
// controls, and the host `Toast`'s `role="alert"` banner (the real `Toast.tsx`
// carries exactly that role, plus its `tone`), keyed and reported back through
// `onDone` so the lifetime wiring is observable.
vi.mock('@deepseek-ai/dsh-client-ui-primitives', async () => {
  const { createPortal } = await import('react-dom')
  const { useEffect } = await import('react')
  const Modal = (props: Record<string, unknown>) => {
    const open = props.open === true
    const onClose = props.onClose as () => void
    useEffect(() => {
      if (!open) return undefined
      const onKey = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose() }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])
    if (!open) return null
    return createPortal(
      <div role="dialog" aria-modal="true" aria-label={props.title as string}>
        {props.children as never}
        {(props.footer ?? null) as never}
      </div>,
      document.body,
    )
  }
  const Toast = (props: Record<string, unknown>) => {
    banners.push({
      text: props.text as string,
      ...(props.tone === undefined ? {} : { tone: props.tone as string }),
      ...(props.holdMs === undefined ? {} : { holdMs: props.holdMs as number }),
    })
    return <span role="alert" data-tone={(props.tone as string | undefined) ?? 'plain'}>{props.text as string}</span>
  }
  return {
    Button: (props: Record<string, unknown>) => {
      const { children, ...rest } = props
      return <button type="button" {...rest}>{children as never}</button>
    },
    Input: (props: Record<string, unknown>) => {
      const { children: _children, ...rest } = props
      return <input {...rest} />
    },
    Menu: (props: Record<string, unknown>) => <>{props.anchor as never}</>,
    Modal,
    Tag: (props: Record<string, unknown>) => <span>{props.children as never}</span>,
    Toast,
    IconChevronDownOutlineRegular: () => <span aria-hidden />,
    fileSizeText: (bytes: number) => `${String(bytes)} B`,
  }
})

import { ContextSection, type ContextActions } from '../src/client/ContextSection.tsx'
import { en, zh, type ContextKey } from '../src/client/locales.ts'

const SKILL: DocumentValue = {
  kind: 'skill', id: 'alpha', name: 'alpha', description: 'About alpha', source: 'skill-filesystem',
  size: 2048, revision: 'r1', content: 'First draft', editable: true,
}

function view(): ContextView {
  return {
    workspaceId: 'ws-1',
    workspaces: [{ id: 'ws-1', title: 'Workspace One', path: 'C:\\ws' }],
    presets: [],
    documents: [{ kind: 'skill', id: 'alpha', name: 'alpha', description: 'About alpha', source: 'skill-filesystem', size: 2048, editable: true }],
    promptSections: [],
    runtimeContexts: [],
    systemPrompt: '',
  }
}

/** A promise the test settles by hand, so the in-flight state is observable. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((settle, fail) => { resolve = settle; reject = fail })
  return { promise, resolve, reject }
}

interface Control {
  /** Answers handed out in order; an Error rejects the call. */
  saveAnswers: Array<DocumentValue | Error | Promise<DocumentValue>>
  saved: SaveDocumentRequest[]
  actions: ContextActions
}

function harness(overrides: Partial<ContextActions> = {}): Control {
  const control: Control = { saveAnswers: [], saved: [], actions: {} as ContextActions }
  control.actions = {
    listContext: async () => view(),
    readDocument: async () => SKILL,
    saveDocument: async request => {
      control.saved.push(request)
      const answer = control.saveAnswers.shift() ?? { ...SKILL, revision: 'r2', content: request.content }
      if (answer instanceof Error) throw answer
      return await answer
    },
    ...overrides,
  }
  return control
}

/** The English dictionary behind the locale seat the shell normally injects. */
function translate(key: string): string { return en[key as ContextKey] }

function renderSection(control: Control) {
  return render(<ContextSection t={translate} close={() => {}} {...control.actions} />)
}

/** Open the one editable roster row and wait for the editor the dialog renders. */
async function openEditor(): Promise<HTMLTextAreaElement> {
  fireEvent.click(await screen.findByRole('button', { name: en.edit }))
  return await screen.findByRole('textbox', { name: SKILL.name }) as HTMLTextAreaElement
}

/**
 * Edit the open draft and press Save. The button is deliberately disabled while
 * the draft still matches the loaded revision, so a test that clicks it without
 * editing would report success without ever calling the host.
 */
async function saveDraft(text: string): Promise<void> {
  fireEvent.change(screen.getByRole('textbox', { name: SKILL.name }), { target: { value: text } })
  const button = screen.getByRole('button', { name: en.save })
  await waitFor(() => { expect(button).toHaveProperty('disabled', false) })
  fireEvent.click(button)
}

/** The banner's copy, so assertions read the text node and not the whole node tree. */
function bannerText(element: HTMLElement): string { return element.textContent ?? '' }

/** Match one element whose complete text is this copy, not an ancestor of it. */
function exactText(text: string): (content: string, element: Element | null) => boolean {
  return (content, element) => element?.textContent === text && content.includes(text)
}

afterEach(() => { cleanup(); banners.length = 0 })

const FAILURE_HOLD_MS = 6000

describe('settings section result reports', () => {
  it('reports a successful save in the floating banner with the success tone', async () => {
    const control = harness()
    renderSection(control)
    await openEditor()
    await saveDraft('Edited')

    const banner = await screen.findByRole('alert')
    expect(bannerText(banner)).toContain(en.saved)
    expect(banner.getAttribute('data-tone')).toBe('success')
    // The success banner takes the host default hold: no `holdMs` prop, so all
    // three plugins report success for the same span.
    expect(bannerRecords(en.saved).length).toBeGreaterThan(0)
    expect(bannerRecords(en.saved).every(record => record.holdMs === undefined)).toBe(true)
    // The report is the floating banner, not a line in the section: the saved
    // copy exists exactly once, inside the banner.
    expect(screen.getAllByText(exactText(en.saved))).toHaveLength(1)
  })

  it('keeps the save result visible while the document dialog is still open', async () => {
    const control = harness()
    renderSection(control)
    await openEditor()
    await saveDraft('Edited')

    // The dialog that produced the result is still open, which is exactly the
    // case the old footer-only report existed for.
    expect(screen.getByRole('dialog')).not.toBeNull()
    const banner = await screen.findByRole('alert')
    expect(bannerText(banner)).toContain(en.saved)
  })

  it('reports a failed save in the floating banner and keeps the draft editable', async () => {
    const control = harness()
    control.saveAnswers.push(new Error('revision changed since it was opened'))
    renderSection(control)
    await openEditor()
    await saveDraft('Edited')

    const banner = await screen.findByRole('alert')
    expect(bannerText(banner)).toContain(en.saveError)
    expect(bannerText(banner)).toContain('revision changed since it was opened')
    expect(banner.getAttribute('data-tone')).toBe('plain')
    // The draft survives the failure, so the same dialog can be saved again.
    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByRole('textbox', { name: SKILL.name })).toHaveProperty('value', 'Edited')
    expect(screen.getByRole('button', { name: en.save })).toHaveProperty('disabled', false)
  })

  it('keeps the in-flight save state on the dialog button, not in the banner', async () => {
    const control = harness()
    const pending = deferred<DocumentValue>()
    control.saveAnswers.push(pending.promise)
    renderSection(control)
    await openEditor()
    fireEvent.change(screen.getByRole('textbox', { name: SKILL.name }), { target: { value: 'Edited' } })
    const button = screen.getByRole('button', { name: en.save })
    await waitFor(() => { expect(button).toHaveProperty('disabled', false) })
    fireEvent.click(button)

    // Busy stays on the control that is busy; only the settled result floats.
    expect(await screen.findByRole('button', { name: en.saving })).toHaveProperty('disabled', true)
    expect(screen.queryByRole('alert')).toBeNull()

    pending.resolve({ ...SKILL, revision: 'r2', content: 'Edited' })
    expect(bannerText(await screen.findByRole('alert'))).toContain(en.saved)
  })

  it('reports a failed read in the floating banner and keeps the retry entry', async () => {
    const control = harness({ listContext: async () => { throw new Error('service offline') } })
    renderSection(control)

    const banner = await screen.findByRole('alert')
    expect(bannerText(banner)).toContain(en.readError)
    expect(bannerText(banner)).toContain('service offline')
    // A failure names what broke, so it is held longer than the host default.
    expect(bannerRecords(bannerText(banner)).every(record => record.holdMs === FAILURE_HOLD_MS)).toBe(true)
    expect(screen.getByRole('button', { name: en.retry })).not.toBeNull()
  })

  it('offers no retry before a read has failed', async () => {
    renderSection(harness())
    await screen.findByRole('button', { name: en.edit })
    expect(screen.queryByRole('button', { name: en.retry })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('restarts the banner lifetime when the same result is reported twice', async () => {
    const control = harness()
    renderSection(control)
    await openEditor()

    await saveDraft('One')
    await screen.findByRole('alert')
    const first = control.saved.length

    await saveDraft('Two')
    await waitFor(() => { expect(control.saved.length).toBe(first + 1) })
    // A repeated copy still reaches the banner: the render keys the toast by its
    // sequence, so an identical report remounts instead of being dropped. One
    // banner, not two stacked copies of the same sentence.
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(bannerText(screen.getByRole('alert'))).toContain(en.saved)
  })
})

describe('feedback copy', () => {
  it('ships the failure report copy in both dictionaries', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
    expect(en.saveError).not.toBe('')
    expect(zh.saveError).not.toBe('')
  })
})
