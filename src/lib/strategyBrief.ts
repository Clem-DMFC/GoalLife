import { supabase } from './supabase'
import type { ComputedTargets, Profile } from './nutrition'

/**
 * Brief de coach généré par l'IA à partir des objectifs déjà calculés par la
 * formule (`src/lib/nutrition.ts`). Ce module n'envoie jamais les chiffres
 * pour qu'ils soient recalculés — seulement pour être commentés.
 */

export type StrategyBriefResult = {
  message: string
  focusPoints: string[]
}

export class StrategyBriefError extends Error {}

/**
 * Le paragraphe et les priorités composés en un seul texte : c'est ce qui
 * est affiché **et** ce qui est stocké dans `profile.strategy_brief` (une
 * seule colonne texte) — jamais deux représentations qui pourraient diverger.
 */
export function formatBrief({ message, focusPoints }: StrategyBriefResult): string {
  if (focusPoints.length === 0) return message
  return `${message}\n\nPriorités :\n${focusPoints.map((p) => `• ${p}`).join('\n')}`
}

/** Le brief est un bonus : un appel qui pend ne doit pas retenir l'écran. */
const TIMEOUT_MS = 15000

/**
 * Demande le brief à l'Edge Function `strategy-brief`.
 *
 * Ne lève jamais silencieusement dans le vide : l'appelant décide de
 * l'affichage (chargement, texte, ou repli discret), cette fonction se
 * contente de réussir ou d'échouer clairement.
 */
export async function requestStrategyBrief(
  profile: Profile,
  targets: Pick<ComputedTargets, 'kcal' | 'protein' | 'carbs' | 'fat' | 'bmr' | 'tdee'>
): Promise<StrategyBriefResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const { data, error } = await supabase.functions.invoke('strategy-brief', {
      body: {
        profile,
        targets: {
          kcal: targets.kcal,
          protein: targets.protein,
          carbs: targets.carbs,
          fat: targets.fat,
          bmr: targets.bmr,
          tdee: targets.tdee,
        },
      },
      signal: controller.signal,
    })

    if (error) throw new StrategyBriefError(error.message)
    if (!data || typeof data.message !== 'string' || data.message.trim() === '') {
      throw new StrategyBriefError('Réponse du brief invalide.')
    }

    return {
      message: data.message,
      focusPoints: Array.isArray(data.focus_points) ? data.focus_points : [],
    }
  } catch (err) {
    if (err instanceof StrategyBriefError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new StrategyBriefError('La génération du brief a pris trop de temps.')
    }
    throw new StrategyBriefError('Brief indisponible pour le moment.')
  } finally {
    clearTimeout(timer)
  }
}
