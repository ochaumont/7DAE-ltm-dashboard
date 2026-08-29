# Feature Spec: Réglage de la largeur des boîtes du diagramme

## Summary
- Ajouter, dans le popup de paramètres d'affichage du diagramme `/depgraph` déjà existant, un nouveau réglage permettant de choisir la largeur des boîtes représentant les bancs.
- Objectif : permettre d'agrandir les boîtes pour que toutes les informations qu'elles affichent (nom, type, ville, bâtiment, salle, tag Quality Seal, icône de statut) tiennent sans être tronquées.

## Motivation
- Les boîtes du diagramme ont une largeur fixe. Depuis l'ajout progressif de plusieurs informations (tag Quality Seal, icône de statut, type, ville, bâtiment, salle), le contenu peut être tronqué sur une largeur fixe, en particulier quand plusieurs de ces informations sont activées en même temps dans le popup de réglages.
- Un réglage de largeur donne à l'utilisateur le contrôle pour adapter l'affichage à la quantité d'informations qu'il choisit de montrer, plutôt que de subir une troncature systématique.

## Décisions (arbitrées)
- Le réglage vit dans le même popup que les interrupteurs d'affichage déjà en place (Quality Seal, Type, Ville, Statut, Bâtiment, Salle) — un seul endroit centralise tous les réglages du diagramme.
- Ce réglage s'applique à toutes les boîtes du diagramme de façon uniforme (pas de largeur différente par boîte).

## Requirements

### Functional Requirements

#### 1. Réglage de largeur
- Le popup de paramètres d'affichage propose un contrôle permettant de choisir la largeur des boîtes de bancs.
- Modifier ce réglage change immédiatement la largeur de toutes les boîtes déjà affichées sur le diagramme, ainsi que celle de toute boîte ajoutée ensuite.

#### 2. Persistance et portée
- Ce réglage suit le même comportement que les autres réglages d'affichage déjà en place : valeur par défaut correspondant à la largeur actuelle, conservé entre deux visites de la page, indépendant des diagrammes sauvegardés.

### Non-Functional Requirements
- Élargir les boîtes ne doit pas casser la mise en page du diagramme (chevauchement de boîtes, liens mal positionnés) : les connexions entre boîtes doivent rester correctement ancrées quelle que soit la largeur choisie.
- Aucune régression sur les réglages d'affichage existants (Quality Seal, Type, Ville, Statut, Bâtiment, Salle) ni sur la distinction visuelle des bancs racine (bordure plus épaisse).

## Scope

### In Scope
- Un nouveau réglage de largeur des boîtes dans le popup de paramètres d'affichage existant.
- Application immédiate et réversible de ce réglage à toutes les boîtes du diagramme.

### Out of Scope
- Redimensionnement manuel d'une boîte individuelle (glisser un coin, etc.) — ce réglage est global, pas par boîte.
- Modification de la hauteur des boîtes.
- Application de ce réglage à d'autres vues que le diagramme `/depgraph` (catalogue, carte, radar).

## Affected Areas
- Le popup de paramètres d'affichage du diagramme déjà existant.
- Le rendu des boîtes de bancs du diagramme et le calcul de la disposition du graphe (positionnement des boîtes et ancrage des liens), qui dépendent aujourd'hui d'une largeur fixe commune à toutes les boîtes.

## Edge Cases
- Un diagramme déjà positionné (bancs déplacés manuellement, ou diagramme chargé depuis une sauvegarde) : changer la largeur ne doit pas faire se chevaucher les boîtes existantes de façon illisible, ni casser l'ancrage visuel des liens sur leurs boîtes.

## Open Questions
- Quelle forme doit prendre le contrôle de largeur : un curseur (slider) avec une plage min/max, ou un choix parmi quelques tailles prédéfinies (ex. Compact / Normal / Large) ? => un slider

- Quelle doit être la largeur minimale et maximale autorisée ? => minimum 80% de la taille actuel et max c'est 150% de la taille actuelle

## Acceptance Criteria
- [ ] Le popup de paramètres d'affichage propose un contrôle pour la largeur des boîtes de bancs.
- [ ] Changer ce réglage élargit ou rétrécit immédiatement toutes les boîtes du diagramme, sans chevauchement ni lien mal ancré.
- [ ] Le réglage est conservé entre deux visites de la page, indépendamment des diagrammes sauvegardés.
- [ ] `npm run build` passe sans erreur ; aucune régression sur les autres réglages d'affichage ni sur la distinction visuelle des bancs racine.
