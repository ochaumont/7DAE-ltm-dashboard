# UI Component Specification — WpHierarchySvg

> Specification for the SVG-based work package hierarchy visualization.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | WpHierarchySvg |
| File Path | src/components/ui/WpHierarchySvg.tsx |
| Type | Domain-specific |
| Complexity | Complex (248 lines) |
| Status | Stable |

---

## 2. Purpose

WpHierarchySvg renders an SVG tree diagram of a project and its descendant work packages. It computes a tree layout from a flat list of projects, draws connector lines between parent and child nodes, and displays each node as a rounded rectangle with the project name and manager name. The root project is visually highlighted with an Airbus-branded color scheme.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| projet | `Projet` | Root project (highlighted with blue bg and navy border) |
| wpDescendants | `Projet[]` | All descendant work packages (flat list; tree is built from parentId) |
| ressources | `Ressource[]` | All resources (used to look up manager names by chefDeProjetId) |

### 3.2 Internal Types

```typescript
interface TreeNode {
  projet: Projet;
  children: TreeNode[];
  x: number;         // center x position
  y: number;         // top y position
  subtreeWidth: number;
}
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Single node | Root project only, no connectors | `wpDescendants` is empty |
| Tree | Full hierarchy with connectors | `wpDescendants` has items |

---

## 5. Behavior

### 5.1 Layout Algorithm (3-pass)

**Pass 1 — Build tree:** Create `TreeNode` for each project, link children to parents via `parentId`. Sort children alphabetically by `nom`.

**Pass 2 — Compute widths (bottom-up):** `computeSubtreeWidth()` recursively calculates the horizontal space each subtree needs. A leaf takes `NODE_W` (180px). A parent takes the max of `NODE_W` or the sum of its children's widths plus gaps.

**Pass 3 — Assign positions (top-down):** `assignPositions()` centers each node within its allocated subtreeWidth. Children are laid out left-to-right, each getting their subtreeWidth of horizontal space.

### 5.2 Layout Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| NODE_W | 180px | Node rectangle width |
| NODE_H | 56px | Node rectangle height |
| H_GAP | 24px | Horizontal gap between sibling nodes |
| V_GAP | 48px | Vertical gap between parent and child levels |
| PAD | 16px | Padding around the entire SVG |
| BORDER_RADIUS | 8px | Node corner radius |

### 5.3 Node Display

Each node displays two lines of text:
- **Line 1** (y+22): Project display name, truncated to 20 characters, font-size 13, bold.
- **Line 2** (y+40): Manager name (from `chefDeProjetId` lookup), truncated to 22 characters, font-size 11, gray.

A `<title>` element provides the full untruncated name and manager as a tooltip.

### 5.4 Connector Lines

SVG `<path>` elements connect parent to child nodes. Each connector:
1. Goes vertically down from parent bottom center to the midpoint between levels.
2. Goes horizontally to the child's center x.
3. Goes vertically down to the child's top.

Format: `M parentX,parentBottom V midY H childX V childTop`

### 5.5 Internal State

This component has no internal state. All layout is computed via `useMemo`.

---

## 6. Visual Specification

### 6.1 Layout

```
         ┌──────────────────┐
         │   Root Projet    │  <- light blue bg (#e6f5fc), navy border (#00205B), 2px
         │   Manager Name   │
         └────────┬─────────┘
              ┌───┴───┐
         ┌────┴────┐ ┌┴────────┐
         │  WP 1   │ │  WP 2   │  <- white bg, gray border (#d1d5db), 1px
         │ Manager │ │ Manager │
         └─────────┘ └─────────┘
```

### 6.2 Styling

| Element | Value |
|---------|-------|
| Root node fill | `#e6f5fc` (Airbus light blue) |
| Root node stroke | `#00205B` (Airbus navy), width 2 |
| Child node fill | `#ffffff` (white) |
| Child node stroke | `#d1d5db` (gray-300), width 1 |
| Connector lines | `#9ca3af` (gray-400), width 1.5 |
| Name text | font-size 13, font-weight 600, fill `#111827` |
| Manager text | font-size 11, fill `#6b7280` |

---

## 7. Usage Examples

### 7.1 In WorkpackagesTab

```tsx
<WpHierarchySvg
  projet={currentProject}
  wpDescendants={workPackages}
  ressources={allRessources}
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| getProjetDisplayName | Internal | Formats project display name from constants.ts |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Tooltip | `<title>` element on each node group provides full name + manager on hover |
| Container | `overflow-x-auto` allows horizontal scrolling for wide trees |
| SVG | `xmlns` attribute set, `className="mx-auto"` for centering |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop | SVG centered horizontally, full width as needed |
| Tablet/Mobile | Horizontal scroll via `overflow-x-auto` container |

---

## 11. Known Limitations

- No interactivity (no click, no drag, no zoom).
- Text truncation is character-based (not pixel-based), may not be perfectly accurate for all fonts.
- SVG dimensions are computed from the tree layout; very wide trees may require significant horizontal scrolling.
- No animation on expand/collapse (tree is rendered in full).
- Manager lookup uses `chefDeProjetId`; displays "---" if the resource is not found.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Project detail > WorkpackagesTab | Work package hierarchy visualization |
