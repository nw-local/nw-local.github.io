# Gallery Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make strain gallery images clickable, opening a full-screen lightbox overlay for viewing full-resolution images with keyboard and click navigation.

**Architecture:** A new `ImageLightbox.astro` component renders a hidden overlay. Gallery thumbnails get `data-lightbox-index` attributes. The component's inline `<script>` listens for clicks on those elements and manages the overlay. All styles are scoped inside the component.

**Tech Stack:** Astro 6, vanilla JS, CSS transitions, Sanity image URL builder

---

### Task 1: Create `ImageLightbox.astro` component

**Files:**
- Create: `src/components/ImageLightbox.astro`

- [ ] **Step 1: Create the component with markup, styles, and script**

```astro
---
interface LightboxImage {
  url: string
  alt: string
}

interface Props {
  images: LightboxImage[]
}

const { images } = Astro.props;
---

{images.length > 0 && (
  <div id="lightbox" class="lightbox" aria-hidden="true">
    <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
    <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>
    <button class="lightbox-next" aria-label="Next image">&#8250;</button>
    <img class="lightbox-image" src="" alt="" />
    <div class="lightbox-counter"></div>
  </div>
)}

<script define:vars={{ images }}>
  function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const lightboxImage = lightbox.querySelector(".lightbox-image");
    const lightboxCounter = lightbox.querySelector(".lightbox-counter");
    const closeButton = lightbox.querySelector(".lightbox-close");
    const prevButton = lightbox.querySelector(".lightbox-prev");
    const nextButton = lightbox.querySelector(".lightbox-next");
    let currentIndex = 0;

    function showImage(index) {
      currentIndex = index;
      lightboxImage.src = images[index].url;
      lightboxImage.alt = images[index].alt;
      lightboxCounter.textContent = `${index + 1} / ${images.length}`;
      prevButton.style.display = images.length > 1 ? "" : "none";
      nextButton.style.display = images.length > 1 ? "" : "none";
    }

    function openLightbox(index) {
      showImage(index);
      lightbox.setAttribute("aria-hidden", "false");
      lightbox.style.display = "flex";
      requestAnimationFrame(() => {
        lightbox.classList.add("lightbox-visible");
      });
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("lightbox-visible");
      document.body.style.overflow = "";
      lightbox.addEventListener("transitionend", function handler() {
        lightbox.style.display = "none";
        lightbox.setAttribute("aria-hidden", "true");
        lightbox.removeEventListener("transitionend", handler);
      });
    }

    function navigate(direction) {
      const nextIndex = (currentIndex + direction + images.length) % images.length;
      showImage(nextIndex);
    }

    document.querySelectorAll("[data-lightbox-index]").forEach((element) => {
      element.addEventListener("click", () => {
        const index = parseInt(element.dataset.lightboxIndex, 10);
        openLightbox(index);
      });
    });

    closeButton.addEventListener("click", closeLightbox);
    prevButton.addEventListener("click", () => navigate(-1));
    nextButton.addEventListener("click", () => navigate(1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (lightbox.getAttribute("aria-hidden") === "true") return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") navigate(-1);
      if (event.key === "ArrowRight") navigate(1);
    });
  }

  initLightbox();
</script>

<style>
  .lightbox {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.95);
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .lightbox-visible {
    opacity: 1;
  }

  .lightbox-image {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 4px;
  }

  .lightbox-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #fff;
    font-size: 2.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0.5rem;
    transition: color 0.2s;
  }

  .lightbox-close:hover {
    color: var(--accent, #00ff88);
  }

  .lightbox-prev,
  .lightbox-next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #fff;
    font-size: 3rem;
    cursor: pointer;
    padding: 1rem;
    line-height: 1;
    transition: color 0.2s;
  }

  .lightbox-prev:hover,
  .lightbox-next:hover {
    color: var(--accent, #00ff88);
  }

  .lightbox-prev {
    left: 1rem;
  }

  .lightbox-next {
    right: 1rem;
  }

  .lightbox-counter {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    color: #aaa;
    font-size: 0.9rem;
  }
</style>
```

- [ ] **Step 2: Verify the file was created correctly**

Run:
```bash
head -5 src/components/ImageLightbox.astro
```

Expected: The frontmatter with `interface LightboxImage` and `interface Props`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ImageLightbox.astro
git commit -m "feat: add ImageLightbox component for full-screen image viewing"
```

---

### Task 2: Update strain page gallery to use lightbox

**Files:**
- Modify: `src/pages/strains/[...slug].astro`

- [ ] **Step 1: Add the ImageLightbox import**

At the top of the frontmatter (after line 8), add:

```typescript
import ImageLightbox from "../../components/ImageLightbox.astro";
```

- [ ] **Step 2: Build the lightbox images array in the frontmatter**

After the `ogImage` const (line 23), add:

```typescript
const lightboxImages = (strain.gallery ?? []).map((image: { asset: unknown; alt?: string }) => ({
  url: urlFor(image).width(1600).format("webp").url(),
  alt: image.alt ?? strain.name,
}));
```

- [ ] **Step 3: Replace the gallery section**

Replace the existing gallery section (lines 80-96):

```astro
  {strain.gallery && strain.gallery.length > 0 && (
    <section class="fade-in" style="margin-bottom:3rem;">
      <SectionHeading title="Gallery" />
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:1rem;">
        {strain.gallery.map( image => (
          <img
            src={urlFor( image ).width( 500 ).height( 500 ).format( "webp" ).url()}
            alt={image.alt ?? ""}
            width="500"
            height="500"
            style="border-radius:8px;object-fit:cover;width:100%;aspect-ratio:1;"
            loading="lazy"
          />
        ) )}
      </div>
    </section>
  )}
```

With:

```astro
  {strain.gallery && strain.gallery.length > 0 && (
    <section class="fade-in" style="margin-bottom:3rem;">
      <SectionHeading title="Gallery" />
      <div class="gallery-grid">
        {strain.gallery.map((image, index) => (
          <img
            src={urlFor(image).width(600).height(600).format("webp").url()}
            alt={image.alt ?? strain.name}
            width="600"
            height="600"
            class="gallery-thumb"
            data-lightbox-index={index}
            loading="lazy"
          />
        ))}
      </div>
      <ImageLightbox images={lightboxImages} />
    </section>
  )}
```

- [ ] **Step 4: Add gallery styles**

Add a `<style>` block at the end of the file (after the closing `</Layout>` tag):

```astro
<style>
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .gallery-thumb {
    border-radius: 8px;
    object-fit: cover;
    width: 100%;
    aspect-ratio: 1;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .gallery-thumb:hover {
    transform: scale(1.03);
    filter: brightness(1.1);
  }
</style>
```

- [ ] **Step 5: Test in dev server**

Run:
```bash
make dev
```

Open `http://localhost:4321/strains/donny-burger` and verify:
1. Gallery thumbnails show at 600×600 with hover effect (scale + brightness)
2. Clicking a thumbnail opens the lightbox with the full-res image
3. Prev/next arrows navigate between images
4. Close button, backdrop click, and Escape key all close the lightbox
5. ArrowLeft/ArrowRight keyboard navigation works
6. Body scroll is locked while lightbox is open
7. Image counter shows correct position (e.g., "2 / 3")

- [ ] **Step 6: Commit**

```bash
git add src/pages/strains/[...slug].astro
git commit -m "feat: add clickable gallery with lightbox on strain page"
```
