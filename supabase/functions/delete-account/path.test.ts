import { expect, test } from 'vitest'
import { avatarPath } from './path.ts'

test('un chemin par utilisateur, sous le bucket avatars', () => {
  expect(avatarPath('u1')).toBe('u1/avatar.jpg')
})
