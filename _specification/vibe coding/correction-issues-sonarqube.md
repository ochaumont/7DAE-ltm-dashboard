# Feature Spec: Analyse et correction des issues SonarQube (sans régression)

## Summary
- L'analyse SonarQube locale (`http://localhost:9000/dashboard?id=ltm-dashboard`) remonte **202 issues ouvertes** : 193 `CODE_SMELL` + 9 `BUG` (0 `VULNERABILITY`). Le chiffre "193" vu par l'utilisateur correspond exactement au nombre de `CODE_SMELL`.
- Sévérités : 138 MINOR, 53 MAJOR, 11 CRITICAL, 0 BLOCKER.
- Objectif : trier ces issues par risque de régression et par volume, puis les corriger par lots vérifiables, en commençant par les changements sans impact comportemental.

## Motivation
- Dette technique mesurée par Sonar : ~1007 minutes (~16,8h) d'effort estimé cumulé.
- 3 règles (`S6759`, `S7764`, `S6819`) représentent à elles seules 117 des 202 issues (58%) — un gain rapide et homogène est possible sans toucher à la logique métier.
- Les 9 `BUG` sont plus sensibles : 3 sont `CRITICAL` (`S2871`, tri de tableau sans fonction de comparaison) et peuvent changer un ordre d'affichage réel si mal corrigés ; 6 sont `MINOR` mais touchent l'accessibilité clavier (`S1082`).

