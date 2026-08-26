# Feature Spec: Sauvegarde locale du diagramme d'interaction

## Summary
- Trois boutons sur `/interaction` : **Save as**, **Save**, **Load**.
- **Save as** : demande un nom et enregistre l'état courant du diagramme (nœuds affichés, leurs positions, les arêtes, l'algorithme de layout, le banc racine) ; ce nom devient la "sauvegarde active".
- **Save** : ré-enregistre l'état courant sous le nom de la sauvegarde active, en écrasant la précédente **sans confirmation**.
- **Load** : affiche la liste de toutes les sauvegardes existantes et charge celle choisie, quel que soit le banc racine avec lequel elle a été créée.
- Stockage exclusivement local (`localStorage` du navigateur) — l'application n'ayant pas de backend de persistance, c'est la seule option sans infrastructure supplémentaire.

## Motivation
- `/interaction` permet désormais de construire un diagramme de dépendances transitives riche (expansion via menu contextuel, repositionnement manuel des cartes). Ce travail de composition est actuellement **perdu** au moindre changement de banc sélectionné ou rechargement de page — aucune façon de le reprendre plus tard.
- L'application ne dispose d'aucun système de persistance côté serveur ; ajouter un vrai backend pour ce seul besoin serait disproportionné. Le stockage local du navigateur (`localStorage`) couvre le besoin "reprendre son travail plus tard sur la même machine" sans aucune infrastructure nouvelle.
- Une piste complémentaire (export/import d'un fichier JSON, pour partager un diagramme entre collègues ou entre machines) a été évoquée en amont mais **n'est pas traitée dans cette itération** — cf. Out of Scope.

## Décisions (arbitrées)
- **Portée unique pour toute l'application** : une seule liste de sauvegardes, commune à tous les bancs racines — pas de liste séparée par banc. Charger une sauvegarde peut donc faire basculer le banc central affiché si elle a été créée à partir d'un autre banc.
- **Pas de confirmation à l'écrasement** : que ce soit via "Save" (sur la sauvegarde active) ou via "Save as" avec un nom déjà existant, l'écrasement est silencieux.
- **Stockage** : `localStorage`, sous forme d'un index (liste des noms) plus une entrée par sauvegarde nommée, chacune contenant un JSON représentant l'état du diagramme.
- **Contenu sauvegardé** : le banc racine (son identifiant), l'algorithme de layout sélectionné, et pour chaque nœud affiché son identifiant et sa position, plus la liste des arêtes (origine, destination, type). **Pas** les données complètes du banc (nom, type, site...) — celles-ci sont re-résolues depuis le catalogue en mémoire au moment du chargement, pour ne jamais afficher une information périmée si le banc a changé depuis la sauvegarde.

## Requirements

### Functional Requirements

#### 1. Bouton "Save as"
- Demande un nom à l'utilisateur, puis enregistre l'état courant du diagramme sous ce nom.
- Si ce nom correspond à une sauvegarde déjà existante, elle est écrasée silencieusement (cf. Décisions).
- Après l'opération, cette sauvegarde devient la "sauvegarde active" pour la session en cours.

#### 2. Bouton "Save"
- Ré-enregistre l'état courant sous le nom de la sauvegarde active (la dernière utilisée via "Save as" ou "Load" dans la session courante), en écrasant silencieusement son contenu précédent.
- Si aucune sauvegarde n'est active (aucun "Save as"/"Load" effectué depuis l'arrivée sur la page), le bouton est indisponible ou se comporte comme "Save as" (cf. Open Questions).

