/**
 * Registro de demonstrativos emitidos, consultado pela página de verificação.
 *
 * `statements.json` é gerado por `scripts/generate-paystub.mjs` e fica FORA do
 * versionamento: carrega nome, período e valores de gente real. O repo é público.
 * Clone limpo cai no `.example` e valida só o documento de demonstração.
 */
import example from './statements.example.json'

const modules = import.meta.glob('./statements.json', { eager: true, import: 'default' })
export const STATEMENTS = Object.values(modules)[0] ?? example

export const findStatement = (id) => (id ? STATEMENTS[id] ?? null : null)
