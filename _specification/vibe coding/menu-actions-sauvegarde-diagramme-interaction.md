# Feature Spec: Menu d'actions de sauvegarde du diagramme d'interaction

## Summary
- Les boutons actuels "Save" / "Save as" / "Load" de `/interaction` sont remplacés par un seul bouton compact, libellé **"..."**, qui ouvre un sous-menu avec trois actions : **Save**, **Save as new**, **Load**.
- **Save** n'apparaît dans le sous-menu que si le diagramme affiché a déjà été enregistré (une sauvegarde active existe) — enregistrer sous le même identifiant.
- **Save as new** ouvre une popup **centrée dans la page** avec un champ de saisie pour l'identifiant de la nouvelle sauvegarde.
- **Load** ouvre une popup **centrée dans la page** listant les sauvegardes existantes : cliquer sur une ligne charge le diagramme correspondant, une icône poubelle par ligne permet de la supprimer.
- L'état de sauvegarde n'est plus affiché sous forme de texte ("Unsaved" / nom de la sauvegarde) mais uniquement via une **icône disquette** : verte si le diagramme affiché est identique à la dernière sauvegarde, rouge sinon, grise et désactivée si le diagramme n'a jamais été enregistré. Un clic sur la disquette (quand elle n'est pas désactivée) déclenche la même action que "Save". Le survol de la disquette affiche l'identifiant de la sauvegarde active.
- La logique de sauvegarde/chargement existante (stockage `localStorage`, pas de confirmation à l'écrasement, fusion des racines, etc.) est **conservée telle quelle** — il s'agit avant tout d'une refonte visuelle des composants d'interface, pas d'un nouveau mécanisme de persistance.

## Motivation
- La barre d'outils actuelle affiche simultanément un indicateur texte ("Unsaved" ou le nom de la sauvegarde active) et trois boutons ("Save", "Save as", "Load"), ce qui prend de la place et duplique l'information (le bouton "Save" est déjà désactivé/actif selon le même état que l'indicateur).
- Un bouton unique avec sous-menu et une icône d'état condensent cette même information et ces mêmes actions dans un espace plus compact, sans changer les fonctions de sauvegarde/chargement déjà en place.

## Décisions (arbitrées)
- Le libellé du bouton principal est littéralement **"..."** (trois points), pas une icône ni un autre texte.
- L'action **Save** est masquée (pas seulement désactivée) dans le sous-menu tant qu'aucune sauvegarde n'est active pour le diagramme courant.
- **Save as new** et **Load** utilisent des popups **centrées** dans la page (remplaçant les popovers actuels ancrés sous les boutons).
- L'indicateur d'état devient exclusivement une icône disquette (vert/rouge/gris désactivé) — le texte "Unsaved" / nom de sauvegarde disparaît de l'affichage permanent, mais l'identifiant reste consultable via une info-bulle au survol.

## Requirements

### Functional Requirements

#### 1. Bouton "..." et sous-menu
- Un bouton unique, libellé "...", ouvre au clic un sous-menu listant les actions disponibles.
- Le sous-menu se ferme au clic en dehors, à la sélection d'une action, ou à la touche Échap (même comportement que les menus déjà présents sur la page, ex. le menu contextuel du diagramme).

#### 2. Action "Save"
- N'apparaît dans le sous-menu que si le diagramme affiché a une sauvegarde active (a déjà été enregistré au moins une fois durant la session).
- Réenregistre le diagramme courant sous le même identifiant que la sauvegarde active, en écrasant silencieusement son contenu précédent (comportement déjà existant, inchangé).

#### 3. Action "Save as new"
- Toujours disponible dans le sous-menu dès qu'il y a un diagramme affiché (au moins un banc sélectionné).
- Ouvre une popup centrée dans la page avec un champ de saisie pour l'identifiant de la sauvegarde ; validation par un bouton ou la touche Entrée.
- Un identifiant vide ou composé uniquement d'espaces est refusé (comportement déjà existant, inchangé).
- Après validation, cette nouvelle sauvegarde devient la sauvegarde active.

#### 4. Action "Load"
- Toujours disponible dans le sous-menu (fonctionne même si aucun banc n'est actuellement sélectionné, comportement déjà existant).
- Ouvre une popup centrée dans la page listant toutes les sauvegardes existantes.
- Chaque ligne de la liste affiche l'identifiant de la sauvegarde et une icône "poubelle" permettant de la supprimer individuellement.
- Cliquer sur une ligne (hors icône poubelle) charge le diagramme correspondant et ferme la popup.

#### 5. Icône d'état "disquette"
- Affichée en permanence à côté du bouton "...".
- **Verte** : une sauvegarde est active et le diagramme affiché lui est identique (pas de changement non enregistré).
- **Rouge** : une sauvegarde est active mais le diagramme affiché a été modifié depuis (changements non enregistrés).
- **Grise et désactivée** : le diagramme affiché n'a jamais été enregistré (aucune sauvegarde active) — dans cet état, l'icône ne déclenche aucune action au clic.
- Cliquer sur l'icône quand elle est verte ou rouge déclenche la même action que "Save" (réenregistrement sous l'identifiant actif).
- Le survol de l'icône (quand elle n'est pas désactivée) affiche une info-bulle avec l'identifiant de la sauvegarde active.

### Non-Functional Requirements
- **Aucun changement du mécanisme de persistance** : le format des sauvegardes (`localStorage`, structure des données), la fusion multi-bancs, la suppression, et le remplacement intégral de la sélection au chargement restent identiques à l'implémentation actuelle.
- **Aucun nouvel appel backend.**

## Scope

### In Scope
- Remplacement des boutons "Save" / "Save as" / "Load" par un bouton unique "..." + sous-menu.
- Remplacement des popovers actuels de "Save as"/"Load" par des popups centrées dans la page.
- Remplacement de l'indicateur texte actuel ("Unsaved" / nom de sauvegarde) par une icône disquette à 3 états (vert/rouge/gris désactivé) avec info-bulle au survol.

### Out of Scope
- Toute modification du format de sauvegarde ou de la logique métier de Save/Save as/Load déjà en place (rootExternalIds, dédoublonnage, dirty-tracking, etc.).
- Confirmation avant écrasement (déjà exclue aujourd'hui, ne change pas).
- Renommage d'une sauvegarde existante.

## Affected Areas
- `components/interaction/SaveLoadControls.tsx` — refonte complète de l'interface (bouton "...", sous-menu, popups centrées, icône disquette avec info-bulle) ; la logique métier qu'il reçoit en props (handlers Save/Save as/Load/Delete, état actif/dirty) reste la même.
- `components/InteractionClient.tsx` — probablement inchangé au niveau logique ; à vérifier si le rendu du composant doit être adapté (ex. positionnement des popups centrées, qui sortent du flux normal de la barre d'outils).

## Edge Cases
- **Aucun banc sélectionné** : l'action "Save"/"Save as new" ne doit pas pouvoir créer une sauvegarde vide — "Save" reste masquée (pas de sauvegarde active possible sans diagramme), "Save as new" doit être indisponible ou inopérante tant qu'aucun banc n'est sélectionné.
- **Ouverture de "Load" alors que la liste des sauvegardes est vide** : afficher un message indiquant qu'aucune sauvegarde n'existe (comportement déjà existant à conserver).
- **Suppression de la sauvegarde actuellement active depuis la popup "Load"** : l'icône disquette doit repasser à l'état "jamais enregistré" (gris désactivé).
- **Échec d'écriture `localStorage`** (quota dépassé, stockage indisponible) : un message d'erreur discret doit rester visible, comme aujourd'hui.

## Open Questions
- Quand aucun banc n'est sélectionné, le bouton "..." doit-il rester cliquable (avec seulement "Load" dans le sous-menu), ou être lui-même désactivé ? rester cliquable avec les 3 actions visibles, mais save et saveas sont disabled.

- L'info-bulle au survol de la disquette doit-elle apparaître uniquement pour les états vert/rouge (identifiant existant), ou faut-il aussi une info-bulle explicative sur l'état gris désactivé (ex. "Not saved yet") ? => non pas besoin

- Le message d'erreur de sauvegarde (`saveError`, ex. "Could not save (storage unavailable or full)") doit-il s'afficher près du bouton "...", dans les popups centrées, ou ailleurs ?=> dans un popup d'erreur affiché dans le coin droit de l'écran, au dessus de l'écran , en flottant

## Acceptance Criteria
- [ ] Un bouton unique "..." remplace les trois boutons actuels et ouvre un sous-menu avec les actions applicables.
- [ ] "Save" n'apparaît dans le sous-menu que si une sauvegarde est active pour le diagramme courant.
- [ ] "Save as new" ouvre une popup centrée avec un champ de saisie ; un identifiant vide est refusé.
- [ ] "Load" ouvre une popup centrée listant les sauvegardes, avec suppression individuelle via une icône poubelle et chargement au clic sur une ligne.
- [ ] L'icône disquette reflète correctement les 3 états (vert/rouge/gris désactivé) selon que le diagramme est sauvegardé, modifié depuis, ou jamais enregistré.
- [ ] Cliquer sur la disquette (verte ou rouge) déclenche un enregistrement identique à l'action "Save".
- [ ] Le survol de la disquette affiche l'identifiant de la sauvegarde active.
- [ ] Aucune régression sur la logique de sauvegarde/chargement existante (persistance, dédoublonnage, remplacement de sélection au chargement).
- [ ] `npm run build` passe sans erreur.
