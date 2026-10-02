import { defineConfig } from 'tsdown'
import ts from 'typescript'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'], outDir: 'lib', platform: 'node', dts: false,
  deps: { neverBundle: [/^@deepseek-ai\//] }, clean: true,
  plugins: [{ name: 'lower-remote-decorators', transform(code, id) {
    if (!/\.[cm]?tsx?$/.test(id) || !/^\s*@[A-Za-z_$]/m.test(code)) return
    const result = ts.transpileModule(code, { fileName: id, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext, sourceMap: true } })
    return { code: result.outputText.replace(/\n?\/\/# sourceMappingURL=.*$/u, '\n'), map: result.sourceMapText }
  } }],
})
