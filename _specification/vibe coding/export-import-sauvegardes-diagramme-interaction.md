# Feature Spec: Export et import des sauvegardes de diagramme d'interaction

## Summary
- Les sauvegardes du diagramme `/depgraph` (voir `menu-actions-sauvegarde-diagramme-interaction.md`, `sauvegarde-locale-diagramme-interaction.md`) vivent uniquement dans le `localStorage` du navigateur — elles ne peuvent pas être transmises d'un utilisateur ou d'un poste à un autre.
- Cette feature ajoute deux nouvelles actions au sous-menu "..." existant : **Export** (télécharge la sauvegarde active, ou une sauvegarde choisie, sous forme de fichier) et **Import** (charge un fichier précédemment exporté et l'ajoute à la liste des sauvegardes locales).
- Objectif : permettre à un utilisateur de partager un diagramme (par email, Teams, clé USB, etc.) avec un collègue, qui peut ensuite l'importer et le retrouver dans sa propre liste "Load".

## Motivation
- Les diagrammes de dépendances construits sur `/depgraph` représentent un travail d'analyse (sélection de bancs, positionnement, liens) que les utilisateurs veulent aujourd'hui recréer manuellement pour chaque collègue à qui ils veulent le montrer, faute de pouvoir exporter le résultat.
- Le format de sauvegarde existant (`InteractionSave`, JSON sérialisable) se prête déjà bien à un export/import de fichier sans changement de structure.

## Requirements

### Functional Requirements

#### 1. Export d'une sauvegarde
- Une action "Export" est ajoutée au sous-menu "..." (aux côtés de Save / Save as new / Load), disponible dès qu'il y a une sauvegarde active pour le diagramme affiché.
- Déclenche le téléchargement d'un fichier contenant le contenu JSON de la sauvegarde active (même structure que celle stockée en `localStorage`).
- Le nom du fichier téléchargé reprend l'identifiant de la sauvegarde (ex. `<nom-de-la-sauvegarde>.json`).
- Il doit aussi être possible d'exporter une sauvegarde depuis la popup "Load" (qui liste déjà toutes les sauvegardes existantes), pas seulement la sauvegarde active — via une icône dédiée sur chaque ligne, à côté de l'icône de suppression déjà existante.

#### 2. Import d'une sauvegarde
- Une action "Import" est ajoutée au sous-menu "..." (toujours disponible, comme "Load").
- Ouvre un sélecteur de fichier standard du système d'exploitation ; l'utilisateur choisit un fichier `.json` exporté précédemment (par lui-même ou reçu d'un collègue).
- Le contenu du fichier est validé (structure attendue d'une `InteractionSave`, y compris les anciennes versions déjà supportées en lecture par `loadSave`) avant d'être ajouté à la liste locale des sauvegardes.
- Après import réussi, la nouvelle sauvegarde apparaît dans la popup "Load" et peut être chargée comme n'importe quelle autre sauvegarde.
- Un fichier invalide (JSON mal formé, structure inattendue) est rejeté avec un message d'erreur clair, sans modifier la liste des sauvegardes existantes.

#### 3. Gestion des conflits de nom
- Si le nom de la sauvegarde importée existe déjà dans la liste locale, l'utilisateur doit pouvoir choisir un nom différent avant l'import plutôt que d'écraser silencieusement une sauvegarde existante (contrairement à "Save", qui écrase sans confirmation une sauvegarde qu'on modifie soi-même).

### Non-Functional Requirements
- **Aucun appel backend** : l'export et l'import restent des opérations 100% locales au navigateur (fichier téléchargé/lu côté client), cohérent avec le fait que les sauvegardes elles-mêmes ne sont jamais envoyées au serveur.
- **Compatibilité ascendante** : un fichier exporté aujourd'hui doit rester important dans une version future de l'application (même garantie de compatibilité que les sauvegardes déjà stockées en `localStorage`, qui supportent la lecture de plusieurs versions historiques du format).

## Scope

### In Scope
- Action "Export" (sauvegarde active depuis le sous-menu "...", et n'importe quelle sauvegarde depuis la popup "Load").
- Action "Import" depuis le sous-menu "..." avec sélection de fichier, validation du contenu, et gestion des conflits de nom.
- Messages d'erreur en cas de fichier invalide.

### Out of Scope
- Partage automatique en ligne (lien partageable, envoi direct entre utilisateurs) — l'échange du fichier lui-même (email, messagerie, etc.) reste à la charge de l'utilisateur.
- Export ou import de plusieurs sauvegardes à la fois (un fichier = une sauvegarde).
- Fusion du contenu d'une sauvegarde importée avec une sauvegarde existante du même nom.
- Changement du format de sauvegarde existant (`InteractionSave`) au-delà de ce qui est nécessaire pour l'export/import.

## Affected Areas
- `components/interaction/SaveLoadControls.tsx` — ajout des actions "Export"/"Import" dans le sous-menu "...", ajout de l'icône d'export sur chaque ligne de la popup "Load", ajout du flux de sélection de fichier et de la popup de résolution de conflit de nom.
- `lib/interactionSaves.ts` — probablement une nouvelle fonction de validation du contenu d'un fichier importé (réutilisant la logique de compatibilité multi-versions déjà présente dans `loadSave`), et éventuellement une fonction utilitaire pour générer le nom de fichier d'export.

## Edge Cases
- **Import d'un fichier qui n'est pas un JSON valide** : message d'erreur clair, aucune sauvegarde ajoutée.
- **Import d'un JSON valide mais qui n'a pas la structure d'une `InteractionSave`** (champ manquant, mauvais type) : même traitement — rejet avec message d'erreur.
- **Import d'un fichier référençant des bancs qui n'existent plus dans le catalogue actuel** (banc supprimé/renommé côté backend depuis l'export) : la sauvegarde doit tout de même s'importer ; le comportement d'affichage d'un banc introuvable au chargement suit la logique déjà existante pour ce cas (nœud résolu comme "absent du catalogue"), sans changement introduit par cette feature.
- **Import d'un nom déjà existant** : l'utilisateur doit choisir un autre nom avant que l'import n'aboutisse (voir Requirement 3).
- **Échec du téléchargement du fichier d'export** (bloqué par le navigateur, etc.) : un message d'erreur discret doit apparaître, cohérent avec le traitement déjà existant des erreurs de sauvegarde (`saveError`, popup d'erreur flottante en haut à droite).

## Open Questions
- Aucune sauvegarde existante n'ayant encore ce format d'échange, faut-il un indicateur visuel dans le fichier exporté (ex. commentaire, métadonnée) qui identifie explicitement qu'il s'agit d'un export `/depgraph`, pour éviter qu'un utilisateur importe par erreur un fichier JSON sans rapport ? À trancher en phase de planification technique.
=> non pas besoin

## Acceptance Criteria
- [ ] Une action "Export" dans le sous-menu "..." télécharge la sauvegarde active sous forme de fichier `.json` nommé d'après son identifiant.
- [ ] Une icône d'export est disponible sur chaque ligne de la popup "Load", permettant d'exporter n'importe quelle sauvegarde existante (pas seulement l'active).
- [ ] Une action "Import" dans le sous-menu "..." ouvre un sélecteur de fichier et ajoute la sauvegarde importée à la liste locale après validation.
- [ ] Un fichier invalide (JSON mal formé ou structure inattendue) est rejeté avec un message d'erreur clair, sans effet de bord sur les sauvegardes existantes.
- [ ] Importer un nom déjà existant propose à l'utilisateur de choisir un nom différent plutôt que d'écraser silencieusement.
- [ ] Une sauvegarde importée apparaît et se charge normalement depuis la popup "Load", au même titre que les sauvegardes créées localement.
- [ ] `npm run build` passe sans erreur.
