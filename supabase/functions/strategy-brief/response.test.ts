import { describe, expect, test } from 'vitest'
import { extractBrief, BriefResponseError, type ContentBlock } from './response'

describe('extractBrief', () => {
  test('lit le message et les priorités depuis le bloc tool_use', () => {
    const content: ContentBlock[] = [
      {
        type: 'tool_use',
        name: 'deliver_brief',
        input: { message: 'Bonjour, voici ton brief.', focus_points: ['Dors plus', 'Bois de l’eau'] },
      },
    ]
    expect(extractBrief(content)).toEqual({
      message: 'Bonjour, voici ton brief.',
      focus_points: ['Dors plus', 'Bois de l’eau'],
    })
  })

  test('trouve le bloc tool_use même précédé d’un bloc texte', () => {
    const content: ContentBlock[] = [
      { type: 'text', text: 'réflexion...' },
      { type: 'tool_use', name: 'deliver_brief', input: { message: 'Le brief.' } },
    ]
    expect(extractBrief(content).message).toBe('Le brief.')
  })

  test('sans priorités, renvoie un tableau vide plutôt que planter', () => {
    const content: ContentBlock[] = [
      { type: 'tool_use', name: 'deliver_brief', input: { message: 'Le brief.' } },
    ]
    expect(extractBrief(content).focus_points).toEqual([])
  })

  test('plafonne à 3 priorités même si le modèle en renvoie plus', () => {
    const content: ContentBlock[] = [
      {
        type: 'tool_use',
        name: 'deliver_brief',
        input: { message: 'Le brief.', focus_points: ['a', 'b', 'c', 'd', 'e'] },
      },
    ]
    expect(extractBrief(content).focus_points).toHaveLength(3)
  })

  test('ignore les entrées de priorités qui ne sont pas des chaînes', () => {
    const content: ContentBlock[] = [
      {
        type: 'tool_use',
        name: 'deliver_brief',
        input: { message: 'Le brief.', focus_points: ['ok', 42, null, '  '] },
      },
    ]
    expect(extractBrief(content).focus_points).toEqual(['ok'])
  })

  test('rejette une réponse sans bloc tool_use', () => {
    const content: ContentBlock[] = [{ type: 'text', text: 'juste du texte' }]
    expect(() => extractBrief(content)).toThrow(BriefResponseError)
  })

  test('rejette un message absent ou vide', () => {
    expect(() =>
      extractBrief([{ type: 'tool_use', name: 'deliver_brief', input: {} }])
    ).toThrow(BriefResponseError)
    expect(() =>
      extractBrief([{ type: 'tool_use', name: 'deliver_brief', input: { message: '   ' } }])
    ).toThrow(BriefResponseError)
  })

  test('coupe les espaces autour du message', () => {
    const content: ContentBlock[] = [
      { type: 'tool_use', name: 'deliver_brief', input: { message: '  Le brief.  ' } },
    ]
    expect(extractBrief(content).message).toBe('Le brief.')
  })
})
