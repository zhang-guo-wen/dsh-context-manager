import type { InvocationDescriptor, TypertCodec, TypertRemoteContribution, TypertSchema } from '@deepseek-ai/dsh-typert-protocol'

const namespace = 'contextManager'
const schema: TypertSchema<unknown> = { parse: value => value }
const codec = (typeSymbol: string): TypertCodec => ({ mode: 'strict', typeSymbol, schema, create: () => schema } as TypertCodec)
export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: '@guowenzhang/dsh-context-manager',
  descriptors: ['listContext', 'readDocument', 'saveDocument'].map(method => {
    const owner = `@guowenzhang/dsh-context-manager#${namespace}/${method}`
    return { id: owner, service: namespace, namespace, method, invocation: { kind: 'direct' },
      parameters: [{ name: 'request', wire: 'request', source: 'json', codec: codec(`${owner}:request`) }],
      result: codec(`${owner}:result`) } satisfies InvocationDescriptor
  }),
}
