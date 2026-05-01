# Front-end code review — ltm-dashboard

> Date: 2026-05-01
> Scope: app/, components/, components/icons/, lib/, styles/, root config
> Files analyzed: 35 (≈ 2200 LOC TS/TSX)

## 0. Executive summary

Le code est **propre, compact et bien structuré pour un V1**. La séparation server/client est correcte, les types stricts sont actifs, le pattern adapter (DTO → domaine) est en place, et les conventions de routing / theming sont saines. La grosse majorité des composants tiennent en moins de 100 lignes et restent lisibles.

Les trois zones à corriger en priorité sont, dans cet ordre : (1) la **cassure du flux de données** sur la fiche détail — `getLabTestMean(id)` rappelle toute la liste à chaque rendu, ce qui ne scalera pas et provoque ~313 fetchs au build SSG ; (2) la **mitigation SSRF inexistante** sur `app/api/photo/[id]/route.ts`, acceptable en dev mais bloquante avant val/prod ; (3) l'**absence totale de tests** sur une app destinée au prod (aucun test runner configuré).

Aucun problème critique de sécurité côté navigateur, aucun anti-pattern React majeur, et la dette technique reste maîtrisée — mais elle s'accumule discrètement (fichiers temporaires `temp/`, `public/panorama.jpg` orphelin, contrat d'erreur fragile via string-match `"unreachable"`, helpers de page non-extraits).

## 1. Findings by category

### 1.A Architecture & code organization

- **[low] 23 composants à plat dans `components/`** — un seul sous-dossier `icons/`. Manageable aujourd'hui, inconfortable à 40+.
  - Example: `components/{LabTestMeanCard,LabTestMeanHeader,ChipAccessControl,ChipComplexity,ChipType,…}.tsx`
  - Recommandation : sous-grouper par domaine quand le prochain lot arrive (`components/catalog/`, `components/labtestmean/`, `components/map/`, `components/layout/`, `components/ui/`).

- **[low] `LabTestMeanCard` forcé en client component** uniquement pour un `onError`.
  - Example: `components/LabTestMeanCard.tsx:1` — `"use client"` ajouté lors de l'intégration `onError` placeholder.
  - Recommandation : extraire un mini `<CoverImg>` client component qui porte le `onError`, garder la card en server component. Gain marginal en bundle client mais cohérent avec le reste.

- **[low] Helpers de page inline dans `app/labtestmean/[id]/page.tsx`**.
  - Example: `Section`, `YesNo`, `LifecycleTimeline` (lignes ~20-95) sont des composants présentationnels noyés dans un fichier de routing.
  - Recommandation : déplacer vers `components/labtestmean/Section.tsx`, `YesNo.tsx`, `LifecycleTimeline.tsx` quand on touchera à nouveau la fiche.

### 1.B Separation of concerns

- **[medium] `CatalogueClient.tsx` mélange état UI, sync URL et logique de pagination**.
  - Example: `components/CatalogueClient.tsx:55-93` — `useMemo` filtres, `parsePage`, `setPageInUrl`, effet de redirection si page hors plage, callback de filtres reset à 1, le tout dans un seul composant.
  - Recommandation : extraire un hook `usePageQuery({ totalPages })` qui retourne `{ page, setPage }` synchronisé sur `?page=`. Le composant ne garde que le rendu.

- **[low] L'erreur API utilise un contrat fragile par string-match**.
  - Example: `app/error.tsx:16` — `error.message.includes("unreachable")` matche le message produit par `lib/atom-api.ts:78`. Si le message change, l'écran "ATOM API unavailable" disparaît silencieusement.
  - Recommandation : exposer l'`AtomApiError` côté `error.tsx` via `error.digest` enrichi (Next limite ce qui passe), ou plus simplement matcher un code dédié genre `error.message.startsWith("ATOM_UNREACHABLE")` avec un préfixe machine plutôt qu'humain.

### 1.C Component decomposition

- **[medium] Page détail `app/labtestmean/[id]/page.tsx` est un mini-monolithe (~200 lignes)** avec 4 sections (Security, Lifecycle, Description, Programs · Projects) inline.
  - Example: `app/labtestmean/[id]/page.tsx:120-200`
  - Recommandation : éclater en `<SecuritySection>`, `<LifecycleSection>`, `<ProgramsSection>` — la page devient un orchestrateur de 5 composants, plus lisible et plus facile à modifier individuellement.

