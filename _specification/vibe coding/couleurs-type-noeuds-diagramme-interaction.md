# Feature Spec: Couleurs des nœuds et des liens "shared resource" du diagramme d'interaction

## Summary
- La couleur des liens de type "shared resource" dans `/interaction` passe du **violet** actuel à l'**orange** — le violet actuel est jugé trop proche visuellement du bleu déjà utilisé ailleurs dans le diagramme (liens "depends on", cadre des bancs racines).
- La couleur du **cadre des cartes de bancs** dans le diagramme n'est plus déterminée par le statut "racine sélectionnée" mais par le **type du banc** :
  - Un banc normal → cadre **bleu**.
  - Un banc de type ressource partagée ("shared resource") → cadre **orange**, la même couleur que les liens "shared resource".
  - Un élément dont le type n'est pas déterminable (nœud non résolu dans le catalogue) → cadre **gris**.

## Motivation
- Le violet actuellement utilisé pour les liens "shared resource" est perçu comme trop proche du bleu utilisé pour les liens "depends on" et pour le cadre des bancs racines, rendant les deux relations difficiles à distinguer au premier coup d'œil.
- Colorer le cadre des nœuds "shared resource" avec la même couleur que leurs liens renforce la lisibilité : l'utilisateur peut immédiatement associer un nœud à son type de relation dominant, sans avoir à lire le texte de la carte.

## Décisions (arbitrées)
- La nouvelle couleur "shared resource" (orange) est utilisée à la fois pour les liens et pour le cadre des nœuds de ce type — une seule couleur, deux usages.
- La distinction visuelle "banc actuellement sélectionné comme racine" (actuellement rendue par un cadre plus épais/coloré) n'est plus définie par le statut de racine mais uniquement par le type du banc — un banc racine de type normal est bleu comme n'importe quel autre banc normal, un banc racine de type "shared resource" est orange comme n'importe quel autre nœud "shared resource".

## Requirements

### Functional Requirements

#### 1. Couleur des liens "shared resource"
- Tous les liens représentant une relation "shared resource" dans le diagramme passent du violet à l'orange, dans les deux thèmes (clair et sombre) de l'application.

#### 2. Couleur du cadre des cartes selon le type
- Le cadre (bordure) d'une carte de banc dans le diagramme reflète désormais le type du banc résolu :
  - Type normal (tout type autre que "shared resource") → bleu.
  - Type "shared resource" → orange (identique à la couleur des liens "shared resource").
  - Banc non résolu dans le catalogue (type indéterminable) → gris.

### Non-Functional Requirements
- Le changement s'applique de façon cohérente dans les deux thèmes clair et sombre déjà pris en charge par l'application.
- Aucun changement de comportement fonctionnel (les actions du menu contextuel, l'expansion, le masquage, la sauvegarde/chargement restent inchangés) — il s'agit uniquement d'un ajustement de palette de couleurs.

## Scope

### In Scope
- Changement de la couleur du lien "shared resource" (violet → orange).
- Changement de la logique de couleur du cadre des cartes du diagramme (basée sur le type du banc plutôt que sur son statut de racine).

### Out of Scope
- Tout changement de la couleur du lien "depends on" (reste bleu, inchangé).
- Tout changement de la taille des cartes (la distinction de taille entre banc racine et banc non-racine, si elle existe, n'est pas concernée par cette spec — uniquement la couleur).
- Tout changement du menu contextuel, des actions d'expansion, ou de la légende autre que la couleur qu'elle affiche déjà pour "shared resource".

## Affected Areas
- Les tokens de couleur de l'application (actuellement définis dans `app/globals.css` pour les deux thèmes) — la couleur associée à "shared resource" doit être changée en orange.
- Le composant représentant une carte de banc dans le diagramme (`DependencyGraph.tsx`) — la couleur du cadre doit être recalculée à partir du type du banc résolu plutôt que du statut de racine.
- La légende du diagramme (`DependencyLegend.tsx`) affiche déjà la couleur du token "shared resource" — elle reflétera automatiquement le changement sans modification de code.

## Edge Cases
- **Banc racine de type "shared resource"** (sélectionné directement via la recherche) : son cadre doit être orange, pas bleu, malgré son statut de racine.
- **Nœud non résolu devenu racine** : cas très improbable (un banc sélectionné via la recherche est toujours résolu au moment de la sélection) mais si un nœud devient introuvable après coup, son cadre reste gris.
- **Cohérence avec la légende** : la pastille de couleur "Shared resource" déjà affichée dans la légende du diagramme doit correspondre exactement à la nouvelle couleur orange, sans décalage.

## Open Questions
- Aucune couleur orange précise n'a été fournie — faut-il une teinte particulière (ex. orange vif, ambre) ou le choix est-il laissé libre tant qu'elle est visuellement distincte du bleu et du violet ? => choisi 

- Le banc actuellement sélectionné comme racine perd son cadre visuellement distinct (bleu) par rapport à un banc normal non-racine (également bleu) — est-ce acceptable, ou faut-il conserver une distinction (par exemple via l'épaisseur du cadre, déjà utilisée aujourd'hui) entre racine et non-racine, indépendamment de la couleur ? => juste l'épaisseur du cadre

## Acceptance Criteria
- [ ] Les liens "shared resource" s'affichent en orange dans les deux thèmes.
- [ ] Un banc normal (racine ou non) affiche un cadre bleu.
- [ ] Un banc de type "shared resource" (racine ou non) affiche un cadre orange, identique à la couleur des liens "shared resource".
- [ ] Un nœud non résolu affiche un cadre gris.
- [ ] La légende du diagramme affiche la même couleur orange pour "Shared resource".
- [ ] `npm run build` passe sans erreur ; aucune régression fonctionnelle sur `/interaction`.
