# UI Component Specification — DiagramExporter

> Specification for the image export component that captures DOM elements as PNG/JPG.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | DiagramExporter |
| File Path | src/components/ui/DiagramExporter.tsx |
| Type | Generic |
| Complexity | Moderate (121 lines) |
| Status | Stable |

---

## 2. Purpose

DiagramExporter renders a download button that captures a target DOM element as a PNG or JPG image using the `html-to-image` library. It supports configurable quality presets (pixel ratios) and exposes a programmatic `exportAsBlob()` method via `useImperativeHandle` for parent components that need to trigger export without a button click.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| targetRef | `RefObject<HTMLDivElement \| null>` | Ref to the DOM element to capture |

### 3.2 Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| filename | `string` | `"diagram"` | Base filename without extension |
| format | `ImageFormat` | `"png"` | Image format: "png" (lossless) or "jpg" (lossy, 0.95 quality) |
| quality | `ImageQuality` | `"medium"` | Pixel ratio preset: "low" (1x), "medium" (2x), "high" (4x) |

### 3.3 Exported Types and Constants

```typescript
export type ImageFormat = "png" | "jpg";
export type ImageQuality = "low" | "medium" | "high";

export const IMAGE_FORMATS: ImageFormat[] = ["png", "jpg"];
export const IMAGE_QUALITIES: ImageQuality[] = ["low", "medium", "high"];
export const QUALITY_PIXEL_RATIO: Record<ImageQuality, number> = { low: 1, medium: 2, high: 4 };

export interface DiagramExporterHandle {
  exportAsBlob: (format: ImageFormat) => Promise<Blob>;
}
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Idle | Download icon button | Default state |
| Exporting | Spinner icon, button disabled | Export in progress |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Export | Click download button | Captures target element, triggers browser download |
| Programmatic export | Parent calls `ref.exportAsBlob(format)` | Returns Blob without triggering download |

### 5.2 Capture Process

1. Gets the target element from `targetRef`.
2. Temporarily sets `overflow: visible` and explicit `width` on the element to capture full scrollable content.
3. Calls `toPng()` or `toJpeg()` from `html-to-image` with options:
   - `cacheBust: true`
   - `backgroundColor: "#ffffff"`
   - `width: el.scrollWidth`
   - `pixelRatio`: from quality preset
   - `quality: 0.95` (JPG only)
4. Converts the data URL to a Blob via `dataUrlToBlob()`.
5. Restores original element styles in `finally` block.
6. For button export: creates an `<a>` element, sets `href` to blob URL, triggers click, revokes URL.

### 5.3 Internal State

| State | Type | Purpose |
|-------|------|---------|
| exporting | `boolean` | Whether an export is in progress |

### 5.4 Imperative Handle

The component uses `forwardRef` + `useImperativeHandle` to expose:
```typescript
{ exportAsBlob: (format: ImageFormat) => Promise<Blob> }
```
This allows parent components to programmatically export without rendering the button.

---

## 6. Visual Specification

### 6.1 Layout

```
[Download icon button]  <- single icon button, inline
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Button | `p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50` |
| Download icon | `Download` from lucide, `h-4 w-4` |
| Loading icon | `Loader2` from lucide, `h-4 w-4 animate-spin` |

---

## 7. Usage Examples

### 7.1 Basic Usage

```tsx
const containerRef = useRef<HTMLDivElement>(null);

<div ref={containerRef}>
  <WpHierarchySvg ... />
</div>
<DiagramExporter targetRef={containerRef} filename="hierarchy" />
```

### 7.2 With Programmatic Export

```tsx
const exporterRef = useRef<DiagramExporterHandle>(null);

<DiagramExporter ref={exporterRef} targetRef={svgRef} format="png" quality="high" />

// Later:
const blob = await exporterRef.current?.exportAsBlob("png");
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| html-to-image | External | `toPng`, `toJpeg` functions for DOM-to-image conversion |
| lucide-react | External | Download, Loader2 icons |
| react-i18next | External | Button tooltip translation |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Button | `title` attribute for tooltip |
| Disabled state | `disabled` attribute + `opacity-50` styling during export |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| All | Single icon button, constant size |

---

## 11. Known Limitations

- Captures only the visible DOM element content (with overflow:visible workaround for scrollable areas).
- White background is forced (`#ffffff`); transparent backgrounds not supported.
- Error during capture is silently swallowed (catch block is empty).
- JPG quality is hardcoded to 0.95.
- Element style mutation during capture (overflow/width) could cause a brief visual flash.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Project detail > WorkpackagesTab | Export WP hierarchy SVG diagram |
