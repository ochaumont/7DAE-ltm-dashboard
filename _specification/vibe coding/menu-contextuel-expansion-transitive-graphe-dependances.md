# Feature Spec: Menu contextuel — expansion transitive du graphe de dépendances

## Summary
- Sur `/interaction`, un **clic droit sur n'importe quel nœud** du graphe (le banc central comme un voisin déjà affiché) ouvre un **menu contextuel** avec trois actions :
  - **Show depends on** : ajoute au diagramme les bancs dont ce nœud dépend (`LTMDependsOn`).
  - **Show supports** : ajoute au diagramme les bancs qui dépendent de ce nœud (`LTMSupports`).
  - **Hide** : retire ce nœud (et les arêtes qui lui sont directement rattachées) de l'affichage courant.
- Objectif final : transformer le graphe hub-and-spoke actuel (1 banc central + ses relations directes) en un **véritable diagramme de dépendances transitives** — l'utilisateur construit progressivement, clic après clic, une carte multi-niveaux des interdépendances entre bancs, plutôt que de se limiter à une seule "étoile" à un seul niveau.
- Les liens ajoutés par une expansion doivent rester représentés avec le même code couleur par type de relation déjà en place (`--color-graph-depends-on` / `-supports` / `-shared-resource`).

## Motivation
- `/interaction` ne montre aujourd'hui que les relations **directes** d'un seul banc sélectionné (le "hub"). Pour comprendre une chaîne de dépendances (A dépend de B, qui dépend lui-même de C), il faut aujourd'hui re-sélectionner B dans le combobox et perdre la vue sur A — impossible de visualiser la chaîne complète d'un coup d'œil.
- C'est exactement la trajectoire "multi-pôles / enrichissement progressif" anticipée lors du choix d'ELK.js comme moteur de layout (plutôt que dagre) — cette fonctionnalité est la concrétisation de cette anticipation.
- **Point important découvert en amont** : contrairement à l'intuition de départ ("nécessite un appel au backend probablement"), les données nécessaires sont **déjà chargées côté client**. `useLabTestMeans()` charge la liste complète des bancs (`labTestMeans`), et chaque banc de cette liste porte déjà ses propres `dependsOn`/`supports`/`sharedResources` (ce sont les mêmes champs que ceux utilisés pour le banc central). Étendre le graphe à partir d'un voisin ne nécessite donc **aucun nouvel appel réseau** : il suffit de retrouver ce banc dans la liste déjà en mémoire (déjà fait aujourd'hui via `allBenches`/`byExternalId` pour résoudre les cartes voisines) et de lire ses relations. Cette suppression de la contrainte backend simplifie beaucoup la portée de la fonctionnalité.
- Exception : un voisin qui n'est **pas résolu** dans le catalogue local (cas déjà géré aujourd'hui, affiché "Not in catalogue") n'a par définition aucune donnée de relation disponible — pour ce cas, "Show depends on"/"Show supports" ne peuvent rien afficher (cf. Edge Cases).

## Requirements

### Functional Requirements

#### 1. Menu contextuel au clic droit
- Clic droit sur un nœud (banc central ou tout nœud déjà affiché suite à une expansion) : empêche le menu contextuel natif du navigateur et affiche un menu positionné au point de clic.
- Le menu propose les 3 actions ; fermeture au clic ailleurs, à Échap, ou après sélection d'une action.

#### 2. "Show depends on"
- Ajoute au diagramme les bancs figurant dans le champ `dependsOn` du nœud cliqué, avec les arêtes correspondantes (même sens/couleur que la convention actuelle : le nœud cliqué → ce dont il dépend).
- Un banc déjà présent dans le diagramme (ajouté via une expansion précédente, ou déjà visible par ailleurs) n'est **pas dupliqué** — un même banc = un seul nœud, même s'il apparaît dans les relations de plusieurs nœuds différents.
- Si le nœud cliqué n'a aucune relation `dependsOn`, ou si ses données ne sont pas résolvables (banc hors catalogue), l'action est indisponible (grisée) ou ne produit aucun changement visible avec un message discret (cf. Open Questions).

#### 3. "Show supports"
- Symétrique au point 2, pour le champ `supports` du nœud cliqué.

#### 4. "Hide"
- Retire le nœud cliqué du diagramme, ainsi que toutes les arêtes qui lui sont directement connectées.
- N'affecte que l'affichage courant (aucune donnée sous-jacente modifiée) — masquer puis re-sélectionner le même banc central, ou ré-agrandir le graphe autrement, doit pouvoir refaire réapparaître ce banc.
- Cacher le banc **central** (le nœud "hub" d'origine) : à trancher (cf. Open Questions) — probablement à interdire, puisque tout le diagramme perd son point d'ancrage.

#### 5. Représentation correcte des liens
- Chaque arête ajoutée lors d'une expansion respecte les mêmes règles déjà en place : couleur par type de relation, sens de la flèche (dépend-de sortant, supporte entrant), clipping au bord des cartes, et compatible avec le layout ELK déjà en place (`layered`/`radial`) — un nouveau nœud ajouté doit déclencher un recalcul de layout cohérent (cf. Open Questions pour le comportement exact vis-à-vis des nœuds déjà déplacés manuellement par l'utilisateur).

### Non-Functional Requirements
- **Pas de nouvel appel backend** pour cette fonctionnalité (cf. Motivation) — uniquement de la lecture sur les données déjà chargées (`allBenches`).
- **Performance** : l'expansion doit rester fluide même après plusieurs clics successifs faisant grossir le graphe (quelques dizaines de nœuds a minima, cohérent avec les volumes déjà rencontrés sur `/interaction`).
- **Cohérence avec l'existant** : le survol (mise en évidence sans re-rendu), le clic gauche (aperçu photo), la légende togglable et le drag-and-drop des cartes (déjà livré) continuent de fonctionner sur un graphe étendu.

