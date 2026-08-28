# Feature Spec: Sélection multiple de bancs dans le diagramme d'interaction

## Summary
- Le champ de recherche de `/interaction` permet aujourd'hui de choisir **un seul** banc, qui devient l'unique centre du diagramme.
- Il évolue pour permettre de sélectionner **plusieurs** bancs : taper un nom, cliquer dessus l'ajoute à une zone à droite du champ de recherche, sous forme d'étiquette (nom + croix pour le retirer).
- **Tous** les bancs présents dans cette zone sont affichés simultanément dans le diagramme, chacun comme un centre à part entière (avec ses propres dépendances/supports/ressources partagées, expansion transitive, etc.).
- Avec l'algorithme "Radial", qui n'a de sens qu'autour d'un seul centre, le comportement en présence de plusieurs bancs sélectionnés n'est **pas bloqué** : le centre du cercle résultant peut être arbitraire (déterminé par ELK, sans garantie que ce soit l'un des bancs choisis par l'utilisateur) — cf. Décisions.

## Motivation
- `/interaction` sert à visualiser les dépendances transitives entre bancs. Actuellement, comparer les dépendances de deux bancs nécessite de basculer l'un puis l'autre dans le champ de recherche, en perdant à chaque fois le diagramme précédent.
- Permettre plusieurs bancs sélectionnés simultanément répond à un besoin réel d'analyse comparative ou de vision d'ensemble sur un sous-ensemble de bancs choisi par l'utilisateur, sans avoir à tout reconstruire à chaque changement de banc.

## Décisions (arbitrées)
- **Radial n'est pas désactivé en sélection multiple.** Techniquement, l'algorithme radial d'ELK attend un centre unique par composant connexe ; avec plusieurs bancs sélectionnés, ce centre est déterminé automatiquement par ELK et peut ne correspondre à aucun des bancs choisis par l'utilisateur. Ce comportement est accepté tel quel pour cette itération plutôt que de restreindre l'algorithme à un seul banc sélectionné.
- Le layout "Layered" reste disponible sans restriction : il gère nativement plusieurs bancs sources sans notion de centre unique.

## Requirements

### Functional Requirements

#### 1. Sélection de plusieurs bancs via le champ de recherche
- Le champ de recherche existant (saisie du nom, liste de résultats filtrée) reste le point d'entrée : taper un nom, cliquer sur un résultat.
- Cliquer sur un résultat **ajoute** ce banc à la sélection, au lieu de remplacer le banc actuellement affiché.
- Un banc déjà sélectionné ne doit pas pouvoir être ajouté une seconde fois (recherché de nouveau et cliqué à nouveau : pas de doublon).

#### 2. Zone d'affichage des bancs sélectionnés
- Une zone dédiée, positionnée à droite du champ de recherche, affiche chaque banc sélectionné sous forme d'étiquette avec son nom.
- Chaque étiquette porte une croix permettant de retirer ce banc de la sélection (et donc du diagramme) individuellement.
- Retirer un banc via la croix ne doit pas nécessiter de re-taper une recherche.

