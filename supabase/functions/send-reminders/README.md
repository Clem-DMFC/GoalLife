# `send-reminders` — rappels planifiés

Envoie les notifications Web Push aux heures fixes de la journée (heure de
Paris). Appelée chaque minute par `pg_cron`.

## Pourquoi un serveur

iOS n'expose pas les Notification Triggers aux PWA : rien ne permet de
programmer une notification depuis le navigateur. Un `setTimeout` ne survit pas
à la fermeture de l'app. La seule voie qui marche quand l'app est fermée est le
Web Push — un serveur pousse, le service worker affiche.

Côté iPhone, deux conditions non négociables : **iOS 16.4 ou plus récent**, et
la PWA **installée sur l'écran d'accueil**. En onglet Safari, l'abonnement
n'existe pas.

## Mise en service

### 1. Générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

Deux chaînes base64url en sortent. Elles ne changent plus : les regénérer
invalide tous les abonnements existants.

### 2. Poser les secrets (Supabase)

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="BN…" \
  VAPID_PRIVATE_KEY="…" \
  VAPID_SUBJECT="mailto:ton@email.fr"
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont déjà fournis par la
plateforme, rien à faire.

`VAPID_SUBJECT` doit être un `mailto:` réel : c'est par là que les
administrateurs d'APNs ou de FCM joignent l'expéditeur en cas de problème.

### 3. Poser la clé publique côté client (Vercel)

Variable d'environnement `VITE_VAPID_PUBLIC_KEY`, **même valeur** que
`VAPID_PUBLIC_KEY`. C'est une clé publique, elle est faite pour partir dans le
bundle. Redéployer ensuite, sinon la variable n'est pas embarquée.

### 4. Déployer la fonction

```bash
supabase functions deploy send-reminders --no-verify-jwt
```

`--no-verify-jwt` est nécessaire : `pg_cron` appelle la fonction sans jeton
utilisateur. Le bouton « notif de test » de l'app, lui, passe par
`supabase.functions.invoke` avec la session en cours.

### 5. Planifier le cron

Dans l'éditeur SQL, activer les extensions puis planifier :

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'goatly-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Remplacer `<REF>` par la référence du projet et `<SERVICE_ROLE_KEY>` par la clé
service-role.

Purge hebdomadaire du journal d'envoi :

```sql
select cron.schedule('goatly-reminders-purge', '0 4 * * 0', $$select public.prune_reminder_log()$$);
```

Vérifier / défaire :

```sql
select * from cron.job;
select cron.unschedule('goatly-reminders');
```

## Modes

| Appel | Effet |
|---|---|
| `{}` | Mode cron : compare l'heure de Paris au planning, envoie si un créneau tombe. |
| `{"test": true}` | Envoie immédiatement une notification de test à tous les abonnements, sans toucher au journal. |

## Notes d'implémentation

**Fuseau.** L'heure de Paris est lue via `Intl` avec `timeZone: 'Europe/Paris'`,
donc le passage heure d'été / hiver est géré tout seul. Un décalage UTC codé en
dur décalerait tous les rappels d'une heure la moitié de l'année — c'est testé.

**Doublons.** `reminder_log` a pour clé primaire `(jour, créneau)`. La fonction
insère la ligne avant d'envoyer : si l'insertion échoue en violation
d'unicité, le rappel est déjà parti et rien n'est réémis. Sans cette garde, une
exécution rejouée doublerait la notification.

**Abonnements morts.** Un endpoint qui répond 404 ou 410 est supprimé de
`push_subscriptions` dans la foulée.

**Créneau raté.** La comparaison est exacte à la minute. Si le cron saute une
minute, le rappel est perdu plutôt qu'envoyé en retard — un rappel « déjeuner »
à 12 h 40 n'a plus d'intérêt.

## Dépannage

- Rien ne part : vérifier `select * from cron.job_run_details order by start_time desc limit 10;`
  puis les logs de la fonction dans le dashboard.
- La fonction répond 500 au démarrage : les clés VAPID sont mal formées. Le
  message dit laquelle et la taille attendue.
- L'abonnement échoue sur iPhone : l'app est ouverte en onglet, pas depuis
  l'icône de l'écran d'accueil.
