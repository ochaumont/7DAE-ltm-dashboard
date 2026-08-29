# Feature Spec: Correction de la coloration des liens sur Dependency View (radar)

## Summary
- La feature récente ayant ajouté une légende de liens sur `/depview` a aussi coloré les liens en permanence selon leur type ("Depends on" / "Supports" / "Shared resource"), quel que soit l'état de survol.
- Or "Depends on" et "Supports" ne sont pas deux natures de lien distinctes : ce sont les deux faces d'une même relation, selon le banc depuis lequel on la regarde (un banc "depend on" un autre ⇔ cet autre "supports" le premier). Colorer les liens en permanence avec ces deux couleurs suggère à tort qu'il s'agit de deux types de relation différents, indépendamment de tout point de vue.
- Cette feature corrige ce comportement : **tous les liens sont gris par défaut** (aucun banc survolé), et la couleur (Depends on vs Supports vs Shared resource) n'apparaît que **lorsque la souris survole un banc**, reflétant alors le sens de la relation *depuis ce banc*.
- En complément, comme sur `/depgraph`, un lien dont le type de dépendance est "optional" doit être tracé en pointillé — en permanence, indépendamment du survol (contrairement à la couleur).

## Motivation
- La couleur permanente actuelle induit en erreur : deux liens représentant la même relation physique (A dépend de B / B supporte A) pourraient apparaître avec des couleurs différentes selon le banc à l'origine de la donnée, sans qu'aucune des deux couleurs ne soit "la bonne" dans l'absolu — la notion de "Depends on" vs "Supports" n'a de sens que rapportée à un banc précis.
- Réserver la couleur au survol rend cette relativité explicite : en survolant un banc, l'utilisateur voit exactement, de son point de vue, quels liens il "consomme" (Depends on) et lesquels il "fournit" (Supports) — ce que le hover faisait déjà pour la direction (sortant/entrant) avant l'ajout de la légende par type.
- Le pointillé pour les dépendances optionnelles existe déjà sur `/depgraph` (voir `couleurs-type-noeuds-diagramme-interaction.md` / la légende de ce graphe) ; l'appliquer aussi sur le radar apporte la même information utile (mandatory vs optional) de façon cohérente entre les deux vues.

## Requirements

### Functional Requirements

#### 1. Liens gris par défaut
- Lorsqu'aucun banc n'est survolé, tous les liens du radar sont affichés dans une seule couleur neutre (gris), quel que soit leur type de relation (Depends on / Supports / Shared resource).

#### 2. Couleur au survol, selon le point de vue du banc survolé
- Lorsque la souris survole un banc, les liens connectés à ce banc prennent une couleur qui reflète la relation **du point de vue de ce banc précis** :
  - Un lien vers un banc dont le banc survolé dépend (le banc survolé a besoin de l'autre) prend la couleur "Depends on".
  - Un lien vers un banc qui dépend du banc survolé (l'autre a besoin du banc survolé) prend la couleur "Supports".
  - Un lien de type "Shared resource" garde toujours la même couleur "Shared resource", quel que soit le sens (cette relation n'a pas de sens directionnel).
- Les liens non connectés au banc survolé restent estompés (comportement de survol déjà existant, inchangé).
- Dès que la souris quitte le banc, tous les liens redeviennent gris (retour à l'état par défaut).

#### 3. Trait pointillé pour les dépendances optionnelles
- Un lien dont le type de dépendance (`dependencyType`) est "optional" est tracé en pointillé, que la souris survole un banc ou non — le pointillé est indépendant de la couleur/de l'état de survol.
- Un lien "Shared resource" sans type de dépendance renseigné est traité comme optionnel par défaut (même règle que sur `/depgraph`).
- Un lien dont le type de dépendance est "mandatory" (ou non renseigné pour Depends on/Supports) reste en trait plein.

#### 4. Légende mise à jour
- La légende des liens (ajoutée par la feature précédente) doit refléter ce nouveau comportement : elle doit indiquer clairement que la couleur par type de relation n'apparaît qu'au survol d'un banc, et non en permanence.
- La légende doit aussi indiquer la signification du trait plein vs pointillé (mandatory vs optional), à l'image de la légende déjà présente sur `/depgraph`.

### Non-Functional Requirements
- **Aucun changement de données** : cette feature ne modifie que l'affichage (couleur/style des liens), pas la structure des relations entre bancs.

## Scope

### In Scope
- Retour des liens à une couleur grise unique par défaut (hors survol).
- Application de la couleur par type de relation uniquement au survol d'un banc, avec la sémantique "Depends on"/"Supports" dépendante du point de vue du banc survolé, et "Shared resource" invariante.
- Trait pointillé permanent pour les dépendances optionnelles, plein pour les dépendances obligatoires.
- Mise à jour du contenu de la légende pour refléter ces deux règles.

### Out of Scope
- Tout changement à la logique de filtrage, de disposition (layout radial) ou de sélection des bancs affichés.
- Toute modification de la page `/depgraph` elle-même (qui a déjà ce comportement de trait pointillé, et dont la coloration par type ne pose pas le même problème puisqu'elle est déjà résolue par le sens des flèches, indépendant du survol).
- Ajout d'un nouveau type de relation ou changement du modèle de données des dépendances.

## Affected Areas
- `components/radar/CircularGraph.tsx` — logique de survol et de style des liens (actuellement colorés en permanence par type depuis la feature précédente).
- `components/radar/buildRadarGraph.ts` — construction des liens du radar ; devra probablement porter l'information de type de dépendance (mandatory/optional) jusqu'au rendu, en plus du type de relation déjà porté.
- `app/globals.css` — règles CSS des liens du radar (`.radar-edge` et ses variantes de survol), actuellement conçues pour une coloration permanente.
- `components/radar/RadarLegend.tsx` — contenu de la légende, à corriger pour refléter le nouveau comportement (couleur au survol uniquement, plus l'explication du pointillé).

## Edge Cases
- **Lien "Shared resource" survolé depuis l'un ou l'autre banc** : doit apparaître avec la même couleur "Shared resource" des deux côtés (pas de bascule Depends on/Supports pour ce type).
- **Lien optionnel entre deux bancs dont aucun n'est survolé** : reste gris, mais en pointillé (le pointillé ne dépend pas du survol, contrairement à la couleur).
- **Un banc a à la fois des liens "Depends on" et des liens "Supports" vers des bancs différents** : au survol de ce banc, chaque lien doit prendre indépendamment la couleur correspondant à son propre sens par rapport à ce banc (certains en "Depends on", d'autres en "Supports" simultanément).

## Open Questions
- Aucune identifiée à ce stade — le comportement demandé s'aligne directement sur le mécanisme de survol déjà existant (sortant/entrant), en y ajoutant simplement le pointillé et en corrigeant la palette utilisée.

## Acceptance Criteria
- [ ] Sans survol d'aucun banc, tous les liens du radar sont gris (aucune coloration par type visible en permanence).
- [ ] Au survol d'un banc, chaque lien connecté prend la couleur "Depends on" ou "Supports" selon le sens de la relation par rapport à ce banc précis, ou "Shared resource" si c'est le type du lien.
- [ ] À la sortie du survol, les liens redeviennent gris.
- [ ] Un lien dont le type de dépendance est "optional" (ou "Shared resource" sans type renseigné) est en pointillé, avec ou sans survol.
- [ ] Un lien "mandatory" (ou sans type renseigné pour Depends on/Supports) reste en trait plein.
- [ ] La légende reflète ces règles (couleur liée au survol, signification du pointillé).
- [ ] `npm run build` passe sans erreur.
