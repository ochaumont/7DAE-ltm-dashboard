# Feature Spec: Icônes statut/type et position bâtiment/salle sur le diagramme d'interaction

## Summary
- Ajouter, sur chaque boîte de banc du diagramme `/interaction`, une icône de statut (In Project, Operational, Mothballed, Out of Service) positionnée en bas à droite de la boîte, reprenant les icônes déjà utilisées pour les étapes du cycle de vie (kickoff, mise en service, mise sous cocon, retrait de service) sur la fiche détaillée.
- Repositionner le bâtiment et la salle du banc juste après la ville, dans la ligne d'informations de la boîte.
- Remplacer le texte du type de banc (déjà affiché sur la boîte) par l'icône de type déjà utilisée sur les fiches détaillées et le catalogue, au même endroit.
- Ajouter les nouveaux réglages correspondants (statut, bâtiment/salle) au popup de paramètres d'affichage du diagramme déjà existant, aux côtés des réglages actuels (tag Quality Seal, type, ville).

## Motivation
- La boîte de banc du diagramme affiche aujourd'hui le type sous forme de texte et ne montre ni le statut du cycle de vie, ni le bâtiment/la salle. Ajouter ces informations, sous forme compacte (icônes), enrichit la lecture du diagramme sans l'alourdir visuellement.
- Réutiliser les icônes déjà connues (cycle de vie sur la fiche détaillée, type sur les fiches et le catalogue) garde une cohérence visuelle entre les différentes vues de l'application plutôt que d'introduire un nouveau langage graphique.

## Décisions (arbitrées)
- L'icône de statut reprend une-à-une les icônes déjà utilisées pour les étapes du cycle de vie sur la fiche détaillée : In Project → icône "kickoff" (drapeau), Operational → icône "in service" (coche), Mothballed → icône "mothballed" (lune), Out of Service → icône "dismantled" (corbeille).
- L'icône de statut est positionnée en bas à droite de la boîte de banc (symétrique au tag Quality Seal déjà positionné en haut à droite).
- Le bâtiment et la salle s'ajoutent à la suite de la ville, dans la même ligne d'informations (qui contenait déjà type et ville).
- Le type de banc garde le même emplacement qu'aujourd'hui dans cette ligne, mais s'affiche désormais avec l'icône de type (comme sur les fiches détaillées/le catalogue) au lieu du texte du type.

## Requirements

### Functional Requirements

#### 1. Icône de statut
- Chaque boîte de banc affiche, en bas à droite, une icône représentant son statut de cycle de vie actuel (In Project, Operational, Mothballed, Out of Service), reprenant l'icône déjà associée à l'étape correspondante sur la fiche détaillée.
- Un banc non résolu dans le catalogue ("Not in catalogue") n'affiche pas cette icône, comme pour les autres informations déjà conditionnées à la résolution du banc.

#### 2. Bâtiment et salle
- La ligne d'informations de la boîte (qui affiche déjà le type et la ville) affiche désormais aussi, à la suite de la ville, le bâtiment et la salle du banc quand ces informations existent.

#### 3. Icône de type
- Le type de banc, déjà affiché dans cette même ligne d'informations, est désormais représenté par son icône (la même que celle utilisée sur les fiches détaillées et les cartes du catalogue) plutôt que par son libellé texte.
- L'emplacement du type dans la ligne d'informations ne change pas.

#### 4. Réglages d'affichage
- Le popup de paramètres d'affichage du diagramme (déjà en place, avec les interrupteurs Quality Seal / Type / Ville) reçoit un nouvel interrupteur pour le statut.
- Un interrupteur supplémentaire est ajouté pour bâtiment/salle, indépendant de celui de la ville.
- Chaque nouveau réglage suit le même comportement que les réglages existants : activé par défaut, application immédiate, conservé entre deux visites de la page, indépendant des diagrammes sauvegardés.

### Non-Functional Requirements
- Les icônes de statut et de type doivent rester lisibles à la taille réduite d'une boîte de banc du diagramme.
- Aucune régression sur les informations déjà affichées (tag Quality Seal, nom du banc, bordure colorée par type).

## Scope

### In Scope
- Icône de statut en bas à droite de chaque boîte de banc.
- Affichage du bâtiment et de la salle après la ville, dans la ligne d'informations existante.
- Remplacement du texte du type par son icône, au même emplacement.
- Ajout des interrupteurs correspondants (statut, bâtiment/salle) dans le popup de paramètres d'affichage existant.

### Out of Scope
- Toute modification des icônes de cycle de vie ou de type elles-mêmes (elles sont réutilisées telles quelles).
- Toute modification du tag Quality Seal déjà en place (haut à droite de la boîte).
- Affichage de ces informations ailleurs que sur le diagramme `/interaction` (catalogue, carte, radar, fiche détaillée) — elles y sont déjà gérées indépendamment.

## Affected Areas
- Le rendu des boîtes de bancs du diagramme `/interaction` (actuellement : tag Quality Seal en haut à droite, nom, type texte + ville).
- Le popup de paramètres d'affichage du diagramme déjà existant (interrupteurs Quality Seal / Type / Ville).
- Les icônes déjà existantes pour le cycle de vie (fiche détaillée) et pour le type de banc (fiches détaillées, catalogue), réutilisées sans modification.

## Edge Cases
- Un banc dont le bâtiment ou la salle est absent : ce segment n'apparaît simplement pas dans la ligne d'informations (comme le fait déjà la ville aujourd'hui pour les bancs sans ville connue).
- Un banc non résolu dans le catalogue n'affiche ni icône de statut, ni type, ni ville/bâtiment/salle — cohérent avec le comportement actuel ("Not in catalogue").

## Open Questions
- Le nouvel interrupteur "bâtiment/salle" doit-il être un réglage unique (bâtiment et salle togglés ensemble), ou deux réglages séparés (un pour le bâtiment, un pour la salle) ? => séparé

- Si la ligne d'informations devient longue (type + ville + bâtiment + salle), faut-il la laisser s'afficher sur plusieurs lignes si nécessaire, ou garder une seule ligne tronquée (comportement actuel) quitte à couper le texte ? => une seule ligne

## Acceptance Criteria
- [ ] Chaque boîte de banc résolu affiche en bas à droite l'icône de statut correspondant à son cycle de vie actuel.
- [ ] La ligne d'informations affiche, dans l'ordre, l'icône de type, la ville, puis le bâtiment et la salle (quand disponibles).
- [ ] Le type de banc s'affiche sous forme d'icône (et non plus de texte), au même emplacement qu'auparavant.
- [ ] Le popup de paramètres d'affichage propose des interrupteurs pour activer/désactiver le statut et le bâtiment/salle, en plus des interrupteurs existants.
- [ ] Désactiver un interrupteur masque immédiatement l'information correspondante sur toutes les boîtes du diagramme ; la réactiver la fait réapparaître.
- [ ] `npm run build` passe sans erreur ; aucune régression sur le tag Quality Seal ni sur les réglages d'affichage déjà en place.
