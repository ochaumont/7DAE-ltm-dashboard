# Feature Spec: Page "Radar" — vue circulaire des interfaces entre bancs

## Summary
- Nouvelle page **"Radar"**, accessible via un onglet de navigation positionné **juste à droite de "Interaction"** dans le header.
- Vue d'ensemble (et non plus centrée sur un seul banc comme `/interaction`) : tous les bancs visibles après filtrage sont disposés sur le pourtour d'un **cercle**, chacun représenté par un point + un libellé texte tourné tangentiellement au cercle (lisible, retourné à 180° sur la moitié gauche).
- Les relations entre bancs (`LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`) sont tracées comme des **courbes passant par le centre**, dans un style neutre et discret au repos.
- Au survol d'un banc, ses liens sont mis en évidence avec **une couleur pour les flux sortants** (ce dont il dépend / les ressources partagées qu'il utilise) et **une couleur différente pour les flux entrants** (les bancs qui dépendent de lui) — tout le reste s'estompe.
- Page explicitement **provisoire / exploratoire** : elle sert à valider l'intérêt de cette représentation "vue d'ensemble" avant de décider si elle est conservée, retravaillée, ou fusionnée avec `/interaction`.

## Motivation
- `/interaction` (déjà livré) répond à la question *"quelles sont les dépendances directes d'UN banc précis ?"*, mais ne permet pas de voir la structure globale des interfaces entre bancs — pour ça il faudrait sélectionner chaque banc un par un.
- Un outil LeanIX existant (captures fournies par l'utilisateur) résout ce problème avec une disposition radiale : tous les éléments sur un cercle, liens tracés au centre, survol qui isole les flux d'un élément avec une distinction visuelle entrant/sortant. Cette lecture "vue d'ensemble + isolement au survol" est ce qu'on veut reproduire pour les bancs ATOM.
- Le volume de données est significatif : jusqu'à **350 bancs** au maximum, mais l'usage nominal attendu (après application des filtres existants du catalogue) tourne autour de **50 bancs**. Le composant doit rester lisible et fluide dans le cas nominal, et ne pas casser dans le cas extrême.

## Décisions (arbitrées)
- **Technologie** : SVG fait main (pas de React Flow — le layout est purement déterministe par angle, aucun besoin de pan/zoom/drag arbitraire propre à React Flow). Génération de courbes en Bézier quadratique tirées vers le centre, dans l'esprit de ce qui existe déjà pour les arêtes de `/interaction`.
- **Interaction de survol** : appliquée **directement en manipulation DOM (toggle de classes CSS)**, pas via un recalcul React des tableaux de nœuds/arêtes — c'est la leçon tirée du bug de scintillement rencontré sur `/interaction` (recalculer les props à chaque `mouseenter` force un re-rendu coûteux ; ici, avec potentiellement des milliers d'arêtes, ce serait pire).
- **Encodage couleur** : au repos, toutes les arêtes sont dans une couleur neutre/discrète (variante grisée du thème). Au survol d'un banc, ses arêtes se recolorent en **2 teintes** — une pour sortant, une pour entrant — via deux nouveaux tokens CSS dédiés (`--color-radar-out`, `--color-radar-in`), définis dans les deux thèmes clair/sombre.
- **Mapping direction** : `LTMDependsOn` et `SharedResourcesDependsOn` du banc survolé → **sortant** (ce dont il a besoin) ; `LTMSupports` → **entrant** (ce qui dépend de lui). Cohérent avec la convention déjà retenue sur `/interaction`.
- **Garde-fou de densité** : si le nombre de bancs à afficher (après filtres) dépasse un seuil, la page affiche un message invitant à filtrer davantage plutôt que de tenter de rendre un graphe illisible/coûteux. Le rendu complet (nœuds + arêtes) n'est déclenché qu'en dessous de ce seuil.
- **Filtrage** : réutilisation du mécanisme de filtres déjà existant pour le catalogue (type, statut, pays, programme, portfolio, complexité) plutôt qu'un système de filtres propre à Radar.
- **Portée** : pas de pan/zoom/drag sur cette page (le cercle est dimensionné pour tenir dans le cadre disponible) ; pas de clic pour naviguer vers la fiche détail dans cette première itération — le survol est la seule interaction.

## Requirements

### Functional Requirements

#### 1. Nouvel onglet de navigation
- Ajouter un item **"Radar"** dans le header, immédiatement après "Interaction".
- Route dédiée, statique, suivant les mêmes conventions que les autres pages (`/`, `/map`, `/interaction`).

