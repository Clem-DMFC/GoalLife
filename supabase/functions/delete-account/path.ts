/**
 * Chemin de l'avatar dans le bucket `avatars`.
 *
 * Dupliqué de `src/lib/avatar.ts` : une fonction Edge ne peut importer que
 * depuis son propre dossier, pas depuis `src/`.
 */
export function avatarPath(userId: string): string {
  return `${userId}/avatar.jpg`
}
