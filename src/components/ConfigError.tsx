/** Écran affiché quand les variables Supabase manquent au build. */
export function ConfigError({ missing }: { missing: string[] }) {
  return (
    <div className="safe-top safe-bottom safe-x flex min-h-[100dvh] flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold tracking-tight">Configuration incomplète</h1>

        <p className="text-sm leading-snug text-black/60">
          {missing.length > 1 ? 'Ces variables sont absentes' : 'Cette variable est absente'} du
          build :
        </p>

        <ul className="card space-y-1 font-mono text-[13px]">
          {missing.map((name) => (
            <li key={name} className="text-protein">
              {name}
            </li>
          ))}
        </ul>

        <div className="card space-y-2 text-[13px] leading-snug text-black/60">
          <p>
            <span className="font-semibold text-ink">En local :</span> crée un fichier{' '}
            <code className="font-mono">.env</code> à la racine du projet, puis relance{' '}
            <code className="font-mono">npm run dev</code>.
          </p>
          <p>
            <span className="font-semibold text-ink">Sur Vercel :</span> ajoute-les dans
            Settings → Environment Variables, puis relance un déploiement. Elles sont
            injectées au build, pas au chargement de la page — un simple rechargement ne
            suffit pas.
          </p>
          <p className="text-black/45">
            Le préfixe <code className="font-mono">VITE_</code> est obligatoire : Vite ignore
            les variables qui ne l'ont pas.
          </p>
        </div>
      </div>
    </div>
  )
}
