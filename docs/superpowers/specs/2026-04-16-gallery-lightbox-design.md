# Gallery Lightbox Design

**Date:** 2026-04-16
**Status:** Approved

## Problem

The strain page gallery renders images as small 500×500 thumbnails in a grid with no way to view full-resolution images. Users can't appreciate the detail and quality of strain photography.

## Solution

Upgrade the existing thumbnail grid to be clickable, opening a full-screen lightbox overlay for viewing full-resolution images. Pure vanilla JS, zero dependencies.

## Gallery Grid Changes

- **Larger thumbnails** — serve at 600×600 WebP instead of 500×500
- **Hover effect** — subtle scale + brightness boost to signal clickability
- **Cursor pointer** on gallery images
- **Aspect ratio** — keep `aspect-ratio: 1` for uniform grid

No layout change to the grid itself.

## Lightbox Component (`src/components/ImageLightbox.astro`)

### Structure

- Fixed overlay covering viewport (`position: fixed; inset: 0; z-index: 1000`)
- Dark semi-transparent background (`rgba(0,0,0,0.95)`)
- Centered image: `max-width: 90vw; max-height: 90vh; object-fit: contain`
- Prev/next arrow buttons on left/right sides
- Close button top-right corner
- Image counter bottom center (e.g., "2 / 4")

### Interactions

- Click gallery thumbnail → open lightbox at that image's index
- Prev/next arrows → navigate between images
- Click close button or backdrop (outside image) → close lightbox
- Keyboard: `Escape` closes, `ArrowLeft`/`ArrowRight` navigates
- Body scroll locked while open (`overflow: hidden` on `<body>`)

### Styling

- Arrows and close button use `--accent` (#00ff88) on hover
- Smooth fade-in/fade-out via CSS opacity transition
- Controls white against dark backdrop
- All styles scoped inside component

### Image Sizing

| Context | Sanity URL params |
|---------|-------------------|
| Grid thumbnails | `width(600).height(600).format("webp")` |
| Lightbox full-res | `width(1600).format("webp")` — height unconstrained |

Height is unconstrained in lightbox so portrait images display at natural aspect ratio. Sanity CDN handles optimization.

## Component Interface

```typescript
// Props
images: Array<{ asset: SanityImageSource; alt?: string }>
```

The lightbox component renders a hidden overlay. Gallery images get `data-lightbox-index` attributes. The component's `<script>` listens for clicks on `[data-lightbox-index]` elements and manages overlay visibility.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ImageLightbox.astro` | **New** — lightbox overlay with inline script and scoped styles |
| `src/pages/strains/[...slug].astro` | Import lightbox, update gallery images to be clickable with `data-lightbox-index`, add hover styles, include lightbox component |

## What This Does NOT Do

- No external JS dependencies
- No changes to `global.css`
- No carousel/slider behavior
- No image preloading beyond browser defaults
- No touch/swipe gestures (keyboard + click only for v1)
