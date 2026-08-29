# Feature Spec: Tag QUALITY SEAL sur le catalogue et filtre associé

## Summary
- Le tag DRAFT/RELEASE déjà affiché sur les nœuds du diagramme `/interaction` (cf. spec `tag-etat-lifecycle-lxstate.md`) doit également apparaître, en haut à droite, sur les encarts des lab test means de la vue Catalogue (`/`).
- Un nouveau filtre "QUALITY SEAL" doit être ajouté à la zone de filtre à gauche, à côté du filtre "PHOTO" existant (même ligne), sous la forme d'un interrupteur à glissière à 3 positions (comme le filtre "PHOTO"), avec les valeurs DRAFT / ALL / RELEASED.
- Ce filtre doit être disponible sur les trois vues qui partagent le même composant de filtre : Catalogue, Map, et Radar.

## Motivation
- L'information DRAFT/RELEASE (basée sur `lxState`) est une donnée métier utile pour identifier rapidement les fiches encore en brouillon. Elle n'est aujourd'hui visible que sur le diagramme `/interaction` ; l'étendre au catalogue et au filtre la rend accessible partout où l'utilisateur explore les bancs.

## Décisions (arbitrées)
- Le nouveau filtre s'appelle "QUALITY SEAL" et se positionne à côté du filtre "PHOTO" existant, sur la même ligne (cf. maquette fournie par l'utilisateur : les deux chapitres "PHOTO" et "QUALITY SEAL" côte à côte, chacun avec son propre interrupteur à glissière).
- Le filtre reprend le même style de composant que "PHOTO" : un interrupteur à glissière à 3 positions plutôt qu'une liste de cases à cocher comme "STATUS" ou "TYPE".
- Les 3 positions de l'interrupteur sont, dans l'ordre : DRAFT — ALL — RELEASED. "ALL" est la position par défaut (aucun filtrage).
- Le filtre est ajouté dans le composant de filtre partagé, donc disponible simultanément sur Catalogue, Map et Radar sans duplication.
- Le tag sur l'encart du catalogue est positionné en haut à droite de la carte, comme sur le diagramme `/interaction`.

## Requirements

### Functional Requirements

#### 1. Tag sur les encarts du catalogue
- Chaque encart de lab test mean dans la vue Catalogue affiche, en haut à droite, le même tag DRAFT (gris) / RELEASE (vert) que celui déjà utilisé sur les nœuds du diagramme `/interaction`, avec la même logique de couleur.

#### 2. Nouveau filtre "QUALITY SEAL"
- Un nouveau chapitre de filtre "QUALITY SEAL" est ajouté dans la zone de filtre à gauche, positionné à côté du chapitre "PHOTO" existant (même ligne).
- Ce chapitre prend la forme d'un interrupteur à glissière à 3 positions, sur le même modèle visuel et interactif que l'interrupteur "PHOTO" déjà en place : DRAFT / ALL / RELEASED.
- Sélectionner "DRAFT" ne montre que les lab test means dont le tag est DRAFT ; "RELEASED" ne montre que ceux dont le tag est RELEASE ; "ALL" ne filtre pas.
- Le filtre s'applique partout où la zone de filtre est utilisée : Catalogue, Map, Radar.

### Non-Functional Requirements
- Le filtre "QUALITY SEAL" doit suivre le même style visuel et le même comportement d'interaction que l'interrupteur "PHOTO" déjà en place, pour rester cohérent.
- Aucune duplication de composant : le filtre est ajouté une seule fois dans le composant de filtre partagé entre les trois vues.

## Scope

### In Scope
- Affichage du tag DRAFT/RELEASE, en haut à droite, sur les encarts de la vue Catalogue.
- Ajout du filtre "QUALITY SEAL" (interrupteur à glissière DRAFT / ALL / RELEASED) dans le composant de filtre partagé, à côté de "PHOTO".
- Application de ce filtre sur Catalogue, Map, et Radar.

### Out of Scope
- Affichage du tag sur la fiche détaillée d'un lab test mean (`/labtestmean`) — non demandé ici.
- Tout changement du tag déjà en place sur le diagramme `/interaction`.
- Persistance du filtre "QUALITY SEAL" dans l'URL ou le stockage local, sauf si le mécanisme existant pour "PHOTO" s'applique déjà automatiquement à tout nouveau filtre (à vérifier lors de l'implémentation, pas une exigence fonctionnelle nouvelle ici).

## Affected Areas
- Le composant de carte/encart de la vue Catalogue.
- Le composant de filtre partagé (zone de filtre à gauche), utilisé par Catalogue, Map, et Radar — notamment la zone où "PHOTO" est déjà rendu.
- Le modèle de données `lxState` déjà en place (`lib/types.ts`, `lib/labtestmean-adapter.ts`) — réutilisé tel quel, aucune évolution du datamodel nécessaire pour cette feature.

## Edge Cases
- Un lab test mean sans correspondance de type connu pour `lxState` retombe déjà sur "DRAFT" par défaut (comportement déjà décidé dans la spec précédente) — ce même comportement s'applique au tag du catalogue et au filtre.

## Open Questions
_Aucune question ouverte restante._

## Acceptance Criteria
- [ ] Chaque encart de la vue Catalogue affiche, en haut à droite, le tag DRAFT (gris) ou RELEASE (vert) selon `lxState`.
- [ ] Un interrupteur à glissière "QUALITY SEAL" (DRAFT / ALL / RELEASED) apparaît à côté de "PHOTO" dans la zone de filtre à gauche.
- [ ] Sélectionner "DRAFT" ne montre que les lab test means en DRAFT ; "RELEASED" ne montre que ceux en RELEASE ; "ALL" ne filtre pas.
- [ ] Ce filtre est disponible et fonctionnel sur les vues Catalogue, Map, et Radar.
- [ ] `npm run build` passe sans erreur ; aucune régression sur les filtres existants (PHOTO, STATUS, TYPE, etc.).