- **[low] Pas de violation flagrante** ailleurs — la majorité des composants font une chose.

### 1.D Feature-based vs technical organization

- **[low] Organisation 100% technique** (`app/`, `components/`, `lib/`) typique Next.js. Rien de mal aujourd'hui.
  - Recommandation : à l'apparition d'un 2ᵉ domaine métier (par ex. "applications", "incidents", "kpis"), basculer vers un découpage `features/<domain>/{components,lib,hooks}` ; conserver `components/ui/` pour les primitives partagées (Avatar, Pagination, Badge, Chip*, Section).

### 1.E Code quality

- **[medium] Duplication du `onError` placeholder fallback** dans 4 sites.
  - Example: `components/LabTestMeanCard.tsx:24-28`, `components/MapView.tsx:73-77`, `components/Gallery.tsx:23-27`, `components/Gallery.tsx:53-57`.
  - Recommandation : extraire un helper exporté depuis `lib/photo.ts` :
    ```
    export function placeholderOnError(e: SyntheticEvent<HTMLImageElement>) {
      const t = e.currentTarget;
      if (!t.src.endsWith("/covers/cover-1.svg")) t.src = "/covers/cover-1.svg";
    }
    ```
    et brancher `onError={placeholderOnError}` partout.

- **[low] `Manager.title` toujours mis à `"Bench Manager"`** par l'adapter mais désormais inutilisé.
  - Example: `lib/labtestmean-adapter.ts:91-93` produit `title: "Bench Manager"` que `ManagerCard` n'affiche pas (il prend `roleLabel` en prop).
  - Recommandation : retirer `title` de `Manager` (`lib/types.ts`) et de l'adapter. Code mort.

- **[low] Dossier `temp/` à la racine** contient des PNG (`Access Control.png`, `No Access Control.png`, `simple/medium/complex.png`) remplacés par des SVG inline.
  - Example: `temp/*.png`
  - Recommandation : supprimer le dossier — il n'est référencé nulle part dans le code.

- **[low] Asset orphelin `public/panorama.jpg`**.
  - Example: `public/panorama.jpg` — leftover d'une PoC ; aucun composant ne le charge.
  - Recommandation : supprimer.

- **[low] `next.config.mjs` whitelist `picsum.photos`** plus aucun usage.
  - Example: `next.config.mjs:5-7`
  - Recommandation : retirer la whitelist (`remotePatterns: []` ou supprimer le bloc `images`).

### 1.F Comments and documentation

- **[medium] Quasi-zéro commentaire dans le code**, alors que CLAUDE.md précise une orientation "beginner-friendly".
  - Example: `lib/labtestmean-adapter.ts` — l'adapter contient toute la logique métier non triviale (statut dérivé, pictogramme `kind`, `is360`, mapping pays/site/géo, fallback cover) sans aucun commentaire explicatif.
  - Recommandation : ajouter de brefs JSDoc sur :
    - `Photo`, `LabTestMean`, `Security` types (1 ligne par champ non évident).
    - `toLabTestMean` (un commentaire en tête expliquant les règles de dérivation status).
    - `isSelected` / `is3D` (la convention backend).
    - `useTheme` (pourquoi `useSyncExternalStore` + `MutationObserver`).
    - `app/api/photo/[id]/route.ts` (rôle de proxy, pourquoi POST avec body JSON).

- **[low] CLAUDE.md** est bien tenu et constitue déjà une doc d'onboarding correcte.

### 1.G Performance

- **[critical] `getLabTestMean(id)` re-fetch toute la liste pour trouver UN LTM**.
  - Example: `lib/labtestmeans.ts:15-20` — `getLabTestMean` appelle `getLabTestMeans()` puis `.find()`. À chaque rendu de fiche : ~600 KB JSON transférés, ~300 LTM re-mappés. Au `npm run build`, c'est 313 fetchs sur l'API ATOM (un par page SSG).
  - Recommandation : 
    1. Wrapper `getLabTestMeans` dans `cache()` de `import { cache } from "react"` pour dédupliquer entre composants serveur d'un même request tree.
    2. À terme, ajouter un endpoint backend `/api/infos/labtestmeans/{id}` pour les fiches.

