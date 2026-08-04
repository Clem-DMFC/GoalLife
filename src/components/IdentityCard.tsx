import { useRef, useState } from 'react'
import { Avatar } from './Avatar'
import { useToast } from './Toaster'
import { AvatarError, removeAvatar, uploadAvatar } from '../lib/avatar'
import type { Identity } from '../lib/types'

/**
 * Qui l'on est, en tête des réglages : photo, prénom, email.
 *
 * L'identité vit ici plutôt que dans un point d'entrée en haut à droite : ce
 * coin est le plus difficile à atteindre au pouce, et l'onglet Réglages
 * porte déjà tout ce qui touche au compte.
 */
export function IdentityCard({
  identity,
  email,
  userId,
  onSave,
}: {
  identity: Identity
  email: string | undefined
  userId: string
  onSave: (next: Partial<Identity>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(identity.first_name ?? '')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const pickPhoto = async (file: File) => {
    setBusy(true)
    try {
      const url = await uploadAvatar(userId, file)
      await onSave({ avatar_url: url })
      toast.success('Photo mise à jour')
    } catch (err) {
      toast.error(
        err instanceof AvatarError || err instanceof Error
          ? err.message
          : "La photo n'a pas pu être envoyée."
      )
    } finally {
      setBusy(false)
      // Réinitialiser l'input : sans ça, re-choisir le même fichier ne
      // déclencherait aucun `change`.
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const dropPhoto = async () => {
    setBusy(true)
    try {
      await onSave({ avatar_url: null })
      // Le fichier part après la colonne : si le stockage refuse, la fiche
      // n'affiche déjà plus la photo, ce qui est le comportement voulu.
      await removeAvatar(userId)
      toast.success('Photo retirée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Suppression impossible.')
    } finally {
      setBusy(false)
    }
  }

  const saveName = async () => {
    const trimmed = name.trim()
    setBusy(true)
    try {
      await onSave({ first_name: trimmed === '' ? null : trimmed.slice(0, 40) })
      setEditing(false)
      toast.success('Prénom enregistré')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enregistrement impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-2">
      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Changer la photo de profil"
            className="relative shrink-0 select-none rounded-full disabled:opacity-50"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Avatar
              url={identity.avatar_url}
              firstName={identity.first_name}
              email={email}
              size={56}
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] shadow ring-1 ring-ink/10">
              {busy ? '…' : '✎'}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                className="field py-2 text-[15px]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton prénom"
                aria-label="Prénom"
                maxLength={40}
                autoFocus
                enterKeyHint="done"
                onKeyDown={(e) => e.key === 'Enter' && void saveName()}
              />
            ) : (
              <div className="truncate text-base font-semibold">
                {identity.first_name || 'Sans prénom'}
              </div>
            )}
            <div className="mt-0.5 truncate text-[11px] text-ink/45">{email ?? '—'}</div>
          </div>

          {!editing && (
            <button
              type="button"
              className="shrink-0 select-none px-2 text-[12px] text-ink/45 underline underline-offset-2"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              onClick={() => {
                setName(identity.first_name ?? '')
                setEditing(true)
              }}
            >
              Modifier
            </button>
          )}
        </div>

        {editing && (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost flex-1 py-2.5 text-sm"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn-primary flex-1 py-2.5 text-sm"
              onClick={() => void saveName()}
              disabled={busy}
            >
              {busy ? '…' : 'Enregistrer'}
            </button>
          </div>
        )}

        {identity.avatar_url && !editing && (
          <button
            type="button"
            className="w-full select-none text-right text-[11px] text-ink/40 underline underline-offset-2 disabled:opacity-40"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => void dropPhoto()}
            disabled={busy}
          >
            Retirer la photo
          </button>
        )}
      </div>

      {/* `capture` absent volontairement : iOS propose alors la photothèque
          *et* l'appareil photo, au lieu d'imposer la seconde. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void pickPhoto(file)
        }}
      />
    </section>
  )
}
