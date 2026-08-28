# Feature Spec: Extension du menu contextuel du diagramme d'interaction

## Summary
- Le menu contextuel affiché sur un clic droit d'un **banc normal** dans `/interaction` gagne une nouvelle action **"Show shared resources"**, qui affiche les ressources partagées associées à ce banc (au même titre que "Show depends on" et "Show supports" existent déjà pour les relations `depends-on`/`supports`).
- Chaque action d'expansion du menu (Show depends on / Show supports / Show shared resources) affiche désormais, à côté de son libellé, le **nombre d'éléments au bout de cette relation qui ne sont pas encore affichés** dans le diagramme.
- Sur un nœud représentant une **ressource partagée** elle-même (type de banc "SHARE"), le menu contextuel devient **différent** de celui d'un banc normal : il ne propose que deux actions —
  - **"Usable by"** : affiche les bancs qui utilisent cette ressource partagée (relation inverse de `SharedResourcesDependsOn` — les bancs qui référencent cette ressource dans leurs propres ressources partagées).
  - **"Hide"** : masque le nœud (comportement déjà existant, inchangé).
- Le compteur d'éléments non affichés s'applique aussi à "Usable by".

## Motivation
- Le diagramme permet déjà d'explorer transitivement les relations `depends-on`/`supports` d'un banc via clic droit, mais pas ses ressources partagées — il faut aujourd'hui les découvrir autrement (fiche du banc) alors qu'elles font pleinement partie du graphe de dépendances affiché.
- Une fois une ressource partagée elle-même affichée comme nœud, il n'existe aujourd'hui aucun moyen de découvrir quels AUTRES bancs l'utilisent également — l'action "Usable by" comble ce manque, complétant la lecture du graphe dans les deux sens.
- Afficher le nombre d'éléments encore masqués derrière chaque action aide l'utilisateur à anticiper l'ampleur de l'expansion avant de cliquer (par exemple, distinguer une action qui ajoutera 1 élément d'une qui en ajoutera 15), et à voir immédiatement quand une relation est déjà entièrement affichée (compteur à 0).

## Décisions (arbitrées)
- Le menu contextuel a donc désormais **deux variantes** selon le type de nœud cliqué :
  - **Banc normal** : Show depends on / Show supports / Show shared resources / Hide (4 actions).
  - **Ressource partagée** (banc de type "SHARE") : Usable by / Hide (2 actions).
- Le type de nœud qui détermine la variante du menu est le type du banc résolu depuis le catalogue (le même champ `type` qui vaut déjà "SHARE" pour les ressources partagées ailleurs dans l'application).
- Le compteur affiché sur chaque action correspond au nombre d'éléments **relationnels** (bancs ou ressources) reliés par cette relation qui **ne sont pas déjà présents comme nœud** dans le diagramme au moment où le menu s'ouvre — pas le nombre total de relations existantes.

## Requirements

### Functional Requirements

#### 1. Action "Show shared resources" sur un banc normal
- Ajoutée dans le menu contextuel d'un banc normal, aux côtés de "Show depends on" et "Show supports".
- Affiche, comme les actions existantes, les ressources partagées directement associées au banc cliqué, en tant que nouveaux nœuds reliés par des arêtes de type "ressource partagée" (couleur déjà distincte dans la légende).
- Les ressources déjà affichées dans le diagramme ne sont pas dupliquées (même principe de déduplication que les expansions existantes).

#### 2. Compteur d'éléments non affichés sur chaque action
- "Show depends on", "Show supports", "Show shared resources" (et "Usable by", cf. ci-dessous) affichent chacune, à côté de leur libellé, le nombre d'éléments que cette action ajouterait concrètement au diagramme (c'est-à-dire ceux qui n'y figurent pas déjà).
- Si ce nombre est 0 (tout est déjà affiché, ou aucune relation de ce type n'existe), l'action reste visible mais désactivée — cohérent avec le comportement actuel où une action sans aucune relation est déjà grisée.

#### 3. Menu contextuel spécifique aux ressources partagées
- Un clic droit sur un nœud dont le banc résolu est de type "SHARE" affiche un menu différent avec seulement deux actions : "Usable by" et "Hide".
- **"Usable by"** : recherche, parmi tous les bancs du catalogue, ceux qui référencent cette ressource partagée dans leurs propres ressources partagées, et les affiche comme nouveaux nœuds reliés à la ressource (l'utilisateur voit ainsi qui d'autre dépend de cette même ressource).
- **"Hide"** : comportement identique à celui déjà existant sur les bancs normaux (masque le nœud et ses arêtes ; un banc actuellement sélectionné comme racine ne peut pas être masqué ainsi, seulement retiré via sa croix dans la barre de recherche).

### Non-Functional Requirements
- **Aucun nouvel appel backend** : la relation inverse "Usable by" se calcule à partir des données déjà chargées côté client (le catalogue complet des bancs), sans requête supplémentaire.
- Les positions et éléments déjà affichés dans le diagramme ne doivent pas être perturbés par ces nouvelles actions — même principe que les expansions existantes (placement local, pas de recalcul global du layout).

## Scope

### In Scope
- Ajout de l'action "Show shared resources" au menu contextuel des bancs normaux.
- Ajout des compteurs d'éléments non affichés sur toutes les actions d'expansion du menu contextuel (existantes et nouvelles).
- Nouveau menu contextuel dédié aux nœuds de type "SHARE", avec les actions "Usable by" et "Hide".

### Out of Scope
- Toute modification du calcul de layout ELK ou de la sauvegarde/chargement de diagrammes.
- Un éventuel troisième niveau de menu contextuel pour d'autres types de bancs (SIB, FIB, RT, SIMU, NA) au-delà de la distinction "normal" / "SHARE" décrite ici.
- Modification du modèle de données backend (le champ `SharedResourcesDependsOn` existant suffit, la relation inverse est calculée côté client).

## Affected Areas
- Le composant du menu contextuel du diagramme (actuellement `NodeContextMenu.tsx`) — ajout de l'action "Show shared resources", des compteurs, et de la variante "ressource partagée".
- La logique d'expansion du diagramme (actuellement dans `DependencyGraph.tsx`, fonctions `handleExpand`/`onNodeContextMenu`) — ajout du calcul de la relation inverse "Usable by" (recherche dans le catalogue complet des bancs référençant la ressource), et du calcul des compteurs par relation.

## Edge Cases
- **Nœud non résolu** (banc/ressource introuvable dans le catalogue, affiché "Not in catalogue") : le type ("SHARE" ou non) ne peut pas être déterminé — à trancher (cf. Open Questions) : menu de banc normal par défaut avec toutes les actions désactivées (comportement actuel déjà cohérent avec ce cas), ou menu minimal réduit à "Hide" seul.
- **Ressource partagée sans aucun banc l'utilisant** (autre que celui qui l'a fait apparaître) : "Usable by" reste visible mais désactivée avec un compteur à 0.
- **Banc n'ayant aucune ressource partagée** : "Show shared resources" reste visible mais désactivée avec un compteur à 0 (comportement déjà existant pour "Show depends on"/"Show supports" sans relation).
- **Ressource partagée elle-même actuellement sélectionnée comme racine** (cas limite peu probable mais possible si l'utilisateur la sélectionne directement via la recherche) : le menu spécifique "SHARE" doit tout de même s'afficher, mais "Hide" reste désactivée comme pour tout banc racine actuel.

## Open Questions
- Quel menu afficher sur un nœud non résolu ("Not in catalogue"), où le type ne peut pas être déterminé : le menu de banc normal (toutes actions désactivées, comme aujourd'hui) ou un menu réduit à "Hide" seule ? => tout action visible mais désactivén et en plus le cadre reste gris et pas bleu.

- Le compteur doit-il se limiter aux relations directes du nœud cliqué, ou également tenir compte d'éventuelles relations déjà en cours d'ajout ailleurs dans la même interaction (cas très marginal, uniquement pertinent si deux expansions se chevauchent) ? => uniquement relation directe

## Acceptance Criteria
- [ ] Le menu contextuel d'un banc normal propose "Show depends on", "Show supports", "Show shared resources" et "Hide".
- [ ] "Show shared resources" affiche correctement les ressources partagées du banc cliqué, sans dupliquer celles déjà présentes.
- [ ] Chaque action d'expansion affiche le nombre d'éléments qu'elle ajouterait réellement (déjà affichés exclus), et se désactive à 0.
- [ ] Un clic droit sur un nœud de type "SHARE" affiche le menu spécifique avec uniquement "Usable by" et "Hide".
- [ ] "Usable by" affiche correctement tous les bancs du catalogue référençant cette ressource partagée, sans dupliquer ceux déjà présents.
- [ ] "Hide" sur une ressource partagée fonctionne comme sur un banc normal (bloqué si c'est un banc racine actuellement sélectionné).
- [ ] `npm run build` passe sans erreur ; aucune régression sur le reste de `/interaction` (Save/Load, sélection multiple, algorithme radial).
