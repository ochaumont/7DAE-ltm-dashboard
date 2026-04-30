# Data Model — Entity Catalog

> Complete reference of all entities in the application: fields, types, relationships, and constraints.

---

## 1. Overview

### 1.1 Entity Count

| Category | Count |
|----------|-------|
| Core entities | _e.g. 15_ |
| Join/association entities | _e.g. 6_ |
| **Total** | _e.g. 21_ |

### 1.2 Entity Relationship Diagram

<!-- High-level ERD showing all entities and their relationships -->

```
e.g.
Product (1) ──► (N) Release (1) ──► (N) Deliverable (1) ──► (N) Assignment
Project (1) ──► (N) Milestone
Project (1) ──► (N) ProjectPhase
Project (M) ◄──► (N) Deliverable  (via ProjectDeliverable)
ProjectPhase (M) ◄──► (N) Deliverable  (via PhaseDeliverable)
Milestone (M) ◄──► (N) ProjectPhase  (via MilestonePhase)
Resource (1) ──► (N) LeavePeriod
Resource (1) ◄── (N) TeamMember ──► (1) Project/Product
```

---

## 2. Base Entity

<!-- Common fields inherited by all entities -->

| Field | Type | Generated | Description |
|-------|------|-----------|-------------|
| _id_ | _UUID_ | _Auto_ | _Unique identifier_ |
| _createdAt_ | _DateTime_ | _Auto_ | _Creation timestamp_ |
| _updatedAt_ | _DateTime_ | _Auto_ | _Last update timestamp_ |

**Annotations**: _e.g. @Data @SuperBuilder @NoArgsConstructor (Lombok)_

---

## 3. Core Entities

### 3.1 [Entity Name]

<!-- Repeat this block for each entity -->

| Field | Value |
|-------|-------|
| **Class** | _e.g. Produit_ |
| **Table / File** | _e.g. produits.json_ |
| **API Base** | _e.g. /api/produits_ |
| **Description** | _One-line description_ |

**Fields:**

| Field | Type | Required | Default | Description | Validation |
|-------|------|----------|---------|-------------|------------|
| _name_ | _String_ | _Yes_ | — | _Product name_ | _Not blank_ |
| _type_ | _TypeProduit_ | _Yes_ | — | _SOFTWARE or HARDWARE_ | _Enum_ |
| _status_ | _StatutProjet_ | _Yes_ | _INITIATION_ | _Current status_ | _Enum_ |
| _description_ | _String_ | _No_ | _null_ | _Free text description_ | — |
| _origine_ | _OrigineProduit_ | _Yes_ | _CREATED_ | _IMPORTED or CREATED_ | _Enum_ |

**Relationships:**

| Relation | Target Entity | Type | Via | Cascade |
|----------|--------------|------|-----|---------|
| _releases_ | _Release_ | _1:N_ | _release.produitId_ | _e.g. Cascade delete_ |
| _teamMembers_ | _ProduitTeamMember_ | _1:N_ | _member.produitId_ | _e.g. Cascade delete_ |

**Business Rules:**
- _e.g. BR-07: Cannot mark Release as LIVREE unless all livrables are TERMINE/ANNULE_

---

<!-- TEMPLATE — Copy the block above for each entity -->

---

## 4. Join / Association Entities

<!-- Entities that implement M:N relationships -->

### 4.1 [Join Entity Name]

| Field | Value |
|-------|-------|
| **Class** | _e.g. ProjetLivrable_ |
| **Purpose** | _Links Project to Deliverable (M:N association)_ |

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _projetId_ | _UUID_ | _Yes_ | _FK to Projet_ |
| _livrableId_ | _UUID_ | _Yes_ | _FK to Livrable_ |

**Uniqueness**: _e.g. Unique on (projetId, livrableId)_

**Cascade**: _e.g. Deleted when parent Projet is deleted_

---

## 5. Entity Dependency Graph

<!-- Which entities must exist before others can be created -->

```
e.g.
Level 0 (no dependencies):  Resource, UserRole
Level 1:                     Product, Project
Level 2:                     Release (needs Product), Milestone (needs Project)
Level 3:                     Deliverable (needs Release OR Project)
Level 4:                     Assignment (needs Deliverable + Resource)
```

---

## 6. Field Type Reference

<!-- Common field types used across entities -->

| Type | Java Type | TypeScript Type | JSON Format |
|------|-----------|-----------------|-------------|
| _UUID_ | `UUID` | `string` | `"550e8400-e29b..."` |
| _String_ | `String` | `string` | `"text"` |
| _Date_ | `LocalDate` | `string` | `"2026-03-15"` |
| _DateTime_ | `LocalDateTime` | `string` | `"2026-03-15T10:30:00"` |
| _Integer_ | `Integer` | `number` | `42` |
| _Decimal_ | `BigDecimal` | `number` | `75.5` |
| _Boolean_ | `Boolean` | `boolean` | `true` |
| _Enum_ | `EnumType` | `union type` | `"VALUE"` |
| _UUID List_ | `List<UUID>` | `string[]` | `["id1", "id2"]` |

---

## 7. Complete Entity List

<!-- Quick reference table of all entities -->

| # | Entity | Type | Fields | Relationships | API |
|---|--------|------|--------|---------------|-----|
| 1 | | _Core / Join_ | _count_ | _list_ | _/api/..._ |
| 2 | | | | | |
