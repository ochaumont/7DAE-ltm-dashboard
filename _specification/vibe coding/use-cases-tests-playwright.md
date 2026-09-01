# Feature Spec: Cas d'usage prioritaires à tester avec Playwright

## Summary
- Playwright est installé (`playwright.config.ts`, `e2e/smoke.spec.ts` — 2 tests de fumée : `/health`, nav principale visible).
- Cette spec liste et priorise les **cas d'usage** qui méritent un test E2E et/ou une capture de régression visuelle, pour guider l'écriture des prochains tests plutôt que de les improviser au fil de l'eau.
- L'appli étant très visuelle (carte, graphe interactif, thème clair/sombre) et peu porteuse de logique métier complexe, la priorité va aux **parcours utilisateur** et aux **captures visuelles**, pas à des assertions de calcul.

## Motivation
- Le Quality Gate SonarQube local est actuellement bloqué uniquement sur `new_coverage` (0%, seuil 80%) — aucun test n'existe au-delà des 2 tests de fumée.
- Plusieurs refactors récents (filtres du catalogue, construction du graphe de dépendances, adapter backend) n'ont été vérifiés que manuellement, sans filet automatisé.
- Sans liste priorisée, le risque est d'écrire des tests faciles mais peu utiles (ex. re-tester la nav) plutôt que ceux qui couvrent les parcours réellement fragiles (graphe interactif, sauvegarde locale, export).

## Décisions (arbitrées)
- **Un cas d'usage = un parcours utilisateur complet**, pas un test unitaire de composant isolé (cohérent avec le choix déjà fait de privilégier Playwright sur Vitest pour cette appli).
- **Deux types de test par cas d'usage**, à choisir selon sa nature :
  - **Fonctionnel** (assertions sur le DOM/état après interaction) — pour tout ce qui a un résultat vérifiable sans jugement visuel (ex. "le filtre réduit la liste à N résultats").
  - **Visuel** (`toHaveScreenshot()`, clair + sombre) — pour tout ce dont le risque principal est un rendu cassé (mise en page, thème, carte, graphe).
  - Certains cas d'usage méritent les deux.
- **Priorité 1 (à couvrir en premier)** : parcours qui, s'ils cassent, ne sont pas détectés autrement (pas d'erreur console/build) et/ou touchent une fonctionnalité complexe récemment modifiée.
- **Hors périmètre pour l'instant** : tests contre un vrai backend `atom-synchronizer-dev` de bout en bout (nécessiterait un jeu de données de test stable) — les cas d'usage listés ci-dessous doivent rester robustes même backend down/indisponible quand c'est possible, ou sont explicitement marqués comme nécessitant des données réelles.

## Requirements

### Functional Requirements — Cas d'usage par priorité

#### Priorité 1 — parcours critiques, logique non triviale
1. **Recherche et sélection dans le combobox de bancs** (`/depgraph`, `BenchCombobox`) — taper un nom filtre la liste en direct, sélectionner un résultat l'ajoute comme racine du graphe.
2. **Expansion via menu contextuel** (`/depgraph`, `NodeContextMenu`) — clic-droit sur un nœud → "Show depends on"/"Show supports"/"Show shared resources" ajoute les nœuds attendus, sans chevauchement visuel (lien parent-enfant visible) — c'est exactement le bug corrigé récemment (espacement `gapX`).
3. **Masquer un nœud** (`/depgraph`, menu contextuel "Hide") — le nœud et ses arêtes disparaissent.
4. **Sauvegarde et rechargement local d'un diagramme** (`/depgraph`, `SaveLoadControls`) — sauvegarder un diagramme construit, le recharger, vérifier que nœuds/positions/liens sont identiques.
5. **Export puis import d'un diagramme** — télécharger un fichier de sauvegarde, l'importer, vérifier qu'il apparaît dans la liste avec le bon contenu.
6. **Filtrage du catalogue** (`/`, `FilterBar`/`FilterSheet`) — chaque filtre (photo, quality seal, type, programme, complexité, portfolio, recherche texte) réduit la liste de façon vérifiable ; combinaison de plusieurs filtres.
7. **Persistance des filtres à la navigation** — filtrer, ouvrir une fiche détail, revenir en arrière : les filtres sont conservés ; revenir via le menu "Catalogue" : les filtres sont réinitialisés (comportement documenté et volontaire).
8. **Pagination du catalogue** — changer de page met à jour l'URL (`?page=N`) et le contenu affiché.

