# Feature Spec: Structure documentaire `docs/` (contenu en anglais)

## Summary
- Créer une arborescence de documentation sous `docs/` à la racine du repo, avec 4 sections : `user-guide/`, `developer-guide/`, `operations/`, `releases/`, plus un `index.md` de sommaire.
- Chaque fichier est rédigé **en anglais**, avec un contenu réel dérivé de la connaissance actuelle de l'application (routes, architecture, déploiement) plutôt que des gabarits vides.
- Les deux fichiers de `releases/` (`v1.3.0.md`, `v1.4.0.md`) sont des notes de version **à valider avec l'utilisateur** : l'historique git disponible (messages `update`) ne permet pas de reconstituer un changelog fiable par version.

## Motivation
- Le projet n'a aujourd'hui aucune documentation structurée : seul `CLAUDE.md` centralise les conventions, à destination de l'agent plutôt que d'un lecteur humain (utilisateur final, nouveau développeur, ops).
- Une arborescence `docs/` standard (guide utilisateur / guide développeur / exploitation / releases) permet de séparer les publics et de préparer une éventuelle publication (site statique, wiki interne).

## Décisions (arbitrées)
- **Langue** : tout le contenu sous `docs/` est en anglais, y compris cette arborescence de fichiers (noms déjà donnés par l'utilisateur).
- **Source de vérité** : le contenu est dérivé de `CLAUDE.md`, de la structure réelle du code (`app/`, `lib/`, `deployment/`) et de l'historique git — pas d'invention de fonctionnalités non présentes dans le code.
- **Emplacement** : `docs/` à la racine du repo (pas sous `_specification/`), aux côtés de l'app Next.js.

## Requirements

### Functional Requirements

#### 1. `docs/index.md`
- Sommaire de la documentation avec liens vers les 4 sections et une description en une ligne de chaque page.
- Courte présentation du projet (dashboard LTM, Next.js 15 / React 19, backend `atom-synchronizer-dev`).

#### 2. `docs/user-guide/`
- `installation.md` — prérequis (Node, accès au backend `atom-synchronizer-dev`), `npm install`, variables d'environnement (`ATOM_API_BASE_URL`).
- `configuration.md` — thème clair/sombre, variable `ATOM_API_BASE_URL`, ports (3001 en dev, 8080 en conteneur).
- `usage.md` — parcours utilisateur par route existante : catalogue (`/`), carte (`/map`), fiche détail (`/labtestmean?id=`), graphe de dépendances (`/interaction`), vue circulaire (`/radar`).

#### 3. `docs/developer-guide/`
- `architecture.md` — les deux axes de theming, séparation server/client components, structure `app/` vs `lib/` vs `components/`, résumé du data flow (`getLabTestMeans()` → adapter → props).
- `local-development.md` — `npm run dev`, particularité `.next/` à purger après suppression de routes, absence de script de lint/test dédié.
- `api.md` — dépendance backend `atom-synchronizer-dev`, endpoint `GET /api/infos/labtestmeans`, OpenAPI à `/v3/api-docs`, gestion d'erreur `AtomApiError`.

#### 4. `docs/operations/`
- `deployment.md` — build `output: "standalone"`, `Dockerfile` multi-stage, chart Helm `deployment/nextjs-hello-chart/`, port 8080, `Jenkinsfile`.
- `monitoring.md` — route `/health` (JSON statique `{ "status": "ok" }`) utilisée par les probes liveness/readiness Helm ; pas d'autre observabilité connue dans le code actuel.

#### 5. `docs/releases/`
- `v1.3.0.md` et `v1.4.0.md` — gabarit de notes de version (sections Added / Changed / Fixed) rempli au mieux ; à confirmer avec l'utilisateur faute de changelog exploitable dans l'historique git (messages `update` uniquement).

### Non-Functional Requirements
- Contenu factuel : ne pas documenter de fonctionnalité absente du code (ex. pas de mock JSON, pas de route `/bench/`, conformément aux invariants de `CLAUDE.md`).
- Formatage Markdown cohérent entre tous les fichiers (mêmes niveaux de titres, pas de HTML brut).

## Scope

### In Scope
- Création des 11 fichiers Markdown listés + dossier `docs/`.
- Contenu réel basé sur l'état actuel du code et de `CLAUDE.md`.

### Out of Scope
- Génération d'un site statique à partir de `docs/` (ex. Docusaurus, MkDocs).
- Documentation exhaustive de l'API backend (hors périmètre : ~42 endpoints d'`atom-synchronizer-dev`, seul l'endpoint consommé par le dashboard est documenté en détail).
- Traduction française de `docs/` (uniquement anglais, comme demandé).

## Affected Areas
- **Créer** : `docs/index.md`, `docs/user-guide/{installation,configuration,usage}.md`, `docs/developer-guide/{architecture,local-development,api}.md`, `docs/operations/{deployment,monitoring}.md`, `docs/releases/{v1.3.0,v1.4.0}.md`.
- **Non touché** : aucun fichier applicatif (`app/`, `components/`, `lib/`).

## Edge Cases
- **Contenu de version incertain** (`v1.3.0.md`, `v1.4.0.md`) : signaler clairement dans le fichier lui-même (ex. note "content to be confirmed") plutôt que d'inventer des entrées de changelog.
- **Fonctionnalités récentes non documentées dans `CLAUDE.md`** (graphe d'interaction, vue radar) : à intégrer dans `usage.md` / `architecture.md` sur la base des specs vibe coding existantes (`onglet-interaction-graphe-dependances-react-flow.md`, `page-radar-vue-circulaire-interfaces.md`).

## Open Questions
- Que doit contenir concrètement `v1.3.0.md` et `v1.4.0.md` ? L'historique git actuel (commits `update`) ne permet pas de reconstituer un changelog fiable par version — faut-il une liste de features connues sans dates précises, ou laisser un gabarit à remplir manuellement ? => part sur 2 versions: la 1.0.0 dont le code est sur la branche main, et la 1.1.0 dont le code est sur la branche amelioration-performance (Analyse déjà faite  précédemmentet dispo sur https://claude.ai/code/artifact/fbc56957-f4bd-4211-8cfd-55b2d484f389?org=b64d4ea7-90df-4548-bbd4-cded0e038c7b)

- `docs/` est-il destiné à être publié (site statique, wiki) ou reste-t-il un artefact interne au repo ? Cela impacte le niveau de finition attendu. => non fichier statique consultable uniquement dans GIT

## Acceptance Criteria
- [ ] L'arborescence `docs/` existe exactement comme spécifiée (11 fichiers + `index.md`).
- [ ] Chaque fichier est rédigé en anglais avec un contenu substantiel dérivé de l'état réel de l'application (pas de placeholder vide).
- [ ] `index.md` lie correctement vers les 10 autres fichiers.
- [ ] Les fichiers de `releases/` signalent explicitement leur caractère provisoire.
- [ ] Aucune fonctionnalité inexistante n'est décrite comme existante.
