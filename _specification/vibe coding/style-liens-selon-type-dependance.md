# Feature Spec: Style des liens selon le type de dépendance ("dependencyType")

## Summary
- Le backend expose désormais, sur chaque référence de relation (`LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`), un nouvel attribut optionnel `attributes.dependencyType`, valant `"mandatory"`, `"optional"`, ou absent.
- Le style du **lien** affiché dans le diagramme `/interaction` doit refléter cette valeur :
  - `"mandatory"` → lien plein, dans la couleur habituelle du type de relation (comportement actuel, inchangé).
  - `"optional"` → lien en **pointillé**, même couleur que d'habitude.
  - Valeur absente (champ `attributes` ou `dependencyType` manquant) → lien **plein mais gris**, quelle que soit la relation.

## Motivation
- L'attribut `dependencyType` distingue les dépendances obligatoires des dépendances optionnelles, une information métier importante qui n'est aujourd'hui pas visible sur le diagramme — tous les liens d'un même type de relation se ressemblent, qu'ils soient critiques ou simplement optionnels.
- Rendre cette distinction visuelle directement sur le lien (sans avoir à ouvrir chaque fiche de banc) aide à lire d'un coup d'œil quelles dépendances sont réellement bloquantes.

## Décisions (arbitrées)
- Le style de trait (plein/pointillé/gris) est une information **orthogonale** à la couleur actuelle du lien (qui continue de dépendre du type de relation — "depends on"/"supports" fusionnés vs "shared resource", cf. spec déjà en place) : la couleur normale du lien s'applique dans les cas "mandatory" et "optional" ; le cas "valeur absente" écrase la couleur en gris, quel que soit le type de relation.
- Le champ vient de la référence de relation (`FactsheetRef`) du backend — un lien "depends-on"/"supports" étant l'expression miroir d'une même relation vue par les deux bancs, la valeur de `dependencyType` peut théoriquement différer entre les deux côtés ; ce cas est traité comme une question ouverte (cf. Open Questions).

## Requirements

### Functional Requirements

#### 1. Récupération de l'attribut
- Chaque relation (`depends-on`, `supports`, `shared-resource`) porte désormais, quand disponible, une valeur `dependencyType` ("mandatory" ou "optional"), lue depuis `attributes.dependencyType` de la référence backend correspondante.
- Toute autre valeur que "mandatory"/"optional" (absente, `null`, ou une valeur inattendue) est traitée comme "valeur absente".

#### 2. Style visuel du lien
- **"mandatory"** : lien plein, couleur inchangée par rapport à aujourd'hui.
- **"optional"** : lien en pointillé, couleur inchangée par rapport à aujourd'hui.
- **Absent** : lien plein, couleur grise neutre (remplace la couleur habituelle du type de relation pour ce lien précis).

#### 3. Persistance dans les sauvegardes locales
- Une sauvegarde de diagramme (Save/Save as new) doit conserver l'information nécessaire pour restaurer le même style de lien (plein/pointillé/gris) lors d'un chargement ultérieur, sans avoir à re-déterminer la valeur depuis le catalogue au moment du chargement.

### Non-Functional Requirements
- Aucun changement du format ou de l'URL d'appel de l'API existante — l'attribut est simplement un champ supplémentaire dans une réponse déjà consommée.
- Le comportement doit rester correct si le backend ne renvoie l'attribut sur aucune relation (rétrocompatibilité totale avec la forme de réponse actuelle) : tous les liens s'afficheraient alors en gris, ce qui est le comportement attendu pour "valeur absente", pas une régression.

## Scope

### In Scope
- Lecture de `attributes.dependencyType` sur les relations `LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`.
- Application du style de trait (plein/pointillé/gris) sur les liens du diagramme d'interaction en fonction de cette valeur.
- Conservation de cette information dans les sauvegardes locales existantes.

### Out of Scope
- Tout changement de la légende du diagramme (elle continue de représenter le type de relation par couleur ; aucune entrée de légende n'est ajoutée pour "mandatory"/"optional"/"absent" sauf demande explicite ultérieure).
- Tout changement du comportement de sélection, d'expansion ou de masquage des nœuds.
- Affichage de cette information ailleurs que sur le diagramme (catalogue, fiche détaillée d'un banc).

## Affected Areas
- Le modèle de données des relations (actuellement `DependencyRelation` dans `lib/types.ts`) et son adaptation depuis la réponse backend (`lib/labtestmean-adapter.ts`, `lib/atom-api.ts` pour le type de la référence brute).
- Le rendu des liens du diagramme (`components/interaction/DependencyGraph.tsx`) — la construction des arêtes doit désormais tenir compte de cette troisième valeur en plus du type de relation.
- Le format de sauvegarde locale (`lib/interactionSaves.ts`) — pour que le style d'un lien survive à un Save/Load.

## Edge Cases
- **Relation miroir avec des valeurs différentes** (le banc A référence B avec `dependencyType: "mandatory"`, mais B référence A avec `dependencyType: "optional"` ou une valeur absente) : comportement à définir, cf. Open Questions.
- **Ancienne sauvegarde locale** créée avant cette fonctionnalité (ne contenant pas l'information de style) : doit se charger sans erreur, avec un style par défaut à définir (cf. Open Questions).
- **Ressource partagée retrouvée via "Usable by"** : le style du lien doit provenir de la relation du banc utilisateur vers la ressource (celle qui porte effectivement l'attribut), pas d'une valeur arbitraire.

## Open Questions
- En cas de valeurs `dependencyType` différentes entre les deux extrémités d'une relation miroir (depends-on/supports), quelle valeur doit l'emporter pour le style du lien ? => ce cas n'est pas possible

- Quel style appliquer à un lien restauré depuis une sauvegarde locale créée avant cette fonctionnalité (qui ne contient pas cette information) : gris ("valeur absente" par défaut), ou plein coloré comme avant ? => gris

- Souhaitez-vous un indicateur dans la légende du diagramme pour expliquer la signification du pointillé/gris, ou seule la ligne suffit ? => oui legende

## Acceptance Criteria
- [ ] Une relation avec `dependencyType: "mandatory"` s'affiche en lien plein, couleur habituelle.
- [ ] Une relation avec `dependencyType: "optional"` s'affiche en lien pointillé, couleur habituelle.
- [ ] Une relation sans `dependencyType` (champ ou attribut absent) s'affiche en lien plein gris.
- [ ] Une sauvegarde locale conserve le style du lien lors d'un rechargement ultérieur.
- [ ] `npm run build` passe sans erreur ; aucune régression sur le reste de `/interaction` (menu contextuel, sélection multiple, Save/Load, couleurs par type de nœud).
