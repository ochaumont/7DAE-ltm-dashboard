# Feature Spec: Liste de bancs affichables/masquables sur Dependency View

## Summary
- Sur la page Dependency View (`/depview`, radar circulaire), le panneau de filtres à gauche permet aujourd'hui un premier filtrage "grossier" (type, statut, pays, programme, etc.), qui détermine l'ensemble des bancs affichés sur le radar.
- Cette feature ajoute une seconde étape d'affinage : une liste à cocher de tous les bancs qui passent actuellement les filtres, permettant de masquer ou réafficher individuellement chaque banc sans changer les filtres eux-mêmes.
- Objectif : permettre à l'utilisateur de partir d'un ensemble filtré large, puis de retirer manuellement quelques bancs précis (bruit visuel, cas particuliers non pertinents pour l'analyse en cours) pour obtenir exactement le sous-ensemble qu'il veut observer sur le radar.

## Motivation
- Les filtres actuels opèrent par critère (type, statut, pays, etc.) et ne permettent pas d'exclure un banc précis tout en gardant tous les autres du même critère affichés — il faudrait un critère de filtre dédié à ce seul banc, ce qui n'est pas praticable.
- Avec un nombre de bancs filtrés parfois élevé (jusqu'à la limite réglable ajoutée récemment, voir `reglage-limite-affichage-dependency-view.md`), il n'existe aujourd'hui aucun moyen de voir d'un coup d'œil la liste complète des bancs actuellement affichés sur le radar — seul le radar lui-même le montre, difficile à lire au-delà d'une quinzaine de points.
- Une liste à cocher répond aux deux besoins à la fois : donner une vue d'ensemble lisible de "qui est affiché", et permettre de retirer ou remettre un banc précis en un clic.

## Requirements

### Functional Requirements

#### 1. Liste des bancs filtrés
- Une nouvelle section, distincte des filtres existants, affiche la liste de tous les bancs qui correspondent actuellement aux filtres grossiers (type, statut, pays, programme, etc.), avec le nombre total affiché dans son intitulé.
- Chaque banc de la liste est accompagné d'une case à cocher, cochée par défaut (banc visible sur le radar).

#### 2. Masquage / réaffichage individuel
- Décocher un banc dans la liste le retire immédiatement du radar (et de ses liens), sans modifier les filtres grossiers actifs — le banc reste présent dans la liste (juste décoché), pour pouvoir être réaffiché facilement.
- Recocher un banc précédemment décoché le réaffiche immédiatement sur le radar.
- Un contrôle "Tout afficher" permet de recocher tous les bancs de la liste en une seule action.

#### 3. Interaction avec les filtres grossiers
- Si un changement de filtre grossier fait qu'un banc auparavant masqué manuellement ne correspond plus aux critères, il disparaît simplement de la liste (comme n'importe quel autre banc filtré) ; son état masqué n'a plus d'effet puisqu'il n'est de toute façon plus affiché.
- Si un banc masqué manuellement redevient éligible après un changement de filtre (ex. filtre retiré puis remis), son état masqué manuel est conservé — un banc explicitement masqué par l'utilisateur ne doit pas réapparaître "par surprise" suite à un changement de filtre non lié à lui.

### Non-Functional Requirements
- **Aucun appel backend** : le masquage individuel est un état purement local à l'affichage du radar, sans persistance ni envoi au serveur.
- **Cohérence avec le compteur de bancs affichés** : le nombre de bancs effectivement montrés sur le radar (utilisé par ailleurs, ex. message "N of M lab test means shown") doit refléter le résultat après masquage individuel, pas seulement après les filtres grossiers.

## Scope

### In Scope
- Ajout d'une liste à cocher des bancs actuellement filtrés sur Dependency View, avec masquage/réaffichage individuel et un contrôle "Tout afficher".
- Mise à jour du radar et du compteur de bancs affichés pour refléter ce masquage individuel en plus des filtres grossiers déjà existants.

### Out of Scope
- Toute modification du comportement de filtrage grossier existant (types, statuts, pays, programmes, complexité, portefeuille, recherche).
- Persistance du masquage individuel entre deux visites de la page, ou partage de cet état entre utilisateurs.
- Ajout d'une liste ou d'un masquage équivalent sur d'autres pages (catalogue, carte, `/depgraph`) — cette feature ne concerne que Dependency View. Le panneau de filtres étant un composant partagé avec ces autres pages, la façon de n'y ajouter cette liste que sur Dependency View est un point à trancher en phase de planification technique.
- Recherche ou tri au sein de la liste des bancs elle-même (au-delà de l'ordre déjà utilisé ailleurs dans l'application).

## Affected Areas
- Le panneau de filtres de gauche utilisé par Dependency View (`components/FilterBar.tsx`, et sa variante mobile `components/FilterSheet.tsx`) — potentiellement concerné par l'ajout de la nouvelle section, sous réserve de la décision de scope ci-dessus (composant partagé avec le catalogue et la carte).
- `components/RadarClient.tsx` — détient déjà l'ensemble des bancs filtrés (`visible`) et le compteur affiché ; devra composer ce nouvel état de masquage individuel avec le résultat des filtres grossiers avant de le transmettre au radar (`CircularGraph`).

## Edge Cases
- **Tous les bancs de la liste sont décochés** : le radar affiche l'état "aucun banc à afficher" déjà existant pour une liste filtrée vide (même message que lorsque les filtres grossiers ne matchent rien), pas un message différent.
- **Un banc masqué manuellement est aussi le sujet d'un lien affiché par un autre banc visible** : le lien vers ce banc masqué doit disparaître comme si le banc n'était plus dans l'ensemble filtré (cohérent avec le comportement déjà existant quand un banc est exclu par un filtre grossier).
- **Changement de filtre grossier réduisant fortement la liste** : les cases à cocher des bancs qui restent éligibles conservent leur état (coché/décoché) précédent, elles ne sont pas réinitialisées à "tout coché" à chaque changement de filtre.

## Open Questions
- Faut-il un indicateur visuel séparé du nombre de bancs "masqués manuellement" (ex. "3 bancs masqués — Tout afficher"), ou le compteur global "N of M" suffit-il ? À trancher en phase de planification technique/UX. => Compteur globale suffit

- La liste doit-elle apparaître systématiquement dès qu'au moins un banc correspond aux filtres, ou seulement au-delà d'un certain nombre de bancs (pour ne pas alourdir l'interface avec une liste de 3 bancs quand elle n'apporte pas de valeur) ? À trancher en phase de planification technique/UX. => apparaitre systématiquement

## Acceptance Criteria
- [ ] Une liste à cocher affiche tous les bancs correspondant actuellement aux filtres grossiers sur Dependency View, avec leur nombre.
- [ ] Décocher un banc le retire immédiatement du radar et de ses liens ; le recocher le réaffiche immédiatement.
- [ ] Un contrôle "Tout afficher" recoche tous les bancs en une action.
- [ ] Le compteur de bancs affichés reflète le résultat après masquage individuel, pas seulement les filtres grossiers.
- [ ] Un changement de filtre grossier ne réinitialise pas l'état coché/décoché des bancs qui restent éligibles.
- [ ] Aucune régression sur le comportement de filtrage existant (catalogue, carte, filtres grossiers de Dependency View).
- [ ] `npm run build` passe sans erreur.
