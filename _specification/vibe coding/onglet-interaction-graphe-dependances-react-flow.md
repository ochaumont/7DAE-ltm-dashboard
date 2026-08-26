# Feature Spec: Onglet "Interaction" — Graphe de dépendances entre bancs (React Flow)

## Summary
- Nouvel onglet **"Interaction"** dans la navigation principale (à côté de `Catalogue` et `Map`), route dédiée (ex. `/interaction`).
- L'utilisateur sélectionne un banc via une **liste déroulante avec recherche** (autocomplete sur le nom/code du LTM).
- Le banc sélectionné s'affiche au centre d'un **graphe 2D interactif** (React Flow) avec ses relations directes, réparties en **3 types** distincts, chacun avec sa propre couleur :
  1. `LTMDependsOn` — bancs dont dépend le banc sélectionné.
  2. `LTMSupports` — bancs qui dépendent du banc sélectionné (relation inverse).
  3. `SharedResourcesDependsOn` — ressources partagées utilisables par le banc sélectionné.
- Première version : un seul niveau de profondeur (relations directes uniquement), pas de navigation récursive dans le graphe.

## Motivation
- Le modèle actuel (`LabTestMean.dependsOn: { id, name }[]`, cf. `lib/types.ts`) ne distingue **ni le sens** de la dépendance (banc dont on dépend vs banc qui dépend de nous) **ni la nature** de la relation (banc vs ressource partagée). Il est donc impossible de restituer visuellement la richesse du modèle métier.
- Le backend expose désormais trois listes typées côté `FactsheetRef` (`LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`), ce qui permet de construire une vraie vue de graphe orientée et catégorisée.
- Un tableau de dépendances en texte brut est difficile à lire dès qu'un banc a plusieurs relations croisées ; une représentation en graphe (nœuds/arêtes) rend le sens et la nature des relations immédiatement lisibles.

## Décisions (arbitrées)
- **Librairie de rendu** : React Flow (`@xyflow/react`) — nouvelle dépendance npm.
- **Layout** : disposition simple centrée — le banc sélectionné au centre, les 3 catégories de relations réparties visuellement autour (ex. colonnes ou secteurs distincts), sans nécessiter d'algorithme de layout complexe (force-directed) dans cette première version.
- **Sélection** : un seul banc actif à la fois (pas de multi-sélection dans cette V1).
- **Portée du graphe** : 1 seul niveau (relations directes du banc sélectionné). Cliquer sur un nœud voisin ne recentre pas le graphe dans cette V1 (cf. Out of Scope).
- **Couleurs par type de relation** (à valider en Open Questions, valeurs indicatives) :
  - `LTMDependsOn` → couleur A (ex. bleu).
  - `LTMSupports` → couleur B (ex. vert).
  - `SharedResourcesDependsOn` → couleur C (ex. orange/violet).
