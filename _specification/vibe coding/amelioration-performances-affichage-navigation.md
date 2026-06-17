# Feature Spec: Amélioration des Performances d'Affichage et de Navigation

## Summary
- Mettre en cache côté client la liste des lab test means et l'arbre avion, chargés **une seule fois par session** au lieu d'être re-téléchargés à chaque navigation.
- Supprimer le téléchargement des 317 items sur la page de détail (qui n'en affiche qu'un).
- Mémoïser les calculs dérivés (compteurs programmes, listes de valeurs uniques de filtres) recalculés inutilement à chaque render.
- Mettre en cache les photos de couverture pour éviter de les re-télécharger à chaque pagination / retour catalogue.
- Quelques gains secondaires (prefetch des liens de navigation, attributs image).
- Objectif : navigation catalogue ↔ carte ↔ détail quasi instantanée après le premier chargement, sans changer le comportement fonctionnel ni la fraîcheur perçue des données.

## Motivation
Depuis le passage en **client-side data fetching** (SPA statique), le cache `React.cache()` a été retiré. Conséquence : **chaque page refait tous les appels réseau** et ré-adapte 317 objets à chaque fois.

- `useLabTestMeans` (`lib/useLabTestMeans.ts:46`) appelle `getLabTestMeans()` + `getAircraftTree()` à chaque montage (catalogue **et** carte).
- La page de détail (`components/LabTestMeanDetailClient.tsx:39-42`) **re-télécharge la liste complète des 317** uniquement pour trouver un élément par `id`, alors qu'un endpoint unitaire existe déjà (`fetchLabTestMean(externalId)`, `lib/atom-api.ts:154`, non utilisé).
- Naviguer catalogue → détail → retour → carte rejoue l'intégralité des fetchs à chaque étape → latence et clignotement de squelettes.
- `useLabTestMeans` recalcule `computeProgramCounts`, `uniqueTypes/Statuses/Countries/Complexities/Portfolios` **à chaque render** (`lib/useLabTestMeans.ts:67-73`, hors `useMemo`) ; or le catalogue re-rend à chaque frappe de filtre → balayages répétés des 317 items.
- `usePhoto` (`lib/usePhoto.ts:20`) fait un **POST `/api/infos/resource` par image, sans cache**, et révoque le blob au démontage : les 6 vignettes sont re-téléchargées à chaque changement de page ou retour catalogue.

À l'inverse, les grosses dépendances (`three`, `@photo-sphere-viewer`, `react-photo-sphere-viewer`) sont déjà en **chunk lazy** (chargées uniquement pour une photo 360° via `PanoramaClient`) et ne sont donc **pas** un problème de bundle.

## Requirements

### Functional Requirements

#### 1. Cache client partagé des données (levier prioritaire)
- La liste des lab test means et l'arbre avion doivent être chargés **une fois par session** et réutilisés par toutes les pages (catalogue, carte, détail).
- Les pages suivantes ne doivent **pas** redéclencher d'appel réseau si la donnée est déjà en cache.
- Stratégie de fraîcheur à retenir (cf. Open Questions) : soit **TTL court** (revalidation après N secondes), soit **chargement unique + rafraîchissement manuel**. Le but est de conserver des données « fraîches » sans re-fetch à chaque clic.
- Les états **loading / error / success** existants doivent être préservés (premier chargement + cas backend indisponible via `app/error.tsx`).

#### 2. Page de détail sans téléchargement de toute la liste
- La page de détail ne doit plus dépendre de `getLabTestMeans()` pour afficher un seul élément.
- Deux approches acceptables : lire l'élément depuis le **cache partagé** (levier 1) si présent, ou appeler l'**endpoint unitaire** `fetchLabTestMean(externalId)`.
- Le besoin secondaire de la page (résolution des LTM liés « depends on » via une map `id → externalId`) doit rester fonctionnel — idéalement servi par le cache partagé plutôt que par un re-téléchargement.
- Résultat attendu : navigation vers une fiche **sans requête réseau** quand la liste est déjà chargée.

#### 3. Mémoïsation des calculs dérivés
- Dans `useLabTestMeans`, envelopper les valeurs dérivées (`programCounts`, `hasUnassignedPrograms`, `types`, `statuses`, `countries`, `complexities`, `portfolios`) dans des `useMemo` dépendant de `labTestMeans` / `tree`.
- Aucune valeur calculée ne doit changer ; seul le **moment** du calcul change (plus de recalcul à chaque render).

#### 4. Cache des photos de couverture
- `usePhoto` doit réutiliser une image déjà récupérée (cache indexé par identifiant de ressource) au lieu de re-POSTer à chaque montage.
- Éviter la révocation prématurée d'un blob encore utilisé ailleurs ; la stratégie de cache doit gérer proprement la durée de vie des URLs (pas de fuite mémoire, pas d'image cassée).
- Résultat attendu : pagination et retour catalogue **sans re-télécharger** les vignettes déjà vues.

