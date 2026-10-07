# 上下文管理

[English](README.md)

在 DeepSeek Harness 中查看并编辑工作区的 Skill、规则与运行时组装的提示词上下文。在设置页选择工作区和 Agent，查看该作用域的 Skill、规则与提示词文件，以及运行时组装的系统提示词片段。列表支持搜索；文件显示来源、描述和内容大小，点击可查看全文。

## 安装

安装公开的 npm 包后，重启 Harness：

```sh
npx @deepseek-ai/dsh plugin --profile web add @guowenzhang/dsh-context-manager
```

本地开发时先运行 `npm ci` 和 `npm run build`，再用目录的绝对路径替代包名安装。

## 编辑与生效

- 工作区内、由 Skill 提供方暴露真实路径的 `SKILL.md` 可以直接编辑。工作区内的 `AGENTS.md`、`CLAUDE.md` 及已发现的 Claude Rules 文件也可以编辑。保存前校验文件版本，若文件已被其他程序修改，请刷新后再编辑。
- 工作区系统提示词位于 `.dsh/context-manager/system-prompt.md`。页面首次保存会创建该文件；插件在相应工作区的系统提示词组装时读取它，后续请求即可生效。
- 其他插件贡献的系统提示词片段和工作区外文件只读，应在来源插件或其配置中修改。已经提交到会话历史的旧上下文不会因文件编辑而改写。

## 清单的范围

Skill 取自 Harness 原生 Skill 注册表，包含已注册的文件与插件提供方，并依所选 Agent 作用域合并。原生指令文件按 Harness 的发现规则列出。页面还扫描项目和用户的 `.claude/rules/**`、常见 `CLAUDE.md` 位置，标记为**候选文件**：Claude 兼容插件可按开关、`paths` 和文件读取行为选择注入，发现文件不等于当前会话已注入。

系统提示词页显示 `systemPrompt.assemble()` 的片段和完整预览。全局视图中若模型等变量尚未赋值，预览保留原始占位符并给出提示。`agent/pre-step` 阶段追加的 Rules、记忆或其他用户角色上下文不属于系统提示词。Harness 暂无跨插件的完整上下文文件登记清单，因此本页不会把文件扫描结果宣称为所有已加载上下文。

## 开发

```sh
npm run typecheck
npm test
npm run build
```
