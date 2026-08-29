# Feature Spec: Popup de paramètres d'affichage du diagramme d'interaction

## Summary
- Un nouvel icône "settings" (roue crantée) est ajouté à droite du bouton "..." existant dans la barre d'outils du diagramme `/interaction`.
- Cliquer sur cet icône ouvre un popup permettant de configurer les informations affichées dans les boîtes représentant les bancs du diagramme.
- Le popup propose, dans un premier temps, trois interrupteurs on/off, un par information actuellement toujours affichée :
  - le tag RELEASE/DRAFT,
  - le type de banc (FIB, SIB, RT, SIMULATOR, SHARED RESOURCE),
  - la ville (Toulouse, Hambourg, etc.).

## Motivation
- Chaque boîte de banc affiche aujourd'hui systématiquement le tag DRAFT/RELEASE, le type, et la ville, sans possibilité de simplifier la vue. Certains utilisateurs peuvent vouloir un diagramme plus épuré (par exemple pour se concentrer sur les noms et les relations) sans perdre ces informations pour ceux qui les utilisent.
- Un popup de configuration centralise ce réglage plutôt que de multiplier les options dispersées, et prépare la place pour d'autres réglages d'affichage futurs.

## Décisions (arbitrées)
- L'icône settings est positionné à droite du bouton "..." déjà présent dans la barre d'outils du diagramme (celui qui ouvre le menu Save/Save as new/Load).
- Les trois informations concernées (tag, type, ville) sont toutes affichées par défaut (comportement actuel inchangé tant que l'utilisateur ne désactive rien).

## Requirements

### Functional Requirements

#### 1. Icône d'accès aux paramètres
- Un icône "settings" est affiché dans la barre d'outils du diagramme, immédiatement à droite du bouton "...".
- Cliquer sur cet icône ouvre un popup de configuration de l'affichage du diagramme.

#### 2. Contenu du popup
- Le popup contient un interrupteur on/off pour chacune des trois informations suivantes, affichées dans les boîtes des bancs :
  - le tag RELEASE/DRAFT,
  - le type de banc,
  - la ville.
- Chaque interrupteur reflète l'état actuellement appliqué au diagramme (activé par défaut pour les trois).

#### 3. Effet des interrupteurs
- Désactiver un interrupteur masque immédiatement l'information correspondante sur toutes les boîtes de bancs du diagramme (nœuds déjà affichés et nœuds ajoutés ensuite).
- Réactiver un interrupteur la fait réapparaître immédiatement.
- Les autres informations affichées dans une boîte de banc (nom, bordure colorée par type, etc.) ne sont pas affectées par ces réglages.

### Non-Functional Requirements
- Le popup suit le même langage visuel que les autres popups/menus déjà présents dans la barre d'outils du diagramme (menu du bouton "...", modales Save as new / Load).
- L'ajout de ce popup ne modifie pas le comportement des boutons et menus existants (Save, Save as new, Load).

## Scope

### In Scope
- Ajout de l'icône settings à droite du bouton "...".
- Popup avec 3 interrupteurs on/off (tag RELEASE/DRAFT, type, ville).
- Application immédiate et réversible de ces réglages sur l'affichage des boîtes de bancs du diagramme.

### Out of Scope
- Tout réglage d'affichage supplémentaire au-delà de ces 3 informations (pourra faire l'objet d'une évolution future de ce même popup).
- Persistance de ces réglages au-delà de la session en cours (rechargement de page, sauvegarde locale de diagramme) — non demandé ici, cf. Open Questions.
- Toute modification du contenu ou du comportement du menu du bouton "..." (Save/Save as new/Load).

## Affected Areas
- La barre d'outils du diagramme `/interaction` (où se trouve déjà le bouton "...").
- Le rendu des boîtes de bancs du diagramme (actuellement : tag DRAFT/RELEASE, type, ville, toujours affichés).

## Edge Cases
- Un banc non résolu dans le catalogue ("Not in catalogue") n'affiche déjà ni tag, ni type, ni ville — les interrupteurs n'ont donc aucun effet visible sur ce type de nœud, ce qui est cohérent avec l'existant.

## Open Questions
- Ces réglages doivent-ils être conservés (mémorisés) entre deux visites de la page `/interaction`, ou repartent-ils systématiquement sur "tout affiché" à chaque chargement de la page ? => conservé 

- Ces réglages doivent-ils faire partie des sauvegardes locales de diagramme (Save/Save as new), ou sont-ils un réglage global indépendant de chaque diagramme sauvegardé ? => indépendant pour l'instant, on verra plus tard

## Acceptance Criteria
- [ ] Un icône settings apparaît à droite du bouton "..." dans la barre d'outils du diagramme.
- [ ] Cliquer sur cet icône ouvre un popup avec 3 interrupteurs on/off : tag RELEASE/DRAFT, type, ville.
- [ ] Désactiver l'interrupteur "tag RELEASE/DRAFT" masque ce tag sur toutes les boîtes de bancs du diagramme.
- [ ] Désactiver l'interrupteur "type" masque le type sur toutes les boîtes de bancs du diagramme.
- [ ] Désactiver l'interrupteur "ville" masque la ville sur toutes les boîtes de bancs du diagramme.
- [ ] Réactiver un interrupteur fait immédiatement réapparaître l'information correspondante.
- [ ] `npm run build` passe sans erreur ; aucune régression sur le menu "..." existant (Save/Save as new/Load).