- La couleur s'applique à la fois à l'arête (edge) et à une pastille/bordure du nœud correspondant, pour rester lisible même en cas de daltonisme partiel (accompagné d'un libellé texte, pas uniquement la couleur).

## Requirements

### Functional Requirements

#### 1. Nouvel onglet de navigation
- Ajouter un item **"Interaction"** dans `components/Header.tsx`, au même niveau que `Catalogue` et `Map`.
- Route dédiée (server component + client component selon la convention du projet, ex. `app/interaction/page.tsx` + `InteractionClient`).
- Item actif visuellement surligné quand `pathname` correspond à la route (même pattern que `catalogueActive` / `mapActive`).

#### 2. Sélecteur de banc avec recherche
- Liste déroulante affichant tous les bancs disponibles (nom + code), avec un champ de recherche filtrant la liste en temps réel (typeahead / combobox).
- Tant qu'aucun banc n'est sélectionné, la zone de graphe affiche un état vide explicite (invite à choisir un banc).
- La sélection déclenche le chargement/affichage des relations du banc.

#### 3. Récupération des relations
- Les 3 listes (`LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`) sont récupérées pour le banc sélectionné via l'API backend (`atom-synchronizer-dev`).
- Chaque élément de relation (`FactsheetRef`) doit au minimum exposer un identifiant et un nom affichable pour être représenté comme nœud.

#### 4. Rendu du graphe (React Flow)
- Le banc sélectionné est représenté par un **nœud central** visuellement distinct (style différent des nœuds de relation).
- Chaque relation devient un **nœud** relié au nœud central par une **arête orientée**, colorée selon son type :
  - `LTMDependsOn` : arête du nœud central **vers** le banc dont il dépend (ou sens inverse selon convention — à trancher, cf. Open Questions), couleur dédiée.
  - `LTMSupports` : arête représentant les bancs qui dépendent du banc central, couleur dédiée.
  - `SharedResourcesDependsOn` : arête vers les ressources partagées, couleur dédiée, style de nœud distinct (ressource ≠ banc).
- Une **légende** affiche la correspondance couleur ↔ type de relation.
- Le graphe supporte le zoom/pan standard de React Flow (comportement par défaut de la librairie).

#### 5. Absence de relations
- Si les 3 listes sont vides pour le banc sélectionné, afficher un message explicite ("Aucune dépendance connue pour ce banc") plutôt qu'un graphe vide silencieux.

### Non-Functional Requirements
- **Cohérence de thème** : les couleurs des 3 types de relation doivent être définies comme tokens (cf. `app/globals.css`) et s'adapter aux deux thèmes clair/sombre, en cohérence avec l'axe de theming documenté dans `CLAUDE.md`.
- **Pas de régression** sur les routes existantes (`/`, `/map`, `/labtestmean`, `/health`).
- **Compatibilité export statique** : la nouvelle route doit fonctionner sous `output: "export"` comme les autres pages (pas de segment dynamique non pré-généré).
- **Performance** : le graphe reste fluide pour un nombre de relations raisonnable par banc (dizaines, pas centaines) — pas d'optimisation de layout avancée requise en V1.

## Scope

### In Scope
- Nouvel onglet "Interaction" dans le header et route associée.
- Composant de sélection de banc avec recherche (combobox).
- Intégration de React Flow pour le rendu du graphe à un niveau (banc central + relations directes).
- Distinction visuelle par couleur des 3 types de relation (`LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`) + légende.
- Gestion de l'état vide (aucune sélection, aucune relation).
- Ajout de la dépendance npm `@xyflow/react`.

### Out of Scope
- Navigation récursive dans le graphe (cliquer sur un nœud voisin pour le recentrer / explorer plusieurs niveaux de profondeur) — V2 potentielle.
- Édition des relations depuis le graphe (lecture seule dans cette V1).
- Layout automatique avancé (force-directed, évitement de croisements d'arêtes) — disposition simple pour la V1.
- Export du graphe (image, PDF).
- Filtrage/masquage sélectif d'un type de relation depuis la légende (cliquer pour cacher `LTMSupports` par ex.) — pourrait être une itération rapide mais non retenue en V1 sauf décision contraire.
- Multi-sélection de plusieurs bancs simultanément dans le même graphe.

## Affected Areas
- **Créer** :
  - `app/interaction/page.tsx` (route server component).
  - `components/InteractionClient.tsx` (état, sélection du banc, appel data).
  - `components/interaction/DependencyGraph.tsx` (wrapper React Flow, construction des nœuds/arêtes).
  - `components/interaction/BenchCombobox.tsx` (sélecteur avec recherche) — ou réutilisation d'un composant existant si un combobox générique existe déjà.
- **Modifier** :
  - `components/Header.tsx` — ajout de l'item de navigation "Interaction".
  - `lib/types.ts` — ajouter un type de relation typée (ex. `DependencyRelation` avec `id`, `name`, `type: "depends-on" | "supports" | "shared-resource"`) en remplacement ou complément de l'actuel `dependsOn: { id, name }[]` simpliste.
  - `lib/atom-api.ts` — mapper les 3 nouveaux champs `LTMDependsOn` / `LTMSupports` / `SharedResourcesDependsOn` du DTO backend.
  - `lib/labtestmean-adapter.ts` — adapter ces 3 listes vers le modèle frontend.
  - `app/globals.css` — tokens de couleur pour les 3 types de relation (clair + sombre).
  - `package.json` — ajout de `@xyflow/react`.
- **Non touché** :
  - `/`, `/map`, `/labtestmean`, `/health` — aucune modification fonctionnelle.

## Edge Cases
- **Banc sans aucune relation** : message d'état vide dédié (cf. Requirement 5), pas de crash React Flow sur un graphe à un seul nœud.
- **Relation vers un banc/ressource inconnu(e) côté frontend** (id présent côté relation mais absent du catalogue local) : le nœud doit quand même s'afficher avec le nom fourni par `FactsheetRef`, sans nécessiter de résolution complète du LTM correspondant.
- **Grand nombre de relations** (ex. >20 sur un seul type) : le graphe doit rester lisible — prévoir un espacement suffisant entre nœuds d'un même type plutôt qu'un empilement illisible.
- **Recherche sans résultat** dans le combobox : afficher un message "Aucun banc trouvé" plutôt qu'une liste vide silencieuse.
- **Changement de sélection en cours de chargement** : si l'utilisateur change de banc pendant que les relations du précédent se chargent, la réponse obsolète ne doit pas s'afficher (annulation ou ignorance de la réponse périmée).
- **Doublon de relation** (un même banc apparaissant à la fois dans `LTMDependsOn` et `LTMSupports`, cas théoriquement incohérent mais possible côté données) : afficher les deux arêtes distinctement plutôt que de les fusionner, pour ne pas masquer une incohérence de données.

## Open Questions
- **Sens des arêtes** : `LTMDependsOn` doit-il être dessiné du banc central vers la dépendance (banc central → ce dont il a besoin) ou l'inverse ? Convention à trancher avant implémentation.
=> banc central → ce dont il a besoin
- **Couleurs exactes** des 3 types de relation : à choisir en cohérence avec la palette existante (`--color-accent`, `--color-success`, etc.) ou introduire de nouveaux tokens dédiés au graphe ? nouveaxu token dédié au graphe
- **Position de l'onglet "Interaction"** dans le header : avant ou après "Map" ? aprés.
- **Contenu des nœuds "ressource partagée"** : ont-ils un type/icône propre distinct des bancs (LTM), ou un style neutre suffit pour la V1 ? => neutre pour V1
- **Clic sur un nœud voisin** : totalement inerte en V1, ou doit-il au minimum ouvrir la fiche détail du banc correspondant (`/labtestmean?id=...`) sans recentrer le graphe ? => inerte en VA

## Acceptance Criteria
- [ ] Un onglet "Interaction" est visible dans la navigation principale et mène à une route dédiée.
- [ ] Un sélecteur avec recherche permet de choisir un banc parmi tous les LTM disponibles.
- [ ] Après sélection, un graphe React Flow s'affiche avec le banc au centre et ses relations directes en nœuds périphériques.
- [ ] Les arêtes/nœuds de type `LTMDependsOn`, `LTMSupports` et `SharedResourcesDependsOn` sont visuellement différenciés par une couleur propre à chaque type.
- [ ] Une légende explicite la correspondance couleur ↔ type de relation.
- [ ] Un banc sans relation affiche un message d'état vide clair, sans erreur ni graphe cassé.
- [ ] Le graphe reste utilisable (zoom/pan) sans bug visuel avec un nombre de relations raisonnable.
- [ ] Le rendu s'adapte correctement aux thèmes clair et sombre.
- [ ] `npm run build` passe sans erreur, aucune régression sur `/`, `/map`, `/labtestmean`, `/health`.
