window.__ModuleLoader__.load({
	id: "@guowenzhang/dsh-context-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/remote.ts
		const namespace = "contextManager";
		const schema = { parse: (value) => value };
		const codec = (typeSymbol) => ({
			mode: "strict",
			typeSymbol,
			schema,
			create: () => schema
		});
		const TYPERT_REMOTE = {
			package: "@guowenzhang/dsh-context-manager",
			descriptors: [
				"listContext",
				"readDocument",
				"saveDocument"
			].map((method) => {
				const owner = `@guowenzhang/dsh-context-manager#${namespace}/${method}`;
				return {
					id: owner,
					service: namespace,
					namespace,
					method,
					invocation: { kind: "direct" },
					parameters: [{
						name: "request",
						wire: "request",
						source: "json",
						codec: codec(`${owner}:request`)
					}],
					result: codec(`${owner}:result`)
				};
			})
		};
		//#endregion
		//#region \0dsh-css:C:\02-codespace\DeepSeek\dsh-context-manager\src\client\ContextSection.module.css.mjs
		const css = ".FUXJ1W_page{max-width:960px;color:var(--dsw-alias-label-primary);margin:0 auto;padding:0 clamp(24px,4vw,48px) 48px;font-size:14px}.FUXJ1W_header{justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;padding-top:24px;display:flex}.FUXJ1W_header h2{margin:0;font-size:20px;font-weight:500}.FUXJ1W_header p{color:var(--dsw-alias-label-secondary);margin:8px 0 0}.FUXJ1W_refresh{white-space:nowrap;flex:none}.FUXJ1W_controls{flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:18px;display:flex}.FUXJ1W_pickerText{white-space:nowrap;text-overflow:ellipsis;max-width:180px;overflow:hidden}.FUXJ1W_search{flex:1;min-width:180px}.FUXJ1W_list{gap:10px;margin-top:16px;display:grid}.FUXJ1W_row{border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);border-radius:12px;justify-content:space-between;align-items:center;gap:16px;min-width:0;padding:14px 16px;display:flex}.FUXJ1W_row>button{white-space:nowrap;flex:none}.FUXJ1W_rowBody{min-width:0}.FUXJ1W_rowBody strong{overflow-wrap:anywhere;font-size:14px;font-weight:600}.FUXJ1W_rowBody p{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;margin:4px 0}.FUXJ1W_meta{color:var(--dsw-alias-label-tertiary);flex-wrap:wrap;align-items:center;gap:8px;margin-top:8px;font-size:12px;display:flex}.FUXJ1W_hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.FUXJ1W_empty{color:var(--dsw-alias-label-tertiary);text-align:center;padding:36px 16px}.FUXJ1W_error{color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere}.FUXJ1W_notice{color:var(--dsw-alias-state-success-primary)}.FUXJ1W_editor,.FUXJ1W_preview{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);width:min(700px,100%);min-height:280px;max-height:60vh;color:var(--dsw-alias-label-primary);font:12px/1.5 var(--ds-font-family-code);white-space:pre-wrap;overflow-wrap:anywhere;border-radius:8px;padding:12px;overflow:auto}.FUXJ1W_editor:focus{outline:2px solid var(--dsw-alias-state-business-primary)}@media (width<=560px){.FUXJ1W_header{flex-direction:column}.FUXJ1W_row{align-items:flex-start}}";
		const tagId = "@guowenzhang/dsh-context-manager/ContextSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ContextSection_module_css_default = {
			"controls": "FUXJ1W_controls",
			"editor": "FUXJ1W_editor",
			"empty": "FUXJ1W_empty",
			"error": "FUXJ1W_error",
			"header": "FUXJ1W_header",
			"hint": "FUXJ1W_hint",
			"list": "FUXJ1W_list",
			"meta": "FUXJ1W_meta",
			"notice": "FUXJ1W_notice",
			"page": "FUXJ1W_page",
			"pickerText": "FUXJ1W_pickerText",
			"preview": "FUXJ1W_preview",
			"refresh": "FUXJ1W_refresh",
			"row": "FUXJ1W_row",
			"rowBody": "FUXJ1W_rowBody",
			"search": "FUXJ1W_search"
		};
		//#endregion
		//#region src/client/ContextSection.tsx
		function Picker({ label, value, options, onChange }) {
			const [open, setOpen] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				portal: true,
				selectedId: value,
				items: options,
				onClose: () => setOpen(false),
				onSelect: (id) => {
					onChange(id);
					setOpen(false);
				},
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					size: "sm",
					"aria-label": label,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					onClick: () => setOpen((value) => !value),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ContextSection_module_css_default.pickerText,
						children: options.find((option) => option.id === value)?.label ?? label
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { size: 14 })]
				})
			});
		}
		function ContextSection(props) {
			const { t } = props;
			const [view, setView] = (0, react.useState)(null);
			const [workspaceId, setWorkspaceId] = (0, react.useState)("");
			const [presetId, setPresetId] = (0, react.useState)("");
			const [tab, setTab] = (0, react.useState)("skill");
			const [query, setQuery] = (0, react.useState)("");
			const [revision, setRevision] = (0, react.useState)(0);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)("");
			const [document, setDocument] = (0, react.useState)(null);
			const [prompt, setPrompt] = (0, react.useState)(null);
			const [draft, setDraft] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const tabId = (0, react.useId)();
			(0, react.useEffect)(() => {
				let active = true;
				setLoading(true);
				setError("");
				props.listContext({
					...workspaceId ? { workspaceId } : {},
					...presetId ? { presetId } : {}
				}).then((result) => {
					if (active) {
						setView(result);
						if (!workspaceId && result.workspaceId) setWorkspaceId(result.workspaceId);
					}
				}).catch((failure) => {
					if (active) setError(String(failure));
				}).finally(() => {
					if (active) setLoading(false);
				});
				return () => {
					active = false;
				};
			}, [
				props.listContext,
				workspaceId,
				presetId,
				revision
			]);
			const openDocument = async (row) => {
				setError("");
				setNotice("");
				try {
					const result = await props.readDocument({
						workspaceId,
						...presetId ? { presetId } : {},
						kind: row.kind,
						id: row.id
					});
					setDocument(result);
					setDraft(result.content);
				} catch (failure) {
					setError(String(failure));
				}
			};
			const save = async () => {
				if (!document || busy) return;
				setBusy(true);
				setError("");
				try {
					const result = await props.saveDocument({
						workspaceId,
						...presetId ? { presetId } : {},
						kind: document.kind,
						id: document.id,
						content: draft,
						revision: document.revision
					});
					setDocument(result);
					setNotice(t("saved"));
					setRevision((value) => value + 1);
				} catch (failure) {
					setError(String(failure));
				} finally {
					setBusy(false);
				}
			};
			const close = () => {
				if (!busy) {
					setDocument(null);
					setPrompt(null);
					setError("");
				}
			};
			const rows = (view?.documents ?? []).filter((row) => tab === "skill" ? row.kind === "skill" : tab === "rule" ? row.kind === "rule" : tab === "prompt" && (row.kind === "prompt-file" || row.kind === "workspace-prompt")).filter((row) => `${row.name} ${row.description} ${row.source}`.toLowerCase().includes(query.toLowerCase()));
			const sections = (view?.promptSections ?? []).filter((row) => `${row.name} ${row.text}`.toLowerCase().includes(query.toLowerCase()));
			const runtime = (view?.runtimeContexts ?? []).filter((row) => `${row.name} ${row.text}`.toLowerCase().includes(query.toLowerCase()));
			const tabs = [
				"skill",
				"rule",
				"prompt",
				"system"
			];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ContextSection_module_css_default.page,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: ContextSection_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("subtitle") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							className: ContextSection_module_css_default.refresh,
							variant: "outline",
							size: "sm",
							onClick: () => setRevision((value) => value + 1),
							children: t("refresh")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ContextSection_module_css_default.controls,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
								label: t("workspace"),
								value: workspaceId,
								options: (view?.workspaces ?? []).map((row) => ({
									id: row.id,
									label: row.title
								})),
								onChange: (id) => {
									setWorkspaceId(id);
									setDocument(null);
									setPrompt(null);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
								label: t("agent"),
								value: presetId,
								options: [{
									id: "",
									label: t("allAgents")
								}, ...(view?.presets ?? []).map((row) => ({
									id: row.id,
									label: row.name
								}))],
								onChange: (id) => {
									setPresetId(id);
									setDocument(null);
									setPrompt(null);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								className: ContextSection_module_css_default.search ?? "",
								"aria-label": t("search"),
								placeholder: t("search"),
								value: query,
								onChange: (event) => setQuery(event.currentTarget.value)
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SegmentedTabs, {
						label: t("nav"),
						value: tab,
						onChange: setTab,
						items: tabs.map((value) => ({
							value,
							label: t(value),
							id: `${tabId}-${value}-tab`,
							panelId: `${tabId}-${value}-panel`
						}))
					}),
					loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						className: ContextSection_module_css_default.hint,
						children: t("loading")
					}),
					error && !document && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						className: ContextSection_module_css_default.error,
						children: error
					}),
					notice && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						className: ContextSection_module_css_default.notice,
						children: notice
					}),
					!loading && !view?.workspaces.length && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: ContextSection_module_css_default.empty,
						children: t("emptyWorkspace")
					}),
					view && tab !== "system" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						role: "tabpanel",
						id: `${tabId}-${tab}-panel`,
						"aria-labelledby": `${tabId}-${tab}-tab`,
						children: [
							tab === "rule" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: ContextSection_module_css_default.hint,
								children: t("candidate")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ContextSection_module_css_default.list,
								children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
									className: ContextSection_module_css_default.row,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: ContextSection_module_css_default.rowBody,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: row.name }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: row.description }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: ContextSection_module_css_default.meta,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
													tone: "quiet",
													children: row.source
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: (0, _deepseek_ai_dsh_client_ui_primitives.fileSizeText)(row.size) })]
											})
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: () => {
											openDocument(row);
										},
										children: row.editable ? t("edit") : t("view")
									})]
								}, `${row.kind}:${row.id}`))
							}),
							!rows.length && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: ContextSection_module_css_default.empty,
								children: t("empty")
							})
						]
					}),
					view && tab === "system" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						role: "tabpanel",
						id: `${tabId}-system-panel`,
						"aria-labelledby": `${tabId}-system-tab`,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: ContextSection_module_css_default.hint,
								children: t("systemHint")
							}),
							view.promptError && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
								role: "status",
								className: ContextSection_module_css_default.hint,
								children: [
									t("promptError"),
									" ",
									view.promptError
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ContextSection_module_css_default.list,
								children: [[...sections, ...runtime].map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
									className: ContextSection_module_css_default.row,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: ContextSection_module_css_default.rowBody,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: row.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: ContextSection_module_css_default.meta,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: (0, _deepseek_ai_dsh_client_ui_primitives.fileSizeText)(row.size) })
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: () => setPrompt(row),
										children: t("view")
									})]
								}, row.name)), view.systemPrompt && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
									className: ContextSection_module_css_default.row,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: ContextSection_module_css_default.rowBody,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("system") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: ContextSection_module_css_default.meta,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: (0, _deepseek_ai_dsh_client_ui_primitives.fileSizeText)(new TextEncoder().encode(view.systemPrompt).length) })
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: () => setPrompt({
											name: t("system"),
											text: view.systemPrompt,
											size: view.systemPrompt.length
										}),
										children: t("view")
									})]
								})]
							}),
							!sections.length && !runtime.length && !view.systemPrompt && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: ContextSection_module_css_default.empty,
								children: t("empty")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: !!document || !!prompt,
						title: document?.name ?? prompt?.name ?? "",
						closeLabel: t("close"),
						onClose: close,
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							onClick: close,
							children: t("close")
						}), document?.editable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							onClick: () => {
								save();
							},
							disabled: busy || draft === document.content,
							children: t(busy ? "saving" : "save")
						})] }),
						children: [
							document?.editable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
								className: ContextSection_module_css_default.editor,
								"aria-label": document.name,
								value: draft,
								disabled: busy,
								onChange: (event) => setDraft(event.currentTarget.value)
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: ContextSection_module_css_default.preview,
								children: document?.content ?? prompt?.text ?? ""
							}),
							document && !document.editable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: ContextSection_module_css_default.hint,
								children: t("readOnly")
							}),
							error && (document || prompt) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								role: "alert",
								className: ContextSection_module_css_default.error,
								children: error
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "settings.contextManager";
		const zh = {
			nav: "上下文管理",
			title: "上下文管理",
			subtitle: "查看工作区中可发现的文件，以及当前 Agent 的 Skill 和系统提示词。",
			workspace: "工作区",
			agent: "Agent",
			allAgents: "全局视图",
			search: "搜索名称、描述或来源",
			refresh: "刷新",
			skill: "Skill",
			rule: "Rules",
			prompt: "提示词文件",
			system: "系统提示词",
			runtime: "运行时上下文",
			emptyWorkspace: "还没有工作区",
			empty: "没有匹配的内容",
			loading: "正在读取上下文…",
			readError: "读取失败",
			view: "查看",
			edit: "编辑",
			save: "保存",
			cancel: "取消",
			close: "关闭",
			saving: "保存中…",
			saved: "已保存",
			bytes: "字节",
			source: "来源",
			readOnly: "此来源只可查看；请在原插件或配置中修改。",
			candidate: "发现的 Claude 文件。是否注入取决于 Claude 兼容插件的开关及路径规则。",
			systemHint: "这些片段来自运行时组装；在本页可编辑工作区专属的 system-prompt.md，其余片段请修改原来源。",
			promptError: "部分变量在当前视图尚未赋值；下方完整预览保留原始变量："
		};
		const en = {
			nav: "Context Manager",
			title: "Context Manager",
			subtitle: "Inspect discoverable workspace files and the current Agent’s Skills and system prompt.",
			workspace: "Workspace",
			agent: "Agent",
			allAgents: "Global view",
			search: "Search names, descriptions, or sources",
			refresh: "Refresh",
			skill: "Skills",
			rule: "Rules",
			prompt: "Prompt files",
			system: "System prompt",
			runtime: "Runtime context",
			emptyWorkspace: "No workspaces available",
			empty: "No matching content",
			loading: "Loading context…",
			readError: "Could not load context",
			view: "View",
			edit: "Edit",
			save: "Save",
			cancel: "Cancel",
			close: "Close",
			saving: "Saving…",
			saved: "Saved",
			bytes: "bytes",
			source: "Source",
			readOnly: "This source is read only here. Edit it in its owning plugin or configuration.",
			candidate: "Discovered Claude files. Injection depends on the Claude compatibility plugin settings and path rules.",
			systemHint: "These sections are assembled at runtime. This page can edit the workspace system-prompt.md; edit other sections at their source.",
			promptError: "Some variables have no value in this view; the complete preview below keeps their original placeholders:"
		};
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"locale",
			"remote"
		];
		async function apply(ctx) {
			const dispose = await ctx.remote.$mount(TYPERT_REMOTE);
			ctx.effect(() => () => dispose(), "context-manager: client remote");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "context-manager: locales");
			const t = ctx.locale.bind(NS);
			const call = async (method) => {
				const remote = ctx.get("remote.contextManager");
				if (!remote) throw new Error("Context manager is unavailable");
				const result = await method(remote);
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			};
			const actions = {
				listContext: (request) => call((remote) => remote.listContext(request)),
				readDocument: (request) => call((remote) => remote.readDocument(request)),
				saveDocument: (request) => call((remote) => remote.saveDocument(request))
			};
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "context-manager",
				order: 16,
				label: () => t("nav"),
				locale: NS,
				inject: () => actions
			}, ContextSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