#### 3. Bouton "Load"
- Affiche la liste de toutes les sauvegardes existantes (toutes bancs racines confondus, portée unique pour l'app).
- Sélectionner une sauvegarde restaure fidèlement : le banc racine (en changeant la sélection courante si nécessaire), l'algorithme de layout, les nœuds avec leurs positions exactes, et les arêtes.
- La sauvegarde chargée devient la nouvelle "sauvegarde active".

#### 4. Persistance
- Les sauvegardes survivent à un rechargement de la page et à la fermeture du navigateur.
- Elles restent propres à ce navigateur et cette machine (limite connue et acceptée de `localStorage`, pas de synchronisation entre appareils ou utilisateurs dans cette itération).

### Non-Functional Requirements
- **Aucun nouvel appel backend.**
- **Résilience** : toute lecture/écriture `localStorage` est protégée (quota dépassé, navigation privée restrictive, stockage bloqué par l'utilisateur) — un échec se traduit par un message discret, jamais par un plantage de la page.
- **Fraîcheur des données** : les informations affichées sur chaque banc (nom, type, localisation...) proviennent toujours du catalogue chargé au moment du chargement de la sauvegarde, jamais d'un instantané figé.

## Scope

### In Scope
- Les trois boutons "Save as" / "Save" / "Load" sur `/interaction`.
- Le stockage/lecture des sauvegardes dans `localStorage`, avec une portée unique pour toute l'application.
- L'hydratation du diagramme (nœuds, positions, arêtes, algorithme, banc racine) à partir d'une sauvegarde chargée, sans recalcul de layout (même principe que l'insertion de nœuds via le menu contextuel : pas de nouvel appel ELK).

### Out of Scope
- Export/import d'un fichier JSON pour partager un diagramme entre utilisateurs ou machines — piste distincte, discutée mais non retenue pour cette itération.
- Confirmation avant écrasement d'une sauvegarde existante.
- Suppression ou renommage d'une sauvegarde depuis l'interface.
- Synchronisation entre navigateurs/appareils/utilisateurs.
- Tout changement au backend ou au modèle de données des bancs.

## Affected Areas
- `components/interaction/DependencyGraph.tsx` — exposer/rendre injectable l'état complet du diagramme (nœuds + positions, arêtes, algorithme) pour permettre sa sérialisation et sa restauration.
- Nouveau module de stockage local (ex. `lib/interactionSaves.ts`) : lecture/écriture de l'index des sauvegardes et de leur contenu dans `localStorage`, avec gestion d'erreur.
- Nouveaux éléments d'interface (boutons "Save as"/"Save"/"Load", liste de sélection pour "Load") dans la barre d'outils déjà présente sur `/interaction` (à côté du sélecteur d'algorithme).

## Edge Cases
- **Aucune sauvegarde active et clic sur "Save"** : comportement à définir (bouton désactivé vs équivalent de "Save as") — cf. Open Questions.
- **Nom vide ou composé uniquement d'espaces** lors d'un "Save as" : à définir (refuser la saisie, ou l'accepter tel quel).
- **Quota `localStorage` dépassé** (beaucoup de sauvegardes volumineuses) : échec silencieux avec message discret, le diagramme courant n'est pas affecté.
- **Sauvegarde chargée dont le banc racine n'existe plus** dans le catalogue courant (supprimé/renommé côté backend) : comportement à définir — cf. Open Questions.
- **Sauvegarde référençant des bancs voisins qui n'existent plus** : doivent s'afficher avec l'état "Not in catalogue" déjà existant, sans provoquer d'erreur.
- **`localStorage` totalement indisponible** (navigation privée très restrictive, désactivé par une politique du navigateur) : les trois boutons doivent dégrader proprement (ex. indisponibles avec message), sans casser le reste de la page.

## Open Questions
- **"Save" sans sauvegarde active** : bouton désactivé, ou comportement identique à "Save as" (demande un nom à la volée) ?=> identique

- **Nom vide/uniquement des espaces** : refusé, ou accepté tel quel ? => refusé

- **Banc racine d'une sauvegarde introuvable au chargement** : message d'erreur et abandon du chargement, ou chargement partiel avec avertissement ? => message erreur et abandon

- **Suppression d'une sauvegarde** : totalement hors scope pour cette itération, ou faut-il au moins prévoir un moyen minimal de "faire le ménage" (même basique) ? => solution basique

- **Indicateur visuel** de sauvegarde active / de modifications non enregistrées depuis le dernier "Save" : utile dès cette itération, ou à laisser de côté ? => oui faire un indicateur visuel

## Acceptance Criteria
- [ ] "Save as" avec un nom enregistre l'état courant (nœuds, positions, arêtes, algorithme, banc racine) et cette sauvegarde apparaît dans la liste de "Load".
- [ ] "Save" écrase silencieusement la sauvegarde active sous le même nom, sans demande de confirmation.
- [ ] "Load" liste toutes les sauvegardes existantes indépendamment du banc racine actuellement sélectionné.
- [ ] Charger une sauvegarde restaure fidèlement la disposition (positions exactes), les arêtes et l'algorithme, avec des données de banc à jour (jamais figées).
- [ ] Après un rechargement complet de la page, les sauvegardes précédemment créées restent accessibles via "Load".
- [ ] Aucune erreur visible si `localStorage` est indisponible ou plein — dégradation silencieuse avec message discret.
- [ ] `npm run build` passe sans erreur ; aucune régression sur `/interaction` ni sur le reste de l'application.