## Décisions (arbitrées)
- **Découpage par lot de règle**, pas fichier par fichier : une règle = un pattern de correction homogène, plus facile à revue et à tester qu'un mélange.
- **Ordre de traitement par risque croissant** : d'abord les règles purement syntaxiques/stylistiques (aucun changement de comportement runtime), puis les règles qui touchent des interactions utilisateur (clavier, ARIA), puis les 3 `BUG` `CRITICAL` en dernier avec vérification manuelle dédiée.
- **Aucune correction automatique en masse sans relecture** : même quand Sonar propose un "quick fix", chaque lot est appliqué puis vérifié (build + lint + test manuel de l'écran concerné) avant de passer au suivant.
- **Re-scan Sonar après chaque lot** pour confirmer la baisse du nombre d'issues et l'absence de nouvelle issue introduite.

## Requirements

### Functional Requirements

#### 1. Lot 1 — Corrections stylistiques sans risque (117 issues, 3 règles)
- `S6759` — *"React props should be read-only"* (85 occurrences) : typer les props des composants en `Readonly<Props>` / `readonly`. Changement de type uniquement, aucun impact runtime.
- `S7764` — *"Use globalThis instead of window/self/global"* (17 occurrences) : remplacement mécanique d'identifiant global.
- `S6819` — *"Prefer tag over ARIA role"* (15 occurrences) : remplacer un `role="..."` par la balise HTML sémantique équivalente quand c'est possible sans changer le style ni le comportement.

#### 2. Lot 2 — Lisibilité et structure (règles restantes hors accessibilité clavier/ARIA interactive)
- `S3358` (9, ternaires imbriqués), `S7735` (8, conditions négatives avec `else`), `S7761` (7, accès `dataset`), `S3776` (5, complexité cognitive), `S4325` (4, casts/assertions non-null redondants), `S2871` hors les 3 `BUG` (tri sans fonction de comparaison sur les occurrences restantes en `CODE_SMELL`), et les règles à faible volume (≤3 occurrences chacune).
- Chaque correction reformule sans changer la logique (ex. extraire une fonction pour réduire la complexité cognitive plutôt que supprimer un cas).

#### 3. Lot 3 — Accessibilité interactive (`S1082`, `S6479`, `S6847`, `S6842`)
- `S1082` (6, dont les 6 classés `BUG` MINOR) : éléments cliquables sans gestionnaire clavier — ajouter `onKeyDown`/`tabIndex`/rôle bouton ou remplacer par un vrai `<button>`. Nécessite vérification manuelle (le clic à la souris ne doit pas changer de comportement, le focus clavier doit fonctionner).
- `S6479` (9, index de tableau comme `key` React) : nécessite un identifiant stable existant dans les données pour éviter de casser le rendu (réordonnancement, animations) — à vérifier au cas par cas, pas de remplacement automatique par l'index+1.
- `S6847` / `S6842` (4+3, gestionnaires d'événements ou rôles ARIA sur éléments non interactifs) : même prudence que `S1082`.

#### 4. Lot 4 — Les 3 `BUG` CRITICAL (`S2871`, tri de tableau)
- Fichiers concernés : `components/interaction/DependencyGraph.tsx:329`, `lib/labtestmeans.ts:102` et `:128`.
- Ajouter une fonction de comparaison explicite (`.localeCompare`) au lieu du tri par défaut (lexicographique sur la représentation string).
- **Risque identifié** : le tri par défaut de `Array.prototype.sort()` peut déjà produire un ordre "presque correct" par coïncidence sur les données actuelles ; corriger la fonction de comparaison peut changer visiblement l'ordre affiché (liste de bancs, nœuds du graphe). Chaque correction de ce lot doit être vérifiée visuellement sur l'écran concerné avant/après.

### Non-Functional Requirements
- **Aucune régression fonctionnelle** : après chaque lot, `npm run build` et `npm run lint` doivent passer, et les écrans touchés doivent être vérifiés manuellement (catalogue, `/depgraph`, `/depview`, export PDF, dialogues selon le lot).
- **Traçabilité** : idéalement un commit par lot (voire par règle pour les lots 3 et 4), pour pouvoir isoler et annuler facilement une correction problématique.
- **Vérification Sonar** : relancer `./sonar.sh` après chaque lot pour confirmer la baisse du compteur d'issues et l'absence de nouvelle issue.

## Scope

### In Scope
- Les 202 issues actuellement ouvertes sur le projet `ltm-dashboard` (composant "overall code", pas seulement le code nouveau).
- Un plan de traitement par lots, avec critère de vérification par lot.

### Out of Scope
- Configuration du Quality Gate SonarQube (seuils, blocage de pipeline) — non demandé ici.
- Ajout de tests automatisés pour couvrir les zones corrigées (le projet n'a pas de suite de tests aujourd'hui — cf. `CLAUDE.md`) ; la vérification reste manuelle.
- Les nouvelles issues qui apparaîtraient sur du code futur après cette correction.

## Affected Areas
- **Fichiers les plus concentrés en issues** (à traiter en priorité pour le volume) : `components/interaction/DependencyGraph.tsx` (16), `components/interaction/SaveLoadControls.tsx` (15), `components/pdf/icons.tsx` (15), `components/interaction/BenchCombobox.tsx` (7), `components/pdf/BenchDetailPage.tsx` (7), `app/error.tsx` (6), `components/CatalogueClient.tsx` (6), `lib/interactionSaves.ts` (6).
- **Fichiers avec un `BUG` CRITICAL** : `components/interaction/DependencyGraph.tsx`, `lib/labtestmeans.ts`.
- Plus largement, les issues sont réparties sur ~70 fichiers de `components/` et `lib/` — voir le détail par règle dans les Requirements ci-dessus plutôt qu'une liste exhaustive fichier par fichier.

## Edge Cases
- **`S6479` (index comme clé React)** : si aucun identifiant stable n'existe dans les données de la liste concernée, ne pas corriger à l'aveugle — documenter le cas comme non corrigible sans changement de modèle de données plutôt que de forcer une fausse clé stable.
- **`S2871` (tri) sur `DependencyGraph.tsx`** : si l'ordre actuel (issu du tri par défaut) est en fait celui attendu visuellement (ex. par coïncidence alphabétique), vérifier le rendu du graphe avant/après pour un jeu de bancs représentatif avant de valider.
- **`S1082` (clavier) sur des éléments avec du style visuel de clic** (`SaveLoadControls.tsx`, `TreeFilter.tsx`) : s'assurer que l'ajout d'un focus/tabindex ne casse pas la mise en page (halo de focus, ordre de tabulation) — vérifier en clair et en sombre (cf. axe de theming `CLAUDE.md`).

## Open Questions
- Faut-il traiter les 202 issues en une seule fois ou seulement un sous-ensemble prioritaire dans un premier temps (ex. lots 1+2 seulement, en laissant les lots 3+4 pour un cycle ultérieur) ?
=> lot 1 et 2, et pause pout vérifier que tout fonctionne

- Un commit par lot est-il suffisant, ou faut-il une revue/PR séparée par lot pour faciliter un rollback ciblé ? je ferai les commits


## Acceptance Criteria
- [ ] Chaque lot (1 à 4) est corrigé et vérifié indépendamment (build + lint + vérification manuelle des écrans concernés).
- [ ] Un re-scan SonarQube après chaque lot confirme la baisse du nombre d'issues correspondant, sans nouvelle issue introduite.
- [ ] Les 3 `BUG` CRITICAL (`S2871`) sont corrigés en dernier, avec vérification visuelle explicite de l'ordre affiché avant/après sur les écrans concernés.
- [ ] Aucune régression fonctionnelle constatée sur le catalogue, la carte, la fiche détail, `/depgraph`, `/depview` et l'export PDF après l'ensemble des lots.
- [ ] Le nombre total d'issues ouvertes sur le dashboard Sonar diminue de manière mesurable et traçable (lot par lot).
