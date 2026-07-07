# System Design: FR-02 - Reusable Drawn-Signature Component

## 1. Architectural Overview

A self-contained, backend-independent, reusable canvas signature pad in the shared library,
consumed later by the signing dialog (FR-03). No HTTP, no store — pure presentational component
with an imperative export API. The component is ALREADY IMPLEMENTED in the working tree at
`projects/shared/src/shared/components/signature-pad/signature-pad.component.ts`; this FR
finalizes it (labels + barrel export) and documents the contract.

## 2. Requirements → design mapping

| Requirement | Mechanism |
|---|---|
| Mouse, finger and stylus drawing | Pointer Events (`pointerdown/move/up/cancel`) + `setPointerCapture` — one code path for all input types |
| Page must not scroll while drawing | Tailwind `touch-none` (`touch-action: none`) on the canvas + `preventDefault()` on down/move |
| Crisp strokes on high-DPI displays | Canvas backing store sized `cssSize × devicePixelRatio`, context transform `setTransform(dpr,0,0,dpr,0,0)`; drawing coordinates stay in CSS pixels |
| Survives resize/orientation change | Strokes retained as `Point[][]` in CSS coordinates; `ResizeObserver` re-sizes the backing store and replays all strokes |
| Clear button; submit disabled while empty | `isEmpty` signal + `emptyChanged` output; `clear()` resets strokes and repaints |
| Export base64 PNG, keep data-URI prefix | `toDataUrl(): string | null` → `canvas.toDataURL('image/png')` (returns `null` when empty); prefix `data:image/png;base64,` is NOT stripped — backend accepts both |

## 3. Component Contract

* Selector `app-signature-pad`; standalone, `OnPush`.
* Inputs: `height` (px, default 200), `disabled` (default false — blocks new strokes and Clear).
* Outputs: `emptyChanged: boolean` (emitted on first stroke and on clear).
* Public members: `isEmpty: Signal<boolean>` (writable signal exposed read-style),
  `toDataUrl(): string | null`, `clear(): void`. Consumers grab the instance via `viewChild`.
* Single active pointer at a time (`activePointerId` guard) — no multi-touch scribbles.
* Stroke rendering: round caps/joins, 2.5px width, slate-800; single-point taps render a dot.

## 4. Remaining work in this FR

1. `shared/constant/labels.ts`: add `SignatureClear = $localize`Clear`` and
   `SignatureHint = $localize`Sign here`` (component template references
   `Labels.SignatureClear` / `Labels.SignatureHint`).
2. `projects/shared/src/public-api.ts`: add
   `export * from './shared/components/signature-pad/signature-pad.component';` in the shared
   UI components block.
3. Verify lint + admin/operator dev builds compile with the export in place.

## 5. Non-Functional Decisions

* No tests (MVP rule); no i18n extraction run.
* Inside shared library the component imports `Labels` via relative path
  (`../../constant/labels`) per the shared-import lint rule.
* No third-party signature library — ~180 lines of dependency-free canvas code keeps bundle size
  flat and avoids retina/scroll bugs found in wrapper libs.
