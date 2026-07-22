# OrdoMed Lite

Version allégée de OrdoMed, conçue pour être hébergée sur **GitHub Pages** (Frontend Statique) avec une base de données et authentification gérées via **Supabase** (Backend as a Service).

## Architecture

```text
ordo_med_lite/
├── index.html              # Page de connexion / création de compte
├── dashboard.html          # Tableau de bord (fonctionnalités inactives grisées)
├── ordonnance.html         # Création d'ordonnance et paramétrage d'impression
├── css/
│   └── style.css           # Styles spécifiques (grisé, impression)
├── js/
│   ├── app.js              # Configuration Supabase
│   ├── auth.js             # Logique d'authentification
│   └── ordonnance.js       # Logique de création, positions dynamiques et sauvegarde
├── supabase_schema.sql     # Script SQL pour initialiser la base Supabase
└── README.md               # Ce fichier
```

## Déploiement

### 1. Configuration Supabase (Plan Gratuit)
1. Créez un projet sur [Supabase](https://supabase.com).
2. Allez dans le **SQL Editor** et exécutez le contenu complet du fichier `supabase_schema.sql`.
3. Allez dans **Project Settings > API** et récupérez :
   - L'URL du projet (`SUPABASE_URL`)
   - La clé publique (`SUPABASE_ANON_KEY`)
4. Dans `js/app.js`, remplacez `VOTRE_SUPABASE_URL` et `VOTRE_SUPABASE_ANON_KEY` par ces valeurs.

### 2. Déploiement sur GitHub Pages
1. Créez un dépôt GitHub et envoyez-y le contenu de ce dossier `ordo_med_lite`.
2. Allez dans les **Settings** de votre dépôt GitHub.
3. Allez dans **Pages**.
4. Dans **Source**, choisissez la branche `main` (ou `master`).
5. GitHub générera un lien public (ex: `https://votre-pseudo.github.io/votre-depot/`).
6. **Important :** Dans Supabase, allez dans **Authentication > URL Configuration** et ajoutez l'URL de votre GitHub Pages dans les *Site URL* et *Redirect URLs*.

## Fonctionnalités incluses
- Authentification complète (Création de compte, Connexion).
- Création d'ordonnances avec médicaments.
- Paramétrage de la position d'impression Y pour la date, le patient, l'APCI et les médicaments.
- Impression directe depuis le navigateur (`window.print()`).
- Mentions "Dans la version Pro après abonnement" sur les tuiles désactivées.
