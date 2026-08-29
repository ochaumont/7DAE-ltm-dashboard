# Feature Spec: Réglage de la limite d'affichage sur Dependency View

## Summary
- La page "Dependency View" (`/depview`, radar circulaire) refuse actuellement d'afficher le graphe dès que plus de 100 lab test means correspondent aux filtres actifs — cette limite est aujourd'hui une valeur fixe, invisible et non modifiable par l'utilisateur.
- Cette feature ajoute une icône de réglages sur cette page, ouvrant un petit panneau avec un curseur (slider) permettant de choisir cette limite entre 50 et 500.
- Objectif : laisser l'utilisateur décider lui-même du compromis entre densité affichable et lisibilité du radar, plutôt que de subir une valeur fixe choisie une fois pour toutes dans le code.

## Motivation
- Selon le jeu de filtres appliqué (ou l'absence de filtre), le nombre de bancs correspondants peut facilement dépasser la limite actuelle de 100, empêchant l'affichage du radar et forçant l'utilisateur à filtrer davantage même s'il souhaiterait voir un ensemble plus large, quitte à accepter un rendu plus dense.
- À l'inverse, un utilisateur sur un petit écran ou préférant un rendu toujours très aéré pourrait vouloir abaisser cette limite en dessous de 100.
- Rendre cette limite configurable évite d'avoir à choisir une seule valeur qui convienne à tout le monde.

## Requirements

### Functional Requirements

#### 1. Icône de réglages
- Une icône de réglages est ajoutée sur la page Dependency View (`/depview`), dans la barre d'outils de la page (à côté du réglage existant de taille des cercles, "Circle size").
- Cliquer sur l'icône ouvre un petit panneau (popover), qui se ferme au clic en dehors ou à la touche Échap — même comportement que les panneaux de réglages déjà présents ailleurs dans l'application (ex. réglages d'affichage du diagramme de dépendances).

#### 2. Curseur de limite d'affichage
- Le panneau contient un curseur (slider) permettant de choisir la limite du nombre de lab test means affichables, entre **50** et **500**.
- La valeur courante du curseur est affichée à côté de celui-ci (nombre exact).
- Déplacer le curseur applique immédiatement la nouvelle limite : si le nombre de bancs filtrés repasse sous la nouvelle limite, le radar s'affiche ; s'il la dépasse, le message d'avertissement actuel ("narrow them down to N or fewer…") s'affiche à la place, avec le message mis à jour pour refléter la nouvelle limite choisie.

#### 3. Persistance du réglage
- La limite choisie est mémorisée et reste appliquée lors des visites suivantes de la page (comportement cohérent avec les autres réglages d'affichage déjà persistés ailleurs dans l'application, ex. réglages du diagramme de dépendances).

#### 4. Valeur par défaut
- Tant que l'utilisateur n'a jamais modifié ce réglage, la limite reste celle utilisée aujourd'hui (100), pour ne pas changer le comportement actuel par défaut.

### Non-Functional Requirements
- **Aucun appel backend** : ce réglage n'affecte que le rendu côté client de la page déjà chargée, aucune nouvelle requête n'est nécessaire.

## Scope

### In Scope
- Ajout d'une icône de réglages et d'un panneau contenant le curseur de limite (50 à 500) sur `/depview`.
- Application immédiate et persistance locale du réglage choisi.

### Out of Scope
- Modification du comportement du message d'avertissement lui-même au-delà de la valeur de limite qu'il affiche.
- Tout réglage équivalent sur d'autres pages (`/depgraph`, catalogue, carte) — cette feature ne concerne que Dependency View.
- Changement de la logique de rendu du radar elle-même (performance, disposition) au-delà du seuil auquel elle se déclenche.

## Affected Areas
- `components/RadarClient.tsx` — contient aujourd'hui la constante fixe `RADAR_DENSITY_LIMIT` qui gère la bascule entre l'affichage du radar (`CircularGraph`) et le message d'avertissement (`TooDenseMessage`), ainsi que la barre d'outils où vit déjà le curseur "Circle size" — l'icône de réglages et son panneau viendraient logiquement s'y ajouter.
- `components/radar/TooDenseMessage.tsx` — reçoit déjà la limite en prop (`limit`), donc pas de changement de logique nécessaire au-delà de lui passer la valeur configurée au lieu de la constante fixe.

## Edge Cases
- **Curseur déplacé alors que le radar est déjà affiché et que le nouveau nombre de bancs filtrés dépasse la nouvelle limite** : le radar doit disparaître immédiatement au profit du message d'avertissement, sans qu'une action supplémentaire soit nécessaire.
- **Aucun bancs ne correspond aux filtres actifs** : comportement inchangé (message "No lab test means match these filters."), quelle que soit la limite configurée.
- **Réglage à la valeur minimale (50)** alors que le nombre de bancs filtrés est déjà inférieur à 50 : aucun changement visible, le radar continue de s'afficher normalement.

## Open Questions
- Le curseur doit-il avoir un pas fixe (ex. par tranches de 10 ou 50), ou une granularité de 1 unité ? À trancher en phase de planification technique, en cohérence avec les curseurs déjà existants dans l'application (qui utilisent généralement un pas de 10). => pas de 10

## Acceptance Criteria
- [ ] Une icône de réglages est visible sur `/depview`, à côté du réglage existant "Circle size".
- [ ] Cliquer sur l'icône ouvre un panneau contenant un curseur allant de 50 à 500, avec affichage de la valeur courante.
- [ ] Déplacer le curseur met à jour immédiatement le seuil utilisé pour basculer entre l'affichage du radar et le message d'avertissement.
- [ ] Le message d'avertissement affiché au-delà de la limite reflète la valeur actuellement configurée.
- [ ] Le réglage choisi est conservé lors d'une nouvelle visite de la page.
- [ ] Tant qu'aucun réglage n'a été fait, le comportement reste identique à aujourd'hui (limite de 100).
- [ ] `npm run build` passe sans erreur.
