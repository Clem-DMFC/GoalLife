/**
 * Lecture de la réponse Anthropic. Module pur (aucun appel réseau), séparé
 * d'`index.ts` pour rester testable — `index.ts` appelle `Deno.serve` au
 * chargement du module, ce que Vitest ne peut pas exécuter.
 */

export type ToolUseBlock = { type: 'tool_use'; name: string; input: Record<string, unknown> }
export type ContentBlock = ToolUseBlock | { type: string; [k: string]: unknown }

export type Brief = { message: string; focus_points: string[] }

export class BriefResponseError extends Error {}

/**
 * `tool_choice` force le modèle à appeler l'outil, mais rien ne garantit sa
 * position dans le tableau `content` — on cherche le bloc plutôt que de
 * supposer l'index 0.
 */
export function extractBrief(content: ContentBlock[]): Brief {
  const toolUse = content.find((b): b is ToolUseBlock => b.type === 'tool_use')
  if (!toolUse) throw new BriefResponseError("Le modèle n'a pas utilisé l'outil attendu.")

  const message = toolUse.input.message
  if (typeof message !== 'string' || message.trim() === '') {
    throw new BriefResponseError('Le modèle a renvoyé un brief vide.')
  }

  const raw = toolUse.input.focus_points
  const focus_points = Array.isArray(raw)
    ? raw.filter((p): p is string => typeof p === 'string' && p.trim() !== '').slice(0, 3)
    : []

  return { message: message.trim(), focus_points }
}