- **[medium] `force-dynamic` + `next: { revalidate: 60 }` se contredisent**.
  - Example: `app/page.tsx:1`, `app/map/page.tsx:1`, `app/labtestmean/[id]/page.tsx:1` déclarent `dynamic = "force-dynamic"` ; `lib/atom-api.ts:73` passe `next: { revalidate: 60 }`. Sous force-dynamic, le revalidate n'a aucun effet, chaque requête refait l'appel.
  - Recommandation : trancher. Soit retirer `force-dynamic` et accepter la SSG (avec ISR via revalidate=60) — l'app deviendrait beaucoup plus rapide. Soit retirer `revalidate: 60` (dead code).

- **[low] Aucun cluster sur la map** (313 markers OK aujourd'hui, mais à 1000+ ça deviendra dense).
  - Example: `components/MapView.tsx:38-54`
  - Recommandation : `react-map-gl` supporte le clustering via `Source`/`Layer` GeoJSON. À ajouter quand la volumétrie augmentera.

- **[low] `framer-motion`** chargé pour un seul composant (`FilterSheet`).
  - Example: `components/FilterSheet.tsx:4`
  - Recommandation : acceptable. Si le bundle initial devient critique, remplacer par CSS transitions natives (slide-up + opacity).

### 1.H UI / UX

- **[medium] Aucun état "vide" sur la map**.
  - Example: `components/MapClient.tsx` — quand les filtres ramènent 0 LTM, la map affiche les markers à 0 mais aucun message UX.
  - Recommandation : afficher un overlay centré "No lab test means match these filters" comme sur la grille catalogue.

- **[medium] Pas de skeleton / placeholder pendant le chargement initial des fiches**.
  - Example: `app/labtestmean/[id]/page.tsx` — la page est `force-dynamic` ; pendant l'attente API (~9s à froid d'après la spec), le navigateur reste sur la page précédente.
  - Recommandation : ajouter un `loading.tsx` au niveau de `app/labtestmean/[id]/` avec un skeleton de fiche (gallery placeholder + en-tête grisé).

- **[low] Couleur des contrôles natifs du viewer panorama** ne suit pas le thème.
  - Example: `components/PanoramaViewer.tsx` — la lib utilise sa propre palette interne pour la barre `zoom/move/fullscreen`, blanc cassé sur fond noir, peu lisible en mode clair.
  - Recommandation : la lib expose des CSS variables (`--psv-buttons-color`, etc.) — overrider via `app/globals.css` quand on touchera au theming.

- **[low] Pas de focus visible standardisé** sur l'ensemble des boutons.
  - Example: `ThemeToggle` a un `focus-visible:ring-2`. La majorité des autres boutons (pagination, chips toggle, manager card link) n'ont pas de style focus explicite — tombent sur le focus natif du navigateur.
  - Recommandation : convention `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent` à propager sur les éléments interactifs.

### 1.I Security

- **[critical] SSRF non mitigé sur `/api/photo/[id]`**.
  - Example: `app/api/photo/[id]/route.ts:31` — la seule validation du paramètre `u` est `^https?://`. Un attaquant peut faire `GET /api/photo/<n'importe-quel-uuid>?u=http://internal-service.airbus.local/admin` et utiliser le proxy comme jump host.
  - Recommandation : restreindre le hostname à celui de `ATOM_API_BASE_URL` :
    ```
    const allowed = new URL(ATOM_API_BASE_URL).host;
    if (new URL(u).host !== allowed) return badRequest("host not allowed");
    ```
    À faire impérativement avant val/prod. Acceptable en dev local strict.

- **[low] Le `?u=` exposé côté client** révèle l'URL backend (LeanIX).
  - Example: dev tools montrent `/api/photo/<id>?u=https%3A%2F%2Feu-6.leanix.net%2F...`.
  - Recommandation : remplacer par un mapping serveur `id → url` (cache mémoire alimenté à chaque appel labtestmeans) ; client ne passe plus que `id`. Hors scope V1, à reprendre quand l'auth backend arrivera.

- **[low] `dangerouslySetInnerHTML` pour le script anti-FOUC**.
  - Example: `app/layout.tsx:19-20`
  - Recommandation : OK — le contenu est un template literal statique, pas user-controlled. Aucun risque XSS, juste flagger pour audit.

### 1.J Data handling & API integration

- **[medium] `JSON.parse` non typé / non validé**.
  - Example: `lib/atom-api.ts:83` — `(await res.json()) as LabTestMeanDto[]` est un cast TypeScript pur, sans validation runtime. Un changement backend silencieux passe inaperçu jusqu'à un crash UI tardif (vu sur `accesscontrol` qui pouvait arriver en string `"false"`).
  - Recommandation : ajouter une validation Zod légère sur les champs **critiques** uniquement (id, externalId, name, category, status fields) — pas la peine de valider tous les rôles. ~30 lignes pour couvrir le squelette.