#### 5. Gains secondaires (faible effort)
- Réactiver le **prefetch** sur les liens de **navigation** du Header (Catalogue / Map), tout en conservant `prefetch={false}` sur les liens de **détail** (qui pointent tous vers la même page statique).
- Ajouter `decoding="async"` et des dimensions/ratio explicites sur les images de carte pour éviter tout layout shift.

### Non-Functional Requirements
- **Aucune régression fonctionnelle** : filtres, pagination, export PDF, carte, détail, thème clair/sombre inchangés.
- Compatible avec `output: "export"` (SPA statique nginx) — pas de code serveur à l'exécution.
- Respect de la gestion d'auth existante (Bearer dev-only / injection gateway en prod) sur tous les appels, y compris ceux issus du cache photos.

## Scope

### In Scope
- Introduction d'un mécanisme de cache client (librairie type SWR/React Query, Context provider, ou mémoïsation module — cf. Open Questions).
- Refonte du chargement de données du catalogue, de la carte et de la fiche détail pour passer par ce cache.
- Mémoïsation des dérivés dans `useLabTestMeans`.
- Cache des ressources photo.
- Ajustements mineurs de prefetch et d'attributs image.

### Out of Scope
- Changement du modèle de déploiement (reste SPA statique nginx).
- Pagination ou filtrage **côté serveur** (la volumétrie de ~317 items ne le justifie pas).
- Suppression/remplacement des dépendances lourdes (déjà en lazy-load).
- Tout changement visuel ou de tokens de thème.
- Mise en cache HTTP côté nginx/gateway (sujet distinct).

## Affected Areas
- `lib/useLabTestMeans.ts` : source des données partagées + mémoïsation des dérivés.
- `lib/labtestmeans.ts` / `lib/aircraftStructure.ts` : point d'entrée du cache des données (selon l'approche retenue).
- `components/LabTestMeanDetailClient.tsx` : lecture depuis le cache ou endpoint unitaire au lieu de `getLabTestMeans()`.
- `components/CatalogueClient.tsx` et `components/MapClient.tsx` : consommation du cache partagé.
- `lib/usePhoto.ts` : cache des ressources photo.
- `components/Header.tsx` : prefetch des liens de navigation.
- `components/LabTestMeanCard.tsx` : attributs image (mineur).
- Éventuellement `app/layout.tsx` : si un Context provider de données est introduit au niveau racine.
- `package.json` : ajout éventuel de SWR / React Query (si approche librairie retenue).

## Edge Cases
- **Backend indisponible** : le premier chargement doit toujours afficher l'écran « ATOM API unavailable » (`app/error.tsx`) ; le cache ne doit pas masquer une erreur réelle.
- **`id` inconnu sur la fiche détail** : conserver le comportement `notFound()`.
- **Donnée mise à jour côté backend** : selon la stratégie de fraîcheur, s'assurer qu'un rechargement (ou la revalidation TTL) reflète bien les ajouts/suppressions de LTM.
- **Photos** : un blob mis en cache ne doit pas être révoqué tant qu'un composant l'affiche ; pas de fuite mémoire à la longue.
- **Cohérence map `id → externalId`** sur la fiche détail après suppression du re-téléchargement complet.
- Vérifier qu'aucun cache `.next/` ne masque une erreur : supprimer `.next/` et relancer `npm run build` en fin d'implémentation.

## Open Questions
- **Stratégie de cache** : SWR/React Query (standard, revalidation + dédoublonnage intégrés), Context provider maison, ou simple mémoïsation au niveau module ? (Recommandation : SWR.)
- **Fraîcheur des données** : TTL de revalidation (quelle durée ?) ou chargement unique par session + bouton/refresh manuel ?
- **Fiche détail** : privilégier l'endpoint unitaire `fetchLabTestMean` (moins de données transférées en accès direct par URL) ou toujours s'appuyer sur la liste en cache (navigation instantanée depuis le catalogue) ?
- **Cache photos** : durée de vie souhaitée (session entière ? limite de taille ?) et faut-il un cache `data:`/`blob:` partagé entre catalogue et fiche détail ?

## Acceptance Criteria
- [ ] Naviguer catalogue → détail → retour catalogue → carte ne déclenche **aucun** nouvel appel `GET /api/infos/labtestmeans` ni `.../aircraftStructures/tree` après le premier chargement (vérifiable dans l'onglet Network).
- [ ] La page de détail ne télécharge plus la liste complète des 317 pour afficher un seul élément.
- [ ] Les calculs dérivés de `useLabTestMeans` ne sont plus recalculés à chaque frappe dans les filtres (mémoïsés).
- [ ] La pagination et le retour au catalogue ne re-téléchargent pas les vignettes déjà affichées.
- [ ] Les liens de navigation du Header sont préchargés ; les liens de détail restent `prefetch={false}`.
- [ ] Aucune régression : filtres, pagination, export PDF, carte, fiche détail, thème, écran d'erreur backend fonctionnent comme avant.
- [ ] `npm run build` passe sans erreur et l'application reste un export statique servable par nginx.