## Scope

### In Scope
- Menu contextuel (clic droit) sur tout nœud du diagramme.
- Actions "Show depends on" / "Show supports" / "Hide", branchées sur les données déjà chargées côté client.
- Dédoublonnage des nœuds (un banc = un seul nœud, quel que soit le nombre de relations qui y mènent).
- Recalcul du layout ELK à chaque expansion pour intégrer les nouveaux nœuds/arêtes.

### Out of Scope
- Tout nouvel appel API / endpoint backend.
- Sauvegarde/persistance de l'état étendu du graphe (navigation, rechargement de page, changement de banc central) — l'expansion est un état de session éphémère.
- Détection et affichage explicite des **cycles** de dépendances (A dépend de B qui dépend de A) au-delà du fait que le dédoublonnage empêche déjà la duplication infinie de nœuds — pas de traitement visuel spécifique pour cette itération.
- Expansion automatique/en masse (ex. "tout déplier d'un coup", "profondeur N") — chaque expansion reste un geste utilisateur explicite, nœud par nœud.
- Édition ou modification des relations depuis cette vue (toujours en lecture seule).

## Affected Areas
- `components/interaction/DependencyGraph.tsx` — construction du graphe (actuellement centrée sur un seul hub) à faire évoluer vers un état capable de représenter un ensemble de nœuds/arêtes qui grandit dans le temps, plus le branchement du menu contextuel (`onNodeContextMenu`) et le recalcul ELK à chaque expansion.
- Nouveau composant menu contextuel (ex. `components/interaction/NodeContextMenu.tsx`), suivant le même type d'interaction que les composants déjà fermables au clic extérieur/Échap (`BenchCombobox`, `BenchPreviewModal`).
- `components/interaction/useElkLayout.ts` — probablement inchangé dans son fonctionnement, mais sollicité plus fréquemment (à chaque expansion plutôt qu'au seul changement de banc central).
- Pas de changement attendu sur `lib/types.ts`, `lib/atom-api.ts`, `lib/labtestmean-adapter.ts` (aucune nouvelle donnée requise, cf. Motivation).

## Edge Cases
- **Nœud non résolu localement** ("Not in catalogue") : "Show depends on"/"Show supports" ne peuvent rien afficher puisqu'aucune relation n'est connue pour ce banc côté client — comportement à définir (action grisée vs message).
- **Relation déjà visible** : cliquer "Show depends on" sur un nœud dont certaines dépendances sont déjà affichées (ajoutées via un autre chemin) ne doit ajouter que les nœuds/arêtes manquants, sans dupliquer les existants.
- **Cycle de dépendances** (A dépend de B, B dépend de A) : ne doit pas provoquer de boucle infinie ni de duplication — le dédoublonnage par identité de banc suffit à l'éviter mécaniquement.
- **Masquer un nœud qui a lui-même été précédemment étendu** : masquer le nœud retire ses arêtes directes, mais les nœuds qu'il avait fait apparaître restent visibles s'ils sont encore reliés à autre chose ; sinon ils deviennent orphelins (isolés) — à clarifier si c'est acceptable (cf. Open Questions).
- **Masquer le banc central d'origine** : cas particulier, cf. Requirement 4.
- **Expansion répétée sur un très grand nombre de nœuds** : pas de garde-fou de densité prévu dans cette itération (contrairement à `/radar`) — à surveiller si l'usage réel montre un besoin.

## Open Questions
- **Nœuds orphelins après un "Hide"** : faut-il les masquer en cascade automatiquement, ou les laisser affichés (l'utilisateur les masque lui-même s'il le souhaite) ? => laissé affiché

- **Masquage du banc central** : interdit purement et simplement, ou autorisé avec un comportement de repli (ex. le premier nœud restant devient visuellement l'ancre) ? interdit

- **Repositionnement au recalcul ELK** : quand un nouveau nœud est ajouté par expansion, ELK relance-t-il un layout complet (risque de faire bouger des nœuds que l'utilisateur avait déjà glissés manuellement), ou le nouveau nœud doit-il s'insérer sans perturber les positions déjà fixées par un drag utilisateur ? s'insérer sans perturber

- **Action indisponible** ("Show depends on" sur un nœud sans aucune dépendance connue, ou non résolu) : élément de menu grisé/désactivé, ou simplement absent du menu dans ce cas ? => grisé

- **Doit-on garder une trace visuelle de "qui a été étendu depuis qui"** (ex. un nœud ajouté récemment mis en valeur un court instant), ou l'apparition est-elle silencieuse ? => non pas utile

## Acceptance Criteria
- [ ] Un clic droit sur n'importe quel nœud du diagramme ouvre un menu contextuel avec "Show depends on", "Show supports", "Hide", et bloque le menu natif du navigateur.
- [ ] "Show depends on"/"Show supports" ajoutent les bancs et arêtes correspondants sans appel réseau supplémentaire, en couleur cohérente avec la légende existante.
- [ ] Un même banc n'apparaît jamais comme deux nœuds distincts, même atteint par plusieurs chemins d'expansion différents.
- [ ] "Hide" retire le nœud cliqué et ses arêtes directes du diagramme, sans erreur ni nœud fantôme.
- [ ] Le graphe reste correctement disposé (ELK) après une ou plusieurs expansions successives.
- [ ] Survol, clic gauche (aperçu photo), légende togglable et drag-and-drop continuent de fonctionner sur un graphe étendu à plusieurs niveaux.
- [ ] `npm run build` passe sans erreur ; aucune régression sur `/`, `/map`, `/labtestmean`, `/radar`, `/health`.