- **[medium] Pas de retry, pas de timeout sur le fetch**.
  - Example: `lib/atom-api.ts:72` — un `fetch` simple avec `revalidate`. Si l'API ATOM tousse 1s, la fiche entière échoue.
  - Recommandation : wrapper `fetch` avec `AbortController` + timeout (10s par exemple). Pas de retry V1 (Next ISR/cache compense en partie).

- **[low] Le proxy `/api/photo/[id]` ne forward pas les codes HTTP backend**.
  - Example: `app/api/photo/[id]/route.ts:54-65` — toute erreur upstream (4xx, 5xx, network) → 404 unique.
  - Recommandation : c'est volontaire pour simplifier le `onError` côté client. Acceptable.

### 1.K Tooling & dependencies

- **[critical] Aucun test, aucune CI**.
  - Example: pas de `__tests__`, pas de `vitest`/`jest`/`playwright` dans `package.json`.
  - Recommandation : à minima 4 tests Playwright smoke (catalogue charge, fiche charge, map charge, theme toggle). Une heure de setup, gain énorme en CI.

- **[medium] Pas d'ESLint, pas de Prettier**.
  - Example: `package.json` n'a ni `eslint` ni `prettier` ni script `lint`.
  - Recommandation : `eslint-config-next` + `prettier` configurés en standalone (pas de pre-commit hook obligatoire en V1, juste le script `npm run lint` pour la CI).

- **[medium] `npm audit` rapporte 2 vulnérabilités modérées** (vu lors du dernier `npm install`).
  - Example: `npm install` log : `2 moderate severity vulnerabilities`.
  - Recommandation : `npm audit` pour identifier ; probablement transitives via `react-photo-sphere-viewer`/`three`. Documenter ou patcher.

- **[low] Pas de fichier `.nvmrc` ou `engines` dans package.json**.
  - Example: `package.json` ne fixe pas la version Node. Le Dockerfile utilise `node:20-alpine` ; le Jenkinsfile demande `nodejs-20.9.0`. Dérive possible.
  - Recommandation : `"engines": { "node": ">=20.9.0" }` dans package.json + `.nvmrc` pour les devs locaux.

### 1.L State and data flow organization

- **[medium] État de filtres dupliqué entre `CatalogueClient` et `MapClient`**.
  - Example: les deux composants instancient le même `useState<FilterValue>` initial. Si un user filtre sur `/`, navigue sur `/map`, ses filtres sont perdus.
  - Recommandation : si ce comportement gêne en pratique, externaliser via URL (`?type=SIB&country=France`) — à terme c'est aussi sharable. Pas de state library nécessaire.

- **[low] La pagination URL-syncée** (`?page=N`) est bien faite.
  - Example: `components/CatalogueClient.tsx:67-78`
  - Recommandation : OK.

### 1.M Scalability & maintainability

- **[medium] Aucun garde-fou TypeScript runtime**. Avec un backend en mouvement (renommage `testMeanType` → `category`, types qui glissent vers string, etc.), la lib `as` devient un pari permanent.
  - Recommandation : voir 1.J — Zod sur le squelette.

- **[medium] Code mort qui s'accumule** (Manager.title, picsum whitelist, panorama.jpg, temp/).
  - Recommandation : passe de nettoyage trimestrielle, ou à chaque fin de feature.

- **[low] La structure `lib/` est saine** : DTO/fetch (atom-api), domaine (types), adapter, accès+filters (labtestmeans), hook (useTheme). Limpide, scale jusqu'à 5-10 entités sans pression.

## 2. Prioritized recommendations

### Critical (3 findings)
- **getLabTestMean(id) re-fetch toute la liste** — wrap `getLabTestMeans` dans `cache()` de React + viser un endpoint backend dédié à terme.
- **SSRF non mitigé sur `/api/photo/[id]`** — host-match sur `ATOM_API_BASE_URL` avant tout déploiement non-dev.
- **Aucun test, aucune CI** — bootstrap Playwright smoke (4 tests, ~1h de setup).

