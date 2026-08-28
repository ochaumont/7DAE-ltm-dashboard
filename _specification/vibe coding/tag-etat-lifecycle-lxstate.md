# Feature Spec: Tag d'état de cycle de vie ("lxState")

## Summary
- Le backend expose désormais, sur chaque élément (Lab Test Mean), un nouvel attribut `lxState` pouvant valoir `"DRAFT"`, `"APPROVED"`, ou `"BROKEN_QUALITY_SEAL"`.
- Un tag doit s'afficher en haut à droite de chaque élément :
  - `lxState === "DRAFT"` → tag **DRAFT**, en gris.
  - `lxState === "APPROVED"` ou `"BROKEN_QUALITY_SEAL"` → tag **RELEASE**, en vert.

## Motivation
- `lxState` indique si la fiche d'un banc est encore un brouillon ou une version validée ("release"). Cette information métier n'est aujourd'hui visible nulle part dans le dashboard.
- Un tag visuel directement sur chaque élément permet de distinguer d'un coup d'œil les fiches encore en brouillon de celles qui sont validées, sans avoir à ouvrir chaque fiche.

## Décisions (arbitrées)
- Le mapping est binaire côté affichage bien que la donnée source ait 3 valeurs : `"APPROVED"` et `"BROKEN_QUALITY_SEAL"` sont toutes deux traitées comme "RELEASE" (vert) ; seule `"DRAFT"` donne le tag "DRAFT" (gris).

## Requirements

### Functional Requirements

#### 1. Récupération de l'attribut
- Le modèle de données d'un Lab Test Mean porte désormais un champ `lxState`, lu depuis l'attribut `lxState` de la réponse backend, avec les valeurs possibles `"DRAFT"`, `"APPROVED"`, `"BROKEN_QUALITY_SEAL"`.

#### 2. Affichage du tag
- Un tag est affiché en haut à droite de chaque élément représentant un Lab Test Mean :
  - `"DRAFT"` → tag texte "DRAFT", couleur grise.
  - `"APPROVED"` ou `"BROKEN_QUALITY_SEAL"` → tag texte "RELEASE", couleur verte.

### Non-Functional Requirements
- Aucun changement du format ou de l'URL d'appel de l'API existante — l'attribut est simplement un champ supplémentaire dans une réponse déjà consommée.
- Le comportement doit rester correct si le backend ne renvoie pas l'attribut sur un élément donné (cf. Open Questions pour le comportement par défaut).

## Scope

### In Scope
- Lecture de l'attribut `lxState` dans le modèle de données.
- Affichage du tag DRAFT/RELEASE en haut à droite de chaque élément.

### Out of Scope
- Tout filtre ou tri du catalogue basé sur `lxState`.
- Toute modification du comportement métier (édition, validation) lié à cet état.

## Affected Areas
- Le modèle de données (`lib/types.ts`) et son adaptation depuis la réponse backend (`lib/labtestmean-adapter.ts`, `lib/atom-api.ts` pour le DTO brut).
- Les composants affichant un élément Lab Test Mean, à déterminer précisément (cf. Open Questions) : cartes du catalogue, nœuds du diagramme `/interaction`, fiche détaillée, carte `/map`.

## Edge Cases
- **Valeur absente ou inattendue** de `lxState` (champ manquant, `null`, ou toute valeur autre que les 3 connues) : comportement à définir, cf. Open Questions.

## Open Questions
- "Chaque élément" désigne-t-il uniquement les nœuds du diagramme `/interaction`, ou aussi les cartes du catalogue (`/`), la fiche détaillée (`/labtestmean`), et/ou les marqueurs de `/map` ? => uniquement les noeuds du diagramme pour l'instant

- Si `lxState` est absent ou a une valeur inattendue (ni DRAFT, ni APPROVED, ni BROKEN_QUALITY_SEAL) : faut-il n'afficher aucun tag, ou afficher un tag par défaut (ex. DRAFT gris) ? => normalement ce n'est pas possible, mais si ça arrive afficher DRAFT par défaut

## Acceptance Criteria
- [ ] Un élément avec `lxState: "DRAFT"` affiche un tag "DRAFT" gris en haut à droite.
- [ ] Un élément avec `lxState: "APPROVED"` affiche un tag "RELEASE" vert en haut à droite.
- [ ] Un élément avec `lxState: "BROKEN_QUALITY_SEAL"` affiche un tag "RELEASE" vert en haut à droite.
- [ ] `npm run build` passe sans erreur ; aucune régression sur les éléments concernés.