#### 3. Le diagramme reflète l'ensemble de la sélection
- Tous les bancs présents dans la zone de sélection apparaissent dans le diagramme, chacun avec ses propres relations (depends-on/supports fusionnés, shared-resource) au même titre que le banc unique actuel.
- Si deux bancs sélectionnés partagent une dépendance commune, ou si l'un dépend de l'autre, cela doit apparaître clairement dans le diagramme (pas de doublon de nœud pour un même banc, pas de doublon d'arête pour une même relation) — même principe de fusion qu'actuellement pour l'expansion transitive.
- Le menu contextuel existant (Show depends on / Show supports / Hide) continue de fonctionner à l'identique sur n'importe quel nœud du diagramme, y compris les bancs sélectionnés eux-mêmes.

#### 4. Retrait d'un banc sélectionné
- Retirer un banc de la sélection (via la croix) le retire du diagramme, lui et les nœuds qui n'étaient reliés au diagramme qu'à travers lui — cf. Edge Cases pour le cas d'un nœud partagé avec un autre banc sélectionné ou ajouté manuellement via le menu contextuel.

#### 5. Comportement de l'algorithme "Radial" en sélection multiple
- Le sélecteur d'algorithme (Layered/Radial) reste utilisable quel que soit le nombre de bancs sélectionnés.
- En "Radial" avec plusieurs bancs sélectionnés, le centre du (ou des) cercle(s) résultant est celui déterminé automatiquement par le calcul de layout, sans garantie qu'il corresponde à un banc choisi par l'utilisateur.

### Non-Functional Requirements
- **Aucun nouvel appel backend** : la sélection de plusieurs bancs réutilise les données déjà chargées côté client (mêmes bancs que la recherche actuelle).
- **Compatibilité avec l'existant** : Save/Save as/Load, menu contextuel, légende, et affichage des cartes doivent continuer à fonctionner à l'identique avec une sélection multiple.

## Scope

### In Scope
- Évolution du champ de recherche pour accumuler plusieurs bancs sélectionnés plutôt qu'un seul.
- Zone d'affichage des bancs sélectionnés avec retrait individuel.
- Adaptation du diagramme et de son calcul de layout (ELK) pour afficher plusieurs bancs "centraux" simultanément, avec fusion des nœuds/arêtes partagés entre eux.
- Comportement accepté du layout "Radial" en sélection multiple (centre arbitraire, non restreint).

### Out of Scope
- Toute limite au nombre de bancs sélectionnables.
- Un mode d'affichage dédié ou une amélioration visuelle spécifique à "Radial" pour choisir/forcer un centre particulier en sélection multiple.
- Modification du format des sauvegardes locales (Save/Save as/Load) pour ce changement — à traiter séparément si besoin une fois la sélection multiple en place.
- Import/export ou partage de la sélection de bancs entre utilisateurs.

## Affected Areas
- Composant de recherche de bancs (`components/interaction/BenchCombobox.tsx` ou équivalent) — passer d'une sélection unique à une accumulation de bancs, avec la nouvelle zone d'étiquettes.
- `components/InteractionClient.tsx` — porter l'état de la sélection (liste de bancs au lieu d'un seul), et la synchronisation avec l'URL le cas échéant.
- `components/interaction/DependencyGraph.tsx` et sa construction du graphe ELK — gérer plusieurs bancs "racines" au lieu d'un seul, fusionner les nœuds/arêtes communs entre bancs sélectionnés.

## Edge Cases
- **Un même banc apparaît comme nœud du diagramme pour deux raisons différentes** (sélectionné directement dans la zone, ET atteint via l'expansion transitive d'un autre banc sélectionné) : ne doit apparaître qu'une seule fois.
- **Retirer un banc sélectionné dont un nœud voisin (ajouté par expansion) est aussi relié à un autre banc encore sélectionné** : ce nœud voisin doit rester affiché puisqu'il reste relié au diagramme par l'autre banc.
- **Deux bancs sélectionnés qui dépendent l'un de l'autre** : l'arête entre eux doit s'afficher normalement, sans traitement spécial autre que la fusion depends-on/supports déjà en place.
- **Sélection vide** (tous les bancs retirés) : le diagramme doit revenir à l'état "aucune sélection" déjà géré aujourd'hui pour l'absence de banc.
- **Radial avec un seul banc sélectionné** : comportement inchangé par rapport à aujourd'hui (le banc est bien le centre).
- **Radial avec plusieurs bancs** : le ou les centres résultants du calcul ELK peuvent ne pas correspondre aux bancs sélectionnés — accepté, cf. Décisions.

## Open Questions
- Le champ de recherche doit-il continuer à écarter les bancs sans `externalId` (comportement actuel), et empêcher également de sélectionner un banc déjà présent dans la zone (recherche filtrée ou clic sans effet) ? => oui

- Le retrait d'un banc de la zone de sélection doit-il conserver les positions déjà personnalisées (glissées manuellement) des nœuds restants, ou recalculer un nouveau layout à chaque changement de sélection ? => oui conservé, pareil pour l'ajout d'un banc

- Faut-il un ordre ou une limite visuelle pour la zone d'étiquettes si beaucoup de bancs sont sélectionnés (retour à la ligne, défilement horizontal) ?=> pas dans cette version

## Acceptance Criteria
- [ ] Taper un nom dans la recherche et cliquer sur un résultat l'ajoute à la zone de bancs sélectionnés, sans remplacer les bancs déjà présents.
- [ ] Chaque étiquette de la zone affiche le nom du banc et une croix qui le retire de la sélection.
- [ ] Le diagramme affiche simultanément tous les bancs de la zone de sélection, chacun avec ses relations propres.
- [ ] Un banc ou une relation commun(e) à plusieurs bancs sélectionnés n'apparaît qu'une seule fois dans le diagramme (pas de doublon de nœud ni d'arête).
- [ ] Le menu contextuel (Show depends on / Show supports / Hide) continue de fonctionner sur tous les nœuds, y compris les bancs sélectionnés.
- [ ] Le layout "Radial" reste sélectionnable avec plusieurs bancs choisis, sans blocage ni message d'erreur, même si le centre résultant ne correspond à aucun des bancs sélectionnés.
- [ ] Vider entièrement la sélection ramène le diagramme à l'état "aucune sélection" actuel.
- [ ] `npm run build` passe sans erreur ; aucune régression sur le reste de `/interaction` (Save/Load, légende, aperçu de banc).
