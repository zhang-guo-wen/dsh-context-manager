# dsh-context-manager

Independent DeepSeek Harness plugin. The package root is the installable DSH plugin; do not add a Codex plugin manifest. Keep host packages external and commit generated `lib/` with source changes.

The UI reads the native Skill registry and system prompt assembly. Only files inside a selected workspace may be edited. Other providers' prompt sections are inspection-only; the editable workspace system prompt lives at `.dsh/context-manager/system-prompt.md` and is contributed by this plugin. Preserve the original files' ownership and reject stale writes.

Run `npm run typecheck`, `npm test`, and `npm run build` before delivery. Keep English and Chinese README content aligned.

## Settings-section UI

The page is one `settings.section`, so it does not take the 960px first-level page column: `ContextSection.module.css`
declares `container: context-manager / inline-size` plus `max-width: 760px` (BASELINE §3.3), and the layout keys off
that container — at `@container (max-width: 520px)` the title and its refresh button stop sharing a line and a row's
action stops sitting beside its text. Window-level rules are only the two the standard names: `@media (max-width: 600px)`
raises the code editor to 16px/24px (iOS focus zoom) and `@media (pointer: coarse)` raises rows and tab cells to 44px.
Controls stay with `@deepseek-ai/dsh-client-ui-primitives` (`Button`/`Input`/`Menu`/`Modal`/`Tag`, `fileSizeText`);
the two pickers use the host `Menu`, and no `Select` primitive exists, so selects stay native.

Feedback rules the page has to keep:

- First paint is a row-shaped skeleton (`--dsw-alias-bg-skeleton`, pulse disabled under `prefers-reduced-motion`).
- A refresh keeps the rendered roster and only adds a "refreshing" line; busy, failure and success messages render
  **below** the list, so a re-read never moves the rows being read (the settings shell owns the scroll container, so
  keeping the list mounted is what preserves the scroll position).
- A failed read keeps the last roster and offers Retry; a save that fails keeps the draft and the dialog open, and the
  save result is rendered inside the dialog footer (the page-level notice would be behind the mask).
- Empty states carry both lines: why the list is empty and what to do next. "This source has nothing"
  (`empty`/`emptyHint`), "the search hid everything" (`noMatch`/`noMatchHint`) and "no workspace yet"
  (`emptyWorkspace`/`emptyWorkspaceHint`) are three different states, and a read failure never shows an empty state.

All visible copy — including `aria-label`, `placeholder`, empty-state and button text — lives in
`src/client/locales.ts` with matching Chinese and English entries. `fileSizeText` units (B/KB/MB/GB) are language
independent and stay out of the dictionary.

`npm test` runs `vitest run`; `vitest.config.ts` pins the include to `tests/**/*.spec.ts`, because vitest's default
include also collects `tests/plugin-metadata.test.mjs` — a `node:test` suite that `test:metadata` owns — and reports
"No test suite found" for it.
