// Goatly — brief de coach IA, interprète les objectifs sans les recalculer
//
// Appelée par l'app (JWT utilisateur vérifié par la passerelle Supabase —
// déployer SANS --no-verify-jwt, à l'inverse de send-reminders qui est
// appelée par pg_cron sans session). Ne touche à aucune table : le client
// reçoit le texte et décide seul de le stocker.

import { BRIEF_TOOL, buildUserPrompt, SYSTEM_PROMPT } from './prompt.ts'
import { parseBody, ValidationError } from './validate.ts'
import { extractBrief, type ContentBlock } from './response.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
// Sonnet, pas Opus : un brief de quelques phrases n'a pas besoin du modèle
// le plus coûteux.
const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 600

/** Un dépassement de temps ne doit pas laisser l'onboarding attendre indéfiniment. */
const TIMEOUT_MS = 15000

async function callAnthropic(system: string, user: string): Promise<ContentBlock[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY absente des secrets de la fonction.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // `cache_control` sur le system prompt : il ne change jamais d'un
        // appel à l'autre, donc éligible au cache — moins cher, plus rapide,
        // sur tout appel qui suit un premier dans la fenêtre de cache.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        tools: [BRIEF_TOOL],
        tool_choice: { type: 'tool', name: BRIEF_TOOL.name },
        messages: [{ role: 'user', content: user }],
      }),
    })
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Anthropic a répondu ${res.status}${detail ? ` : ${detail.slice(0, 200)}` : ''}.`
    )
  }

  const data = (await res.json()) as { content?: ContentBlock[] }
  return data.content ?? []
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Méthode non supportée.' }, { status: 405 })
  }

  try {
    const body = await req.json().catch(() => null)
    const { profile, targets } = parseBody(body)

    const content = await callAnthropic(SYSTEM_PROMPT, buildUserPrompt(profile, targets))
    const brief = extractBrief(content)

    return Response.json(brief)
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      return Response.json(
        { error: 'La génération du brief a pris trop de temps.' },
        { status: 504 }
      )
    }
    console.error(err)
    return Response.json({ error: 'Le brief est momentanément indisponible.' }, { status: 500 })
  }
})
