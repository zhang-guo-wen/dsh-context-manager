# Context Manager

[中文](README.zh.md)

Inspect and edit a workspace's Skills, rules, and assembled prompt context in DeepSeek Harness. Select a workspace and Agent in Settings to inspect Skills, rule and prompt files, and assembled system prompt sections. Search the list, inspect each file's source, description, size, and full content.

In the plugin list, display names and descriptions follow the Harness language setting in English or Chinese (English is the default fallback); English names use the package name without its npm scope, Chinese names describe the purpose, and installation still uses the unchanged real package name.

## Install

Install the public npm package, then restart Harness:

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-context-manager
```

For local development, run `npm ci` and `npm run build`, then use the directory's absolute path instead of the package name.

## Editing

- File-backed Skills and instruction files inside the selected workspace can be edited. Saves compare the file revision and reject stale writes.
- The editable workspace system prompt is `.dsh/context-manager/system-prompt.md`. The first save creates it. The plugin reads it when assembling the system prompt for that workspace, so subsequent requests see the change.
- Other plugins' prompt sections and files outside the workspace are read only here. Existing context already recorded in a session is not rewritten.

## Inventory scope

Skills come from the native Harness Skill registry and reflect the selected Agent scope. Native instruction files follow Harness discovery. The page also finds project and user `.claude/rules/**` and common `CLAUDE.md` files, marked as **candidates**: Claude compatibility settings, `paths` conditions, and file reads determine whether they are injected into a particular session.

The System Prompt tab displays `systemPrompt.assemble()` sections and a complete preview. In the global view, a variable such as the model name may have no value yet; the preview keeps its placeholder and explains why. Rules, memory, and other user-role context appended during `agent/pre-step` are separate. Harness has no cross-plugin inventory of every context file, so discovery must not be read as proof of injection.

## Development

```sh
npm run typecheck
npm test
npm run build
```
