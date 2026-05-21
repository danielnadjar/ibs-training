# 🤝 HANDOFF — IBS Training

> Stub généré le 2026-05-21.

---

## 🎯 En une phrase
**Site d'entraînement aux techniques commerciales pour Coach Daniel** — bots de simulation de conversations (vendeur, acheteur, négociation) + outil d'estimation. Site statique HTML hébergé sur GitHub Pages.

## 📊 Statut actuel
- [x] **Prod** — GitHub Pages, repo PUBLIC (exception car GitHub Pages Free ne supporte pas les repos privés, cf. mémoire `feedback_ibs_training_public.md`)
- ⚠️ **Pour privatiser** : migrer Pages → Vercel d'abord

**Repo GitHub** : https://github.com/danielnadjar/ibs-training (**PUBLIC**)
**URL prod** : probablement `https://danielnadjar.github.io/ibs-training/` ou domaine custom

---

## 🚀 Démarrage

Site 100% statique HTML/JS. Pas de build, pas de npm install.

```bash
git clone https://github.com/danielnadjar/ibs-training.git
cd ibs-training
# Ouvrir index.html dans un browser
# Ou servir localement :
python -m http.server 8000
```

---

## 🧱 Stack technique

| Couche | Techno |
|---|---|
| Type | Site statique HTML/CSS/JS vanilla |
| Hébergement | GitHub Pages |
| Auth | `ibs-auth.js` (custom, à auditer) |
| Sync data | `google-sheet-sync.js` (Google Sheets en backend ?) |

Fichiers principaux :
- `index.html` — page d'accueil avec grille de bots
- `admin.html` — interface admin
- `estimation.html` — outil d'estimation

---

## ⚠️ Dette technique

- [ ] **Repo public** : si données sensibles dans le code → migrer vers Vercel + privatiser le repo
- [ ] Auth custom à auditer
- [ ] Pas de version build → modifs en direct sur main risquées

---

## 🔗 Intégration

- Lien depuis le hub probable
- Pas de Supabase utilisée (en théorie, à confirmer)

---

**Contact** : Daniel Nadjar — contact@ibsformation.com
