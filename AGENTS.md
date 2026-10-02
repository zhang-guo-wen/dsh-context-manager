# dsh-context-manager

Independent DeepSeek Harness plugin. The package root is the installable DSH plugin; do not add a Codex plugin manifest. Keep host packages external and commit generated `lib/` with source changes.

The UI reads the native Skill registry and system prompt assembly. Only files inside a selected workspace may be edited. Other providers' prompt sections are inspection-only; the editable workspace system prompt lives at `.dsh/context-manager/system-prompt.md` and is contributed by this plugin. Preserve the original files' ownership and reject stale writes.

Run `npm run typecheck`, `npm test`, and `npm run build` before delivery. Keep English and Chinese README content aligned.
