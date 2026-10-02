export const NS = 'settings.contextManager'
export const zh = {
  nav: '上下文管理', title: '上下文管理', subtitle: '查看工作区中可发现的文件，以及当前 Agent 的 Skill 和系统提示词。',
  workspace: '工作区', agent: 'Agent', allAgents: '全局视图', search: '搜索名称、描述或来源', refresh: '刷新',
  skill: 'Skill', rule: 'Rules', prompt: '提示词文件', system: '系统提示词', runtime: '运行时上下文',
  emptyWorkspace: '还没有工作区', empty: '没有匹配的内容', loading: '正在读取上下文…', readError: '读取失败',
  view: '查看', edit: '编辑', save: '保存', cancel: '取消', close: '关闭', saving: '保存中…', saved: '已保存',
  bytes: '字节', source: '来源', readOnly: '此来源只可查看；请在原插件或配置中修改。',
  candidate: '发现的 Claude 文件。是否注入取决于 Claude 兼容插件的开关及路径规则。',
  systemHint: '这些片段来自运行时组装；在本页可编辑工作区专属的 system-prompt.md，其余片段请修改原来源。',
  promptError: '部分变量在当前视图尚未赋值；下方完整预览保留原始变量：',
} as const
export const en: Record<keyof typeof zh, string> = {
  nav: 'Context Manager', title: 'Context Manager', subtitle: 'Inspect discoverable workspace files and the current Agent’s Skills and system prompt.',
  workspace: 'Workspace', agent: 'Agent', allAgents: 'Global view', search: 'Search names, descriptions, or sources', refresh: 'Refresh',
  skill: 'Skills', rule: 'Rules', prompt: 'Prompt files', system: 'System prompt', runtime: 'Runtime context',
  emptyWorkspace: 'No workspaces available', empty: 'No matching content', loading: 'Loading context…', readError: 'Could not load context',
  view: 'View', edit: 'Edit', save: 'Save', cancel: 'Cancel', close: 'Close', saving: 'Saving…', saved: 'Saved',
  bytes: 'bytes', source: 'Source', readOnly: 'This source is read only here. Edit it in its owning plugin or configuration.',
  candidate: 'Discovered Claude files. Injection depends on the Claude compatibility plugin settings and path rules.',
  systemHint: 'These sections are assembled at runtime. This page can edit the workspace system-prompt.md; edit other sections at their source.',
  promptError: 'Some variables have no value in this view; the complete preview below keeps their original placeholders:',
}
export type ContextKey = keyof typeof zh