#### Priorité 2 — visuel et thème
9. **Bascule clair/sombre** — capture d'écran du catalogue, de la fiche détail, et de `/depgraph` en clair puis en sombre (régression visuelle).
10. **Rendu de `/map`** — la carte MapLibre s'affiche avec les marqueurs des sites connus (capture visuelle, tolérante au rendu WebGL qui peut varier légèrement).
11. **Rendu de `/depview`** — disposition circulaire, survol d'un banc met en évidence ses liens entrants/sortants (capture avant/après survol).
12. **Réglages d'affichage du graphe** (`DisplaySettingsControl`) — changer la largeur des cartes et les champs visibles change effectivement le rendu (capture visuelle avant/après).

#### Priorité 3 — parcours secondaires
13. **Export PDF du catalogue filtré** — déclencher l'export, vérifier qu'un fichier est généré (sans valider le contenu visuel du PDF, hors de portée de Playwright standard).
14. **Fiche détail d'un banc** (`/labtestmean?id=`) — galerie photo, timeline de cycle de vie, informations d'accès s'affichent pour un id connu.
15. **Écran d'erreur backend down** — simuler une réponse réseau en échec (`page.route`) et vérifier que l'écran d'erreur convivial (`app/error.tsx`) s'affiche au lieu d'un crash.
16. **Liste des bancs masquables sur `/depview`** (`BenchVisibilityList`) — décocher un banc le masque du rendu circulaire, "Tout désélectionner"/"Tout sélectionner" fonctionnent.

### Non-Functional Requirements
- Chaque test doit rester **stable sans dépendre de données backend spécifiques** quand c'est possible (utiliser `page.route()` pour mocker les réponses `atom-synchronizer-dev` plutôt que dépendre d'un jeu de données réel) — sauf mention contraire (ex. cas d'usage 14 qui a besoin d'un id réel si pas mocké).
- Les captures de régression visuelle doivent couvrir **systématiquement les deux thèmes** (clair/sombre), cohérent avec l'axe de theming documenté dans `CLAUDE.md`.
- Un cas d'usage = un fichier ou groupe de tests nommé clairement par parcours (pas par composant technique), pour rester lisible par quelqu'un qui ne connaît pas l'implémentation.

## Scope

### In Scope
- La priorisation et description des 16 cas d'usage ci-dessus.
- La distinction fonctionnel vs visuel par cas d'usage.

### Out of Scope
- L'écriture effective des tests (fera l'objet d'une implémentation séparée, lot par lot selon la priorité).
- Le mocking détaillé des réponses backend (à concevoir au moment d'écrire chaque test).
- Les tests de charge/performance.
- La couverture Vitest des fonctions pures (`lib/`) — décision déjà prise de la traiter séparément.

## Affected Areas
- **Créer** : de nouveaux fichiers sous `e2e/`, un par groupe de cas d'usage (ex. `e2e/depgraph.spec.ts`, `e2e/catalogue-filters.spec.ts`, `e2e/theme.spec.ts`, `e2e/depview.spec.ts`).
- **Non touché** : aucun code applicatif à modifier pour cette spec — uniquement de nouveaux tests.

## Edge Cases
- **Carte MapLibre (cas d'usage 10)** : le rendu WebGL peut légèrement varier entre environnements (CI vs local) — prévoir une tolérance de diff plus large que pour du DOM classique, ou se limiter à des assertions structurelles (nombre de marqueurs) plutôt qu'à un screenshot strict si trop instable.
- **Export PDF (cas d'usage 13)** : Playwright ne peut pas "voir" le contenu visuel d'un PDF nativement — se limiter à vérifier le déclenchement du téléchargement, pas le rendu.
- **Diagrammes sauvegardés en `localStorage` (cas d'usage 4-5)** : chaque test doit nettoyer son propre état (`localStorage`) avant/après pour ne pas polluer les tests suivants.

## Open Questions
- Faut-il mocker systématiquement le backend `atom-synchronizer-dev` pour tous les cas d'usage de Priorité 1, ou est-il acceptable de dépendre d'une instance locale démarrée pour certains (plus réaliste mais plus fragile en CI) ?
non ne mocke pas, pas contre les tests doivent prendre en compte le fait que les données sont différentes d'un instant à un autre;

- Quel budget de temps/lots pour l'implémentation — tout d'un coup, ou un lot par priorité (1 puis 2 puis 3) comme pour les corrections SonarQube ? lot par priorité

## Acceptance Criteria
- [ ] Les 16 cas d'usage sont listés avec leur priorité et leur type de test (fonctionnel/visuel/les deux).
- [ ] Chaque cas d'usage de Priorité 1 est implémentable sans dépendre d'un jeu de données backend fragile (mock ou état local uniquement), sauf exception documentée.
- [ ] La spec sert de base directe à un futur plan d'implémentation (Plan mode) sans nécessiter de nouvelle clarification sur le *quoi* tester.