### Medium (10 findings)
- Réécrire `CatalogueClient` avec un hook `usePageQuery`.
- Décomposer `app/labtestmean/[id]/page.tsx` en sections (`SecuritySection`, etc.).
- DRY le `onError` placeholder (helper `placeholderOnError` dans `lib/photo.ts`).
- Ajouter JSDoc sur les types domaine, l'adapter, les conventions `isSelected`/`is3D`, `useTheme`.
- Trancher `force-dynamic` vs `revalidate: 60` (dead code).
- Empty state sur `/map` quand 0 résultat filtré.
- Skeleton `loading.tsx` sur la fiche détail (cold ATOM = 9s).
- Validation Zod sur les champs critiques de `LabTestMeanDto`.
- Timeout `AbortController` sur le fetch.
- Configurer ESLint + Prettier + résoudre les 2 vulns npm audit.

### Low (12 findings)
- Sous-grouper `components/` par domaine quand on dépasse ~30 fichiers.
- `LabTestMeanCard` revenir en server component via sous-composant client.
- Supprimer `Manager.title`, `temp/`, `public/panorama.jpg`, whitelist `picsum.photos`.
- Contrat d'erreur API par préfixe machine plutôt que string-match `"unreachable"`.
- CSS variables du panorama viewer adaptées au thème.
- Convention `focus-visible:ring-2` propagée sur tous les interactifs.
- Cluster MapLibre quand la volumétrie augmentera.
- `framer-motion` à remplacer par CSS si le bundle devient critique.
- Mapping serveur `id→url` pour ne plus exposer la backend URL au client.
- Filtres URL-syncés pour persister entre `/` et `/map`.
- `engines.node` + `.nvmrc` pour fixer la version Node.
- Réviser le proxy `/api/photo/[id]` qui mappe toute erreur upstream sur 404.

## 3. Proposed target structure (if applicable)

À l'horizon ~50 composants ou ~2ᵉ domaine métier. Pas urgent aujourd'hui (~23 composants, 1 domaine).

```
app/
  (catalog)/
    page.tsx                  # /
  labtestmean/[id]/
    page.tsx
    loading.tsx               # nouveau, skeleton
    error.tsx
  map/
    page.tsx
    layout.tsx
  api/photo/[id]/route.ts
  health/route.ts
  layout.tsx
  globals.css

features/
  catalog/
    CatalogueClient.tsx
    LabTestMeanCard.tsx
    Pagination.tsx
    usePageQuery.ts           # extracté
  labtestmean/
    LabTestMeanHeader.tsx
    SecuritySection.tsx
    LifecycleSection.tsx
    ProgramsSection.tsx
    LifecycleTimeline.tsx
    YesNo.tsx
    Section.tsx
    Gallery.tsx
    PanoramaClient.tsx
    PanoramaViewer.tsx
  map/
    MapClient.tsx
    MapView.tsx
  filters/
    FilterBar.tsx
    FilterSheet.tsx

components/ui/                # primitives partagées
  Avatar.tsx
  ChipType.tsx
  ChipComplexity.tsx
  ChipAccessControl.tsx
  BadgeStatus.tsx
  ManagerCard.tsx
  ThemeToggle.tsx
  Header.tsx
  icons/
    *.tsx

lib/
  atom-api.ts
  labtestmean-adapter.ts
  labtestmeans.ts             # avec cache() de React
  types.ts
  useTheme.ts
  photo.ts                    # placeholderOnError, validators
```

Rationale : **`features/<domain>/`** regroupe les pages, composants, hooks et logique propres à un domaine métier — les modifs futures sur le catalogue se font dans un seul dossier. **`components/ui/`** garde les primitives réellement transverses (Avatar, Badge, Chip*, ManagerCard).

## 4. Final summary

**Cette semaine** : (1) wrapper `getLabTestMeans` dans `cache()` (~5 lignes), (2) durcir le proxy photo avec un host-match (~5 lignes), (3) trancher `force-dynamic` vs `revalidate` (1 décision).

**Dans le mois** : bootstrap Playwright + ESLint + skeleton de fiche + Zod sur le squelette DTO + JSDoc sur l'adapter et les conventions backend (`SELECTED`, `3D`, valeurs booléennes laxistes). Ces 5 actions stabilisent l'app pour val/prod.

**Plus tard** : refactor en `features/<domain>/` quand un 2ᵉ domaine arrive ou quand `components/` dépasse 40 fichiers. Cluster map. Filtres URL. Endpoint backend par-id.

L'app est en bon état pour son âge. Les corrections proposées sont incrémentales, pas un gros refactor — 1-2 jours de travail au total pour les findings critiques + medium.