#### 2. Disposition circulaire
- Chaque banc visible (post-filtrage) est positionné à intervalle angulaire régulier sur un cercle.
- Le nom du banc s'affiche en libellé texte tourné tangentiellement à sa position sur le cercle, retourné à 180° sur la moitié gauche pour rester lisible de gauche à droite.
- Les noms trop longs sont tronqués visuellement sur le cercle (comme illustré dans les captures fournies) ; le nom complet doit néanmoins rester accessible (ex. via une étiquette flottante affichée près du point survolé).

#### 3. Tracé des relations
- Chaque relation (`LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`) entre deux bancs **tous deux visibles dans le jeu filtré courant** est tracée comme une courbe passant par la zone centrale du cercle.
- Une relation dont l'autre extrémité n'est pas dans le jeu filtré courant n'est pas tracée (pas de "moignon" vers un point inexistant).
- Au repos, l'ensemble des courbes est affiché dans un style neutre à faible contraste, pour donner une impression de densité globale sans surcharger visuellement.

#### 4. Survol d'un banc
- Survoler un point/libellé sur le cercle :
  - Met en évidence (couleur + opacité pleine) toutes les arêtes touchant ce banc, avec une couleur distincte pour les flux sortants et les flux entrants (cf. Décisions).
  - Estompe tous les autres bancs et arêtes non concernés.
  - Affiche le nom complet du banc survolé (utile quand le libellé radial est tronqué).
- Cette mise en évidence doit rester fluide même avec un nombre élevé d'arêtes (cf. Non-Functional Requirements).

#### 5. Filtrage
- Un panneau de filtres (réutilisant les composants de filtre existants du catalogue) permet de réduire l'ensemble des bancs affichés.
- Le nombre de bancs actuellement affichés (avant/après filtre) est visible à l'écran, pour que l'utilisateur comprenne où il se situe par rapport au seuil de densité.

#### 6. Garde-fou de densité
- Si le nombre de bancs filtrés dépasse le seuil défini, la zone de visualisation affiche un message explicite invitant à affiner les filtres, plutôt que de rendre le graphe complet.
- En dessous du seuil, le graphe circulaire complet (nœuds + arêtes au repos) s'affiche normalement.

#### 7. Indication de statut provisoire
- La page signale visuellement qu'il s'agit d'une vue exploratoire/provisoire (ex. un badge "Aperçu" ou équivalent), pour poser les attentes vis-à-vis des utilisateurs pendant la phase d'évaluation.

