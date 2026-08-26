# Feature Spec: Intégration ELK.js pour le layout du graphe de dépendances

## Summary
- Remplacer le placement par **secteurs à angle/rayon fixes** actuellement utilisé dans `components/interaction/DependencyGraph.tsx` (`SECTORS`, `sectorPositions`) par un **layout calculé via `elkjs`** (Eclipse Layout Kernel, port JavaScript).
- Objectif immédiat : éliminer le chevauchement de cartes visible quand un secteur (`SHARE`, `SIB`, etc.) contient beaucoup d'éléments — le placement actuel répartit un nombre variable de nœuds sur un angle fixe, sans jamais vérifier que l'espacement obtenu est supérieur à la hauteur d'une carte.
- Objectif à moyen terme : préparer le graphe à une évolution où il ne sera plus centré sur **un seul** banc (hub unique) mais pourra afficher **plusieurs pôles simultanément** et s'enrichir **progressivement** (ajout d'éléments au fil de l'exploration plutôt qu'un unique calcul figé à la sélection).

## Motivation
- Le layout actuel (`components/interaction/DependencyGraph.tsx:48-73`) fixe un `spreadDeg` et un `radius` par type de relation (`depends-on`, `supports`, `shared-resource`), puis répartit uniformément les nœuds de ce secteur sur cet angle. Rien ne garantit que l'espacement résultant (`radius × spreadDeg / count`) reste supérieur à `NODE_H` (60px) : au-delà d'une dizaine d'éléments dans un même secteur, les cartes se chevauchent (constaté avec des bancs ayant 15+ ressources partagées).
- Une correction locale (rayon/espacement dépendant du nombre d'éléments) ne résout que le symptôme actuel et ne prépare rien pour la suite.
- Le graphe est amené à évoluer vers une structure **multi-pôles** (plusieurs bancs affichés et reliés simultanément, pas uniquement les relations directes d'un seul hub) et à s'enrichir **de façon incrémentale** (ajout de nœuds/arêtes après le rendu initial, pas uniquement un calcul unique au chargement). Un algorithme de layout générique, appelé à chaque évolution du graphe, est mieux adapté à cette trajectoire qu'une géométrie ad hoc écrite à la main.
- Choix déjà arbitré (voir échange précédent) : **elkjs plutôt que dagre**. Dagre est limité à un layout hiérarchique mono-racine (une seule direction, un seul point de départ), ce qui ne convient pas à un graphe à pôles multiples ou à des sous-graphes déconnectés. `elkjs` propose plusieurs algorithmes (`layered`, `force`, `radial`, et surtout `disco`, pensé pour les graphes à composants multiples/déconnectés) et s'exécute de façon asynchrone (Web Worker), ce qui convient à des recalculs répétés sans bloquer l'interface pendant que le graphe s'enrichit.

## Décisions (arbitrées)
- **Librairie** : `elkjs` (nouvelle dépendance npm), pas de remplacement de React Flow — `elkjs` ne fait que calculer des coordonnées `x, y` par nœud ; le rendu, les interactions (survol sans re-rendu React, clic → aperçu photo, légende togglable) restent gérés par React Flow exactement comme aujourd'hui.
- **Répartition des responsabilités** : `elkjs` calcule uniquement le **positionnement des nœuds**. Le tracé des arêtes reste géré par notre composant `RadialEdge` existant (courbe de Bézier vers le point de bordure de chaque carte, `borderPoint()`), plutôt que de déléguer aussi le routage des arêtes à ELK — évite de réécrire tout le rendu des liens pour ce premier pas.
- **Caractère asynchrone assumé** : le calcul ELK est une opération asynchrone (Promise, exécutée dans un Web Worker). Le graphe affiche un état de chargement bref pendant le premier calcul de layout, puis se met à jour à chaque recalcul (nouveau banc sélectionné, ou futur ajout incrémental de nœuds).
- **Portée de cette itération** : le hub-and-spoke actuel (un banc central + ses relations directes) reste la structure fonctionnelle cible ; ELK est intégré comme **moteur de calcul des positions** en remplacement du calcul par secteurs, sans changer le périmètre fonctionnel existant (toujours un seul banc sélectionné, toujours les mêmes 3 types de relation). L'évolution vers un affichage multi-pôles / enrichissement progressif est **anticipée par ce choix technique** mais n'est **pas** livrée dans cette itération (cf. Out of Scope).

## Requirements

### Functional Requirements

#### 1. Remplacement du calcul de position
- Le positionnement des nœuds (banc central + chaque relation) doit provenir d'un calcul ELK plutôt que de la fonction `sectorPositions`/`SECTORS` actuelle.
- Le résultat visuel doit rester lisible pour le cas nominal actuel (quelques relations par type) et corriger le cas de chevauchement (nombreuses relations d'un même type) constaté aujourd'hui.
- Le sens de lecture déjà établi doit être préservé autant que possible : les bancs "dont dépend" le banc central visuellement d'un côté, ceux qui "en dépendent" de l'autre, les ressources partagées distinguées visuellement — même si la disposition exacte (angles, alignement) peut changer du fait du nouvel algorithme.

#### 2. État de chargement du layout
- Pendant le calcul ELK (asynchrone), un état de chargement clair est affiché à la place du graphe (pas de flash de nœuds mal positionnés avant le premier calcul).
- Un nouveau calcul (changement de banc sélectionné) déclenche un nouveau cycle de layout ; le graphe précédent ne doit pas rester figé pendant le recalcul de façon trompeuse.

#### 3. Conservation des comportements existants
- Le survol sans re-rendu React (technique de toggle de classes CSS en DOM direct, cf. `handleNodeMouseEnter`/`clearHover`) doit continuer à fonctionner à l'identique après l'intégration d'ELK — le calcul de layout ne doit être relancé ni au survol, ni au changement de légende (masquage d'un type de relation), uniquement au changement de banc sélectionné (ou, plus tard, à l'ajout de nouveaux nœuds).
- Le clic sur un nœud (aperçu photo), la légende togglable, le style visuel des cartes par type de relation restent inchangés.

### Non-Functional Requirements
- **Compatibilité export statique** : `elkjs` s'exécute via un Web Worker — à vérifier explicitement que ce mécanisme fonctionne sous `output: "export"` (voir Edge Cases / Open Questions), faute de quoi une adaptation (worker inliné, ou exécution sur le thread principal en fallback) sera nécessaire.
- **Pas de régression de performance perceptible** pour le volume actuel (un banc + ses relations directes, quelques dizaines de nœuds au plus) : le calcul ELK doit rester quasi instantané à cette échelle.
- **Aucun changement du modèle de données** (`DependencyRelation`, `LabTestMean.dependsOn/supports/sharedResources`) — seule la couche de layout change.

## Scope

### In Scope
- Ajout de la dépendance `elkjs`.
- Remplacement de `SECTORS`/`sectorPositions`/`polar` par un appel ELK produisant les positions `x, y` des nœuds (banc central + relations directes).
- Gestion de l'aspect asynchrone (état de chargement, annulation/ignorance d'un calcul devenu obsolète si le banc sélectionné change pendant qu'un calcul est en cours).
- Choix et configuration d'un algorithme ELK adapté au cas hub-and-spoke actuel (probablement `layered` ou `radial` — à valider visuellement, cf. Open Questions).
- Vérification de la compatibilité avec l'export statique.

### Out of Scope
- L'affichage multi-pôles (plusieurs bancs sélectionnés/affichés simultanément) — anticipé par ce choix technique mais pas livré ici.
- L'enrichissement incrémental réel du graphe (ajout de nœuds après le rendu initial sans tout recharger) — également anticipé mais pas implémenté dans cette itération.
- Le routage des arêtes par ELK (on garde notre propre tracé en courbe) et l'algorithme `disco` (pertinent seulement quand le multi-pôles sera livré).
- Toute modification du modèle de données ou de l'API backend.
- Migration du layout de la page `/radar` (cercle) — sans rapport avec ce changement, qui ne concerne que `/interaction`.

## Affected Areas
- `components/interaction/DependencyGraph.tsx` — retrait de `SECTORS`, `polar`, `sectorPositions` ; ajout de l'appel ELK (probablement dans un `useEffect`/hook dédié étant donné le caractère asynchrone, à la place de l'actuel `useMemo` synchrone `buildGraph`).
- `package.json` — nouvelle dépendance `elkjs`.
- Composants inchangés mais dont le bon fonctionnement doit être revérifié après le changement : `DependencyLegend.tsx`, `BenchPreviewModal.tsx`, `InteractionEmptyState.tsx` (aucune modification de code attendue, seulement des tests de non-régression).

## Edge Cases
- **Banc avec une seule relation ou aucune** : le calcul ELK doit gérer ces cas triviaux sans erreur (l'état "aucune relation" continue de court-circuiter le rendu du graphe comme aujourd'hui, avant même d'appeler ELK).
- **Changement rapide de banc sélectionné pendant qu'un calcul ELK est en cours** : le résultat d'un calcul obsolète (pour un banc qui n'est plus le banc sélectionné) ne doit pas s'appliquer après coup — nécessite une forme d'annulation ou de vérification de fraîcheur du résultat.
- **Échec du calcul ELK** (erreur du Web Worker, environnement sans support Worker) : prévoir un repli explicite plutôt qu'un écran silencieusement cassé — au minimum un message d'erreur, idéalement un retour au placement par secteurs actuel en dernier recours (à trancher, cf. Open Questions).
- **Export statique / Web Worker** : à vérifier que le bundler (Next.js + Turbopack, `output: "export"`) gère correctement l'inclusion du worker `elkjs` dans le bundle client sans configuration supplémentaire.

## Open Questions
- **Algorithme ELK à utiliser** pour le cas hub-and-spoke actuel : `layered` (proche du rendu actuel, arêtes globalement dirigées) ou `radial` (plus proche visuellement du layout par secteurs existant) ? À trancher par un essai visuel comparatif. => possible de ester les 2 avec un liste de deroulante permettant de choisir l'algo.

- **Stratégie de repli en cas d'échec du calcul ELK** : message d'erreur simple, ou conserver l'ancien calcul par secteurs comme filet de sécurité ? => message erreur simple

- **Annulation des calculs obsolètes** : ELK expose-t-il un mécanisme d'annulation propre, ou faut-il l'implémenter nous-mêmes (ex. comparer un id de requête avant d'appliquer le résultat) ? => on écrit ce garde-fou nous-mêmes

- **Durée du calcul en pratique** sur le volume réel de données (bancs avec le plus grand nombre de relations) : à mesurer avant de valider qu'aucun état de chargement perceptible n'est nécessaire pour le cas nominal. => à voir aprés la premiére version

- **Faut-il garder `SECTORS` dans le code** (mort ou en fallback) le temps de valider ELK en production, ou le supprimer immédiatement ? => supprime le 

## Acceptance Criteria
- [ ] Un banc avec de nombreuses relations d'un même type (ex. 15+ `SHARE`) s'affiche sans chevauchement de cartes.
- [ ] Le rendu visuel pour les cas nominaux actuels (quelques relations par type) reste au moins aussi lisible qu'avant.
- [ ] Un état de chargement s'affiche pendant le calcul initial du layout ; aucun flash de nœuds mal positionnés.
- [ ] Changer de banc sélectionné déclenche un nouveau calcul et affiche le bon résultat, y compris en cas de changements rapides successifs (pas de résultat obsolète affiché).
- [ ] Le survol (mise en évidence sans re-rendu), le clic (aperçu photo) et la légende togglable fonctionnent à l'identique.
- [ ] `npm run build` (export statique) passe sans erreur ; le Web Worker `elkjs` fonctionne correctement dans le build servi statiquement.
- [ ] Aucune régression sur `/`, `/map`, `/labtestmean`, `/radar`, `/health`.
