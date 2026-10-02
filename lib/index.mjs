import { readFileSync, realpathSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { discoverBaselineInstructionFiles } from "@deepseek-ai/dsh-agent-instructions";
import { renderPrompt } from "@deepseek-ai/dsh-system-prompt";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { homedir } from "node:os";
function revisionOf(content) {
	return createHash("sha256").update(content).digest("hex");
}
function inside(root, path) {
	const rel = relative(root, path);
	return rel === "" || rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}
async function readableWorkspaceFile(root, path) {
	const canonicalRoot = await realpath(root);
	const canonicalFile = await realpath(path);
	if (!inside(canonicalRoot, canonicalFile)) throw new Error("Document is outside the selected workspace");
	const info = await stat(canonicalFile);
	if (!info.isFile() || info.size > 1048576) throw new Error("Document is not a supported text file");
	return canonicalFile;
}
async function readDocumentFile(path) {
	const content = await readFile(path, "utf8");
	if (Buffer.byteLength(content) > 1048576) throw new Error("Document is too large");
	return {
		content,
		revision: revisionOf(content)
	};
}
async function saveExistingFile(root, path, content, revision) {
	if (Buffer.byteLength(content) > 1048576) throw new Error("Document is too large");
	const canonicalFile = await readableWorkspaceFile(root, path);
	if (revision !== (await readDocumentFile(canonicalFile)).revision) throw new Error("Document changed since it was opened; reload before saving");
	await writeFile(canonicalFile, content, "utf8");
	return revisionOf(content);
}
function workspacePromptPath(root) {
	return join(root, ".dsh", "context-manager", "system-prompt.md");
}
async function saveWorkspacePrompt(root, content, revision) {
	if (Buffer.byteLength(content) > 1048576) throw new Error("Document is too large");
	const canonicalRoot = await realpath(root);
	const dshDirectory = join(root, ".dsh");
	await mkdir(dshDirectory, { recursive: true });
	if (!inside(canonicalRoot, await realpath(dshDirectory))) throw new Error("Prompt directory is outside the selected workspace");
	const directory = dirname(workspacePromptPath(root));
	await mkdir(directory, { recursive: true });
	const canonicalDirectory = await realpath(directory);
	if (!inside(canonicalRoot, canonicalDirectory)) throw new Error("Prompt directory is outside the selected workspace");
	const target = resolve(canonicalDirectory, "system-prompt.md");
	let current;
	try {
		const canonicalFile = await realpath(target);
		if (!inside(canonicalRoot, canonicalFile)) throw new Error("Prompt file is outside the selected workspace");
		current = await readDocumentFile(canonicalFile);
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
	}
	if ((current?.revision ?? null) !== revision) throw new Error("Prompt changed since it was opened; reload before saving");
	await writeFile(target, content, "utf8");
	return revisionOf(content);
}
//#endregion
//#region src/known-files.ts
async function fileSize(path) {
	try {
		const info = await stat(path);
		return info.isFile() ? info.size : void 0;
	} catch {
		return;
	}
}
async function projectRoot(cwd) {
	let path = resolve(cwd);
	for (;;) {
		try {
			await stat(join(path, ".git"));
			return path;
		} catch {}
		const parent = dirname(path);
		if (parent === path) return resolve(cwd);
		path = parent;
	}
}
function directoryChain(root, cwd) {
	const chain = [resolve(cwd)];
	while (chain[0] !== root) {
		const parent = dirname(chain[0]);
		if (parent === chain[0]) return [resolve(cwd)];
		chain.unshift(parent);
	}
	return chain;
}
async function markdownFiles(root) {
	const found = [], pending = [root];
	while (pending.length && found.length < 1e3) {
		const current = pending.pop();
		let entries;
		try {
			entries = await readdir(current, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			const path = join(current, entry.name);
			if (entry.isDirectory()) pending.push(path);
			else if (entry.isFile() && entry.name.endsWith(".md")) found.push(path);
		}
	}
	return found.sort();
}
/** Known file sources are candidates; provider switches and path-scoped activation are separate. */
async function knownContextFiles(workspace) {
	const root = await projectRoot(workspace);
	const claudeHome = process.env.CLAUDE_CONFIG_DIR ?? process.env.CLAUDE_HOME ?? join(homedir(), ".claude");
	const files = [];
	for (const path of await markdownFiles(join(root, ".claude", "rules"))) files.push({
		path,
		kind: "rule",
		source: "claude-compat:project-candidate"
	});
	for (const path of await markdownFiles(join(claudeHome, "rules"))) files.push({
		path,
		kind: "rule",
		source: "claude-compat:user-candidate"
	});
	files.push({
		path: join(claudeHome, "CLAUDE.md"),
		kind: "prompt-file",
		source: "claude-compat:user-candidate"
	});
	for (const directory of directoryChain(root, workspace)) for (const path of [
		join(directory, "CLAUDE.md"),
		join(directory, ".claude", "CLAUDE.md"),
		join(directory, "CLAUDE.local.md")
	]) files.push({
		path,
		kind: "prompt-file",
		source: "claude-compat:project-candidate"
	});
	const result = [];
	for (const { path, kind, source } of files) {
		const size = await fileSize(path);
		if (size === void 0) continue;
		result.push({
			kind,
			id: path,
			name: inside(root, path) ? relative(root, path) : path,
			description: source,
			size,
			source,
			path,
			editable: inside(workspace, path)
		});
	}
	return result;
}
//#endregion
//#region src/remote-service.ts
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
var __addDisposableResource = function(env, value, async) {
	if (value !== null && value !== void 0) {
		if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
		var dispose, inner;
		if (async) {
			if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
			dispose = value[Symbol.asyncDispose];
		}
		if (dispose === void 0) {
			if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
			dispose = value[Symbol.dispose];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		env.stack.push({
			value,
			dispose,
			async
		});
	} else if (async) env.stack.push({ async: true });
	return value;
};
var __disposeResources = (function(SuppressedError) {
	return function(env) {
		function fail(e) {
			env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
			env.hasError = true;
		}
		var r, s = 0;
		function next() {
			while (r = env.stack.pop()) try {
				if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
				if (r.dispose) {
					var result = r.dispose.call(r.value);
					if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
						fail(e);
						return next();
					});
				} else s |= 1;
			} catch (e) {
				fail(e);
			}
			if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
			if (env.hasError) throw env.error;
		}
		return next();
	};
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
	var e = new Error(message);
	return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
let ContextManagerRemote = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _listContext_decorators;
	let _readDocument_decorators;
	let _saveDocument_decorators;
	return class ContextManagerRemote extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_listContext_decorators = [Remote("listContext")];
			_readDocument_decorators = [Remote("readDocument")];
			_saveDocument_decorators = [Remote("saveDocument")];
			__esDecorate(this, null, _listContext_decorators, {
				kind: "method",
				name: "listContext",
				static: false,
				private: false,
				access: {
					has: (obj) => "listContext" in obj,
					get: (obj) => obj.listContext
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _readDocument_decorators, {
				kind: "method",
				name: "readDocument",
				static: false,
				private: false,
				access: {
					has: (obj) => "readDocument" in obj,
					get: (obj) => obj.readDocument
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _saveDocument_decorators, {
				kind: "method",
				name: "saveDocument",
				static: false,
				private: false,
				access: {
					has: (obj) => "saveDocument" in obj,
					get: (obj) => obj.saveDocument
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		constructor(ctx) {
			super(ctx, "contextManager");
			__runInitializers(this, _instanceExtraInitializers);
		}
		workspaces() {
			return (this.ctx.get("workspaceRegistry")?.list() ?? []).map((row) => ({
				id: row.id,
				title: row.title,
				path: row.path
			}));
		}
		workspace(id) {
			const rows = this.workspaces();
			if (!id) return rows[0];
			const row = rows.find((item) => item.id === id);
			if (!row) throw new Error("Selected workspace no longer exists");
			return row;
		}
		async scope(presetId) {
			if (!presetId) return void 0;
			const presets = this.ctx.get("agentPresets");
			if (!presets) throw new Error("Agent presets are unavailable");
			return await presets.acquireScope(presetId);
		}
		async documents(workspace, scope) {
			const result = [];
			const skills = this.ctx.get("skills");
			if (skills) for (const skill of await skills.list({
				cwd: workspace.path,
				scope
			})) {
				let size = 0;
				if (skill.path) try {
					size = (await stat(skill.path)).size;
				} catch {}
				else try {
					size = Buffer.byteLength((await skills.get(skill.name, {
						cwd: workspace.path,
						scope
					}))?.content ?? "");
				} catch {}
				result.push({
					kind: "skill",
					id: skill.name,
					name: skill.name,
					description: skill.description,
					size,
					source: skill.source,
					provider: skill.provider,
					...skill.path ? { path: skill.path } : {},
					editable: !!skill.path && inside(workspace.path, skill.path)
				});
			}
			for (const file of await discoverBaselineInstructionFiles({ cwd: workspace.path })) {
				let size = 0;
				try {
					size = (await stat(file.absolutePath)).size;
				} catch {
					continue;
				}
				result.push({
					kind: "rule",
					id: file.absolutePath,
					name: file.displayPath,
					description: file.displayPath,
					size,
					source: "workspace-instructions",
					path: file.absolutePath,
					editable: inside(workspace.path, file.absolutePath)
				});
			}
			const seen = new Set(result.map((row) => row.path));
			for (const file of await knownContextFiles(workspace.path)) if (!seen.has(file.path)) {
				result.push(file);
				seen.add(file.path);
			}
			const promptPath = workspacePromptPath(workspace.path);
			let promptSize = 0;
			try {
				promptSize = (await stat(promptPath)).size;
			} catch {}
			result.push({
				kind: "workspace-prompt",
				id: "workspace",
				name: basename(promptPath),
				description: "Workspace system prompt contributed by context manager",
				size: promptSize,
				source: "context-manager",
				path: promptPath,
				editable: true
			});
			return result;
		}
		async listContext(request) {
			const env_1 = {
				stack: [],
				error: void 0,
				hasError: false
			};
			try {
				const workspaces = this.workspaces();
				const presets = (await this.ctx.get("agentPresets")?.list() ?? []).map((row) => ({
					id: row.id,
					name: row.name ?? row.id,
					...row.broken ? { broken: row.broken } : {}
				}));
				const workspace = this.workspace(request.workspaceId);
				if (!workspace) return {
					workspaces,
					presets,
					documents: [],
					promptSections: [],
					runtimeContexts: [],
					systemPrompt: ""
				};
				const lease = __addDisposableResource(env_1, await this.scope(request.presetId), true);
				const documents = await this.documents(workspace, lease?.key);
				let promptSections = [];
				let runtimeContexts = [];
				let systemPrompt = "";
				let promptError;
				try {
					const assembly = await this.ctx.get("systemPrompt")?.assemble({
						scope: lease?.key,
						cwd: workspace.path
					});
					if (assembly) {
						promptSections = assembly.sections.map((row) => ({
							name: row.name,
							text: row.text,
							size: Buffer.byteLength(row.text)
						}));
						runtimeContexts = assembly.contexts.map((row) => ({
							name: row.name,
							text: row.text,
							size: Buffer.byteLength(row.text)
						}));
						try {
							systemPrompt = renderPrompt(assembly);
						} catch (error) {
							promptError = String(error);
							systemPrompt = assembly.sections.map((section) => section.text).filter(Boolean).join("\n\n");
						}
					}
				} catch (error) {
					promptError = String(error);
				}
				return {
					workspaces,
					presets,
					workspaceId: workspace.id,
					...request.presetId ? { presetId: request.presetId } : {},
					documents,
					promptSections,
					runtimeContexts,
					systemPrompt,
					...promptError ? { promptError } : {}
				};
			} catch (e_1) {
				env_1.error = e_1;
				env_1.hasError = true;
			} finally {
				const result_1 = __disposeResources(env_1);
				if (result_1) await result_1;
			}
		}
		async row(request, workspace, scope) {
			const row = (await this.documents(workspace, scope)).find((item) => item.kind === request.kind && item.id === request.id);
			if (!row) throw new Error("Document is no longer available in this workspace and Agent view");
			return row;
		}
		async readDocument(request) {
			const env_2 = {
				stack: [],
				error: void 0,
				hasError: false
			};
			try {
				const workspace = this.workspace(request.workspaceId);
				if (!workspace) throw new Error("Select a workspace first");
				const lease = __addDisposableResource(env_2, await this.scope(request.presetId), true);
				const row = await this.row(request, workspace, lease?.key);
				if (row.kind === "workspace-prompt") try {
					const current = await readDocumentFile(await readableWorkspaceFile(workspace.path, workspacePromptPath(workspace.path)));
					return {
						...row,
						content: current.content,
						revision: current.revision
					};
				} catch (error) {
					if (error instanceof Error && "code" in error && error.code === "ENOENT") return {
						...row,
						content: "",
						revision: null
					};
					throw error;
				}
				if (row.path) {
					const current = await readDocumentFile(row.editable ? await readableWorkspaceFile(workspace.path, row.path) : row.path);
					return {
						...row,
						content: current.content,
						revision: current.revision
					};
				}
				const content = (await this.ctx.get("skills")?.get(row.id, {
					cwd: workspace.path,
					scope: lease?.key
				}))?.content;
				if (content === void 0) throw new Error("Skill content is unavailable");
				return {
					...row,
					content,
					revision: revisionOf(content)
				};
			} catch (e_2) {
				env_2.error = e_2;
				env_2.hasError = true;
			} finally {
				const result_2 = __disposeResources(env_2);
				if (result_2) await result_2;
			}
		}
		async saveDocument(request) {
			const env_3 = {
				stack: [],
				error: void 0,
				hasError: false
			};
			try {
				const workspace = this.workspace(request.workspaceId);
				if (!workspace) throw new Error("Select a workspace first");
				const lease = __addDisposableResource(env_3, await this.scope(request.presetId), true);
				const row = await this.row(request, workspace, lease?.key);
				if (!row.editable) throw new Error("This document is owned by another provider and cannot be edited here");
				const revision = row.kind === "workspace-prompt" ? await saveWorkspacePrompt(workspace.path, request.content, request.revision) : await saveExistingFile(workspace.path, row.path, request.content, request.revision);
				return {
					...row,
					size: Buffer.byteLength(request.content),
					content: request.content,
					revision
				};
			} catch (e_3) {
				env_3.error = e_3;
				env_3.hasError = true;
			} finally {
				const result_3 = __disposeResources(env_3);
				if (result_3) await result_3;
			}
		}
	};
})();
//#endregion
//#region src/index.ts
const name = "context-manager";
const inject = ["systemPrompt"];
function workspaceCwd(context) {
	if (context.cwd) return context.cwd;
	return context.scope?.session?.header?.cwd;
}
function apply(ctx) {
	ctx.effect(() => ctx.get("systemPrompt").section({
		name: "context-manager:workspace",
		order: 10300,
		interpolate: false,
		text: (context) => {
			const cwd = workspaceCwd(context);
			if (!cwd) return "";
			const workspace = ctx.get("workspaceRegistry")?.list().filter((row) => inside(row.path, cwd)).sort((a, b) => b.path.length - a.path.length)[0];
			if (!workspace) return "";
			const path = workspacePromptPath(workspace.path);
			try {
				const root = realpathSync(workspace.path);
				const file = realpathSync(path);
				if (!inside(root, file)) throw new Error("Workspace prompt resolves outside the workspace");
				if (statSync(file).size > 1048576) throw new Error("Workspace prompt is too large");
				return readFileSync(file, "utf8");
			} catch (error) {
				if (error instanceof Error && "code" in error && error.code === "ENOENT") return "";
				throw error;
			}
		}
	}), "context-manager: workspace prompt");
	new ContextManagerRemote(ctx);
}
//#endregion
export { apply, inject, name };