### Non-Functional Requirements
- **Performance** : la mise en évidence au survol doit s'exécuter sans re-rendu React coûteux ; l'implémentation doit tenir la charge même dans le cas extrême (350 bancs, potentiellement plusieurs milliers d'arêtes cumulées) sans geler l'interface.
- **Cohérence de thème** : nouveaux tokens couleur définis pour les deux thèmes clair/sombre, suivant le pattern déjà en place dans `app/globals.css`.
- **Compatibilité export statique** : la route doit fonctionner sous `output: "export"`, comme le reste de l'application.
- **Pas de nouvelle dépendance lourde** : pas de librairie de graphe supplémentaire ; SVG + éventuellement une fonction de courbe déjà réalisable à la main (comme pour `/interaction`).

## Scope

### In Scope
- Nouvel onglet "Radar" (après "Interaction") + route associée.
- Composant de disposition circulaire (nœuds sur cercle, libellés tangents) et tracé des relations en courbes.
- Survol avec distinction visuelle entrant/sortant, sans re-rendu React par arête.
- Réutilisation du filtrage existant du catalogue pour réduire le jeu de données affiché.
- Garde-fou de densité avec message explicite au-delà du seuil.
- Signalement visuel du caractère provisoire de la page.

### Out of Scope
- Pan/zoom/drag sur le cercle.
- Clic pour naviguer vers la fiche détail ou ouvrir un aperçu (comme sur `/interaction`) — réservé à une itération ultérieure si la page est conservée.
- Fusion ou remplacement de `/interaction` par cette page — elles coexistent pour l'instant.
- Édition des relations depuis cette vue (lecture seule).
- Persistance des filtres de Radar au-delà de la session/navigation courante, sauf si le mécanisme de filtre réutilisé le fait déjà nativement.
- Bundling/regroupement visuel des arêtes (edge bundling) pour réduire l'enchevêtrement — au-delà du garde-fou de densité, aucune optimisation visuelle avancée n'est prévue dans cette V1.

## Affected Areas
- **Créer** :
  - `app/radar/page.tsx` + `components/RadarClient.tsx` (suivant le même pattern que `InteractionClient.tsx`).
  - `components/radar/CircularGraph.tsx` (layout circulaire, tracé des arêtes, survol en manipulation DOM directe).
  - Éventuels composants de support (légende entrant/sortant, message de garde-fou de densité, badge "provisoire").
- **Modifier** :
  - `components/Header.tsx` — ajout de l'onglet "Radar" après "Interaction".
  - `app/globals.css` — ajout de `--color-radar-out` / `--color-radar-in` (clair + sombre).
- **Réutiliser sans modifier** :
  - Le mécanisme de filtres existant (types/composants déjà utilisés par le catalogue/la carte).
  - `lib/types.ts` (`DependencyRelation`, `dependsOn`/`supports`/`sharedResources`) — aucun changement de modèle de données nécessaire, ces champs existent déjà depuis `/interaction`.

## Edge Cases
- **Banc sans aucune relation visible** : reste affiché comme point sur le cercle, sans arête ; survol ne met rien en évidence à part le point lui-même.
- **Relation vers un banc filtré/masqué** : l'arête correspondante n'est simplement pas tracée (l'autre extrémité n'existe pas dans le jeu courant).
- **Auto-référence** (un banc qui se dépend/supporte lui-même, incohérence de données) : à ignorer/filtrer, pas de boucle tracée sur elle-même.
- **Relation dupliquée entre deux mêmes bancs sur plusieurs types** (ex. présent à la fois dans `dependsOn` et `supports`, incohérence de données déjà rencontrée sur `/interaction`) : tracer les deux arêtes distinctement, ne pas les fusionner silencieusement.
- **Exactement au seuil de densité** : comportement à trancher (cf. Open Questions) mais doit être défini sans ambiguïté (`<=` ou `<`).
- **Filtres ramenant à 0 ou 1 banc** : cercle vide ou à un seul point, pas de crash, message d'état vide adapté si 0 banc.

## Open Questions
- **Valeur du seuil de densité** au-delà duquel on affiche le message d'invitation à filtrer plutôt que le graphe complet (ex. 100 ? 150 ? 350 étant le max théorique) ?
=>  100

- **Comportement au clic** sur un banc : rien (survol uniquement, comme précisé en Out of Scope), ou faut-il au moins "épingler" la mise en évidence pour permettre de lâcher la souris et lire tranquillement (pattern courant sur ce type d'outil) ? Affiche des liens en surbrillance colorée et grisé les aures au survol de la souris. Un clic fige le rendu, un autre click le libére.

- **Partage de l'état de filtre** : Radar doit-il avoir son propre état de filtres indépendant, ou partager le même état que le catalogue (risque : changer les filtres sur Radar affecterait aussi la vue catalogue au retour) ? => filtre similaire mais indépendant

- **Couleurs exactes** de `--color-radar-out` / `--color-radar-in` : à choisir en cohérence avec la palette existante, ou reprendre des tokens sémantiques déjà présents (`--color-success`/`--color-danger`) plutôt que d'en créer de nouveaux ? => oui

- **Forme du badge "provisoire"** : simple texte, badge coloré, tooltip explicatif ? Et doit-il renvoyer vers un espace de feedback ? => simple texte

## Acceptance Criteria
- [ ] Un onglet "Radar" apparaît dans la navigation, positionné immédiatement après "Interaction", et mène à une route dédiée.
- [ ] Les bancs visibles (post-filtrage) sont disposés sur un cercle avec libellés lisibles (tangents, retournés sur la moitié gauche).
- [ ] Les relations entre bancs mutuellement visibles sont tracées en courbes au repos, dans un style neutre.
- [ ] Survoler un banc met en évidence ses arêtes avec une couleur distincte selon le sens (sortant vs entrant), et estompe le reste, sans latence perceptible.
- [ ] Le panneau de filtres réutilisé permet de réduire l'ensemble affiché, avec un indicateur du nombre de bancs actuellement montrés.
- [ ] Au-delà du seuil de densité défini, un message invite à filtrer au lieu d'afficher un graphe complet.
- [ ] La page affiche un signal visuel clair de son caractère provisoire/exploratoire.
- [ ] Le rendu s'adapte correctement aux thèmes clair et sombre.
- [ ] `npm run build` passe sans erreur ; aucune régression sur `/`, `/map`, `/labtestmean`, `/interaction`, `/health`.
