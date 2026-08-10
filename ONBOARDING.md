# ibs-training — Onboarding développeur

> Guide à destination d'un futur développeur (ou d'un futur Claude) qui découvrirait ce projet.

---

## 1. À quoi sert ce projet ?

**À compléter** : 1 paragraphe qui répond à « c'est quoi ce projet, à quel problème il répond, pour qui ? »

→ Voir aussi la fiche détaillée dans **daniel-hub** : `daniel-hub/src/lib/docs/ibs-training.ts`

---

## 2. Démarrage en local

```bash
git clone https://github.com/danielnadjar/ibs-training.git
cd ibs-training
npm install
cp .env.example .env.local   # remplir les clés Supabase + autres
npm run dev
```

Ouvrir http://localhost:3000.

---

## 3. Stack & architecture

**À compléter** depuis la fiche `daniel-hub/src/lib/docs/ibs-training.ts` (section `stack` + `architecture`).

En général dans l'écosystème Daniel :
- **Frontend** : Next.js 15+ App Router OU React + Vite, TypeScript, Tailwind
- **Backend** : API Routes Next.js
- **BDD** : Supabase (base unifiée `cbfypewsudbcuslhpkzx`)
- **Auth** : Supabase Auth (login/signup/forgot/reset/callback)
- **Déploiement** : Vercel (auto-deploy via webhook GitHub sur push main)

---

## 4. Production

| Élément | Valeur |
|---|---|
| URL prod | _À compléter_ |
| Repo GitHub | https://github.com/danielnadjar/ibs-training (privé) |
| Fiche hub | https://daniel-hub.vercel.app/apps/ibs-training |
| Dashboard Vercel | https://vercel.com/contact-3727s-projects/ibs-training |

---

## 5. Variables d'environnement

Voir `.env.example` à la racine. Les valeurs réelles sont dans :
- En **local** : `.env.local` (à créer, gitignored)
- En **prod** : Vercel → Settings → Environment Variables
- Le projet Supabase unifié : ID `cbfypewsudbcuslhpkzx` (clés disponibles dans le dashboard Supabase de Daniel)

---

## 6. Conventions de travail

- **🛑 Aucun code sans GO explicite** de Daniel (voir mémoire Claude `feedback_no_code_without_go.md`)
- **💻 Dev en local d'abord**, push uniquement sur GO (voir `workflow_dev_local.md`)
- **📋 Tout est tracé dans `BACKLOG.md`** — on n'efface jamais une demande
- **🔒 Repos toujours privés** (exception : `ibs-training` à cause de GitHub Pages Free)
- **📧 Email admin par défaut** : `contact@ibsformation.com`
- **🔄 Sync daniel-hub** : à chaque modif non-triviale, mettre à jour `daniel-hub/src/lib/docs/ibs-training.ts` + commit + push

---

## 7. Pièges connus

**À compléter** au fil de l'eau, par expérience.

---

## 8. Liens utiles

- **Backlog du projet** : voir `BACKLOG.md`
- **Mémoire Claude** : `~/.claude/projects/C--Users-conta/memory/project_ibs-training.md` (si elle existe)
- **Fiche daniel-hub** : `daniel-hub/src/lib/docs/ibs-training.ts`

---

*Fichier généré par le skill `/lancementdeprojet` v2.1.0 — 2026-05-18 (rétroactif).*
