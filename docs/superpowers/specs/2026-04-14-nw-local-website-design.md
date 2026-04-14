# Northwest Local Cannabis — Website Design Spec

## Overview

Customer-facing website for **Northwest Local Cannabis**, a Washington State i502 licensed cannabis producer/processor. The site serves two equal audiences: **consumers** (finding products and retail locations) and **retailers** (wholesale info and partnership).

**Domain:** https://www.nw-local.com
**Stack:** Astro 6 (static site generation) + Sanity CMS + GitHub Pages
**Visual direction:** Dark + Electric Green — near-black backgrounds (#111111), vibrant green accent (#00ff88), heavy bold sans-serif typography. Bold, modern, unapologetic.

---

## Architecture & Data Flow

```
Sanity Studio (CMS)  →  Sanity API
                              ↓
                    GitHub Actions (webhook trigger)
                              ↓
                    Astro 6 Static Build
                    ├── Fetches all content from Sanity at build time
                    ├── Generates static HTML for every page
                    └── Outputs to dist/
                              ↓
                    GitHub Pages (hosting)
                              ↓
                    User visits site
                    ├── Age gate (client-side JS, localStorage)
                    └── Static HTML served
```

- **Sanity is the single source of truth** for all content — strains, products, blog posts, page copy, retailer locations, site settings. No Markdown files in the repo.
- **Astro fetches from Sanity at build time** using `@sanity/client`. Each content type maps to a Sanity document type.
- **Sanity webhook → GitHub Actions** triggers a rebuild on content publish. Typical rebuild: ~1-2 minutes.
- **Age gate** is a client-side overlay on first visit. Stores confirmation in `localStorage` so returning visitors skip it.
- The existing blog content collection (`src/content/`) will be removed — all content moves to Sanity.

---

## Sanity Content Model

### Strain

| Field | Type | Notes |
|-------|------|-------|
| name | string | e.g., "Blue Dream" |
| slug | slug | auto-generated from name |
| strainType | string enum | "indica" \| "sativa" \| "hybrid" |
| description | Portable Text | rich text |
| effects | array of strings | e.g., ["relaxed", "creative", "euphoric"] |
| terpenes | array of strings | e.g., ["myrcene", "limonene"] |
| thcRange | string | e.g., "22-26%" |
| cbdRange | string | e.g., "<1%" |
| heroImage | image | with alt text |
| gallery | array of images | |
| nextHarvestDate | date | optional, shown when set |
| featured | boolean | show on homepage |
| available | boolean | currently in production |
| sortOrder | number | display ordering |

### Product

| Field | Type | Notes |
|-------|------|-------|
| name | string | e.g., "Blue Dream 1g Pre-Roll" |
| slug | slug | auto-generated from name |
| strain | reference → Strain | parent strain |
| category | string enum | "flower" \| "preroll" \| "concentrate" \| "edible" \| "other" |
| weight | string | e.g., "1g", "3.5g", "1oz" |
| description | Portable Text | optional, product-specific details |
| image | image | optional, falls back to strain heroImage |
| available | boolean | |
| sortOrder | number | |

### Blog Post

| Field | Type | Notes |
|-------|------|-------|
| title | string | |
| slug | slug | auto-generated from title |
| description | string | SEO excerpt |
| body | Portable Text | rich text with images |
| heroImage | image | with alt text |
| publishedAt | datetime | |
| tags | array of strings | |

### Retailer

| Field | Type | Notes |
|-------|------|-------|
| name | string | dispensary name |
| slug | slug | |
| address | string | |
| city | string | |
| state | string | default: "WA" |
| zip | string | |
| lat | number | optional, for future map |
| lng | number | optional, for future map |
| website | url | |
| phone | string | |
| email | string | |
| logo | image | |
| featured | boolean | |
| productsAvailable | array of references → Product | optional, filled in over time |

### Page (singleton per pageId)

| Field | Type | Notes |
|-------|------|-------|
| title | string | |
| pageId | string enum | "home" \| "about" \| "contact" |
| seoDescription | string | |
| heroImage | image | |
| body | Portable Text | main page content |

### Site Settings (singleton)

| Field | Type | Notes |
|-------|------|-------|
| siteTitle | string | |
| siteDescription | string | |
| logo | image | |
| socialLinks | object | { instagram, facebook, etc. } |
| contactEmail | string | |
| contactPhone | string | |
| address | string | business address |
| ageGateMessage | string | customizable 21+ prompt text |

### Retailer Page (singleton)

| Field | Type | Notes |
|-------|------|-------|
| headline | string | e.g., "Become a Partner" |
| intro | Portable Text | |
| contactEmail | string | wholesale inquiries |
| contactPhone | string | |
| downloadables | array of files | product sheets, PDFs |

---

## Pages & Routing

| Route | Source | Description |
|-------|--------|-------------|
| `/` | Home page singleton | Hero, brand intro, featured strains, CTAs for consumers + retailers |
| `/about` | About page singleton | Story, team, growing philosophy |
| `/strains` | List from Sanity | All strains, filterable by type (indica/sativa/hybrid) and availability |
| `/strains/[slug]` | Dynamic from Sanity | Strain detail — description, terpenes, effects, all products for that strain |
| `/products` | List from Sanity | All products, filterable by category (flower, preroll, concentrate, etc.) |
| `/find-us` | Retailer list + page content | Retail partners list grouped by city |
| `/retailers` | Retailer page singleton | "For Retailers" — wholesale info, product sheets, buyer contact |
| `/blog` | List from Sanity | Blog index with latest posts |
| `/blog/[slug]` | Dynamic from Sanity | Individual blog post |
| `/contact` | Contact page singleton | Displays email, phone, address from Site Settings |

### Navigation

- **Main nav:** Home, About, Strains, Find Us, Blog, Contact
- **"For Retailers"** — visually separated in the nav (right-aligned or styled as a button)
- **Footer:** All page links + social icons + contact info from Site Settings

### Contact page

Displays contact information only (email, phone, address) pulled from Site Settings. No form.

---

## Visual Direction: Dark + Electric Green

**Palette:**
- Background: `#111111` (near-black)
- Surface: `#1a1a1a` (cards, elevated elements)
- Accent: `#00ff88` (electric green — CTAs, highlights, hover states)
- Text primary: `#ffffff`
- Text secondary: `#888888`
- Border: `#333333`

**Typography:**
- Headings: Heavy weight (700-800), sans-serif, uppercase or large scale
- Body: Regular weight, sans-serif, good contrast against dark background
- Accent text: Letter-spaced uppercase for labels and nav items

**Design principles:**
- Strong visual hierarchy through type scale and weight contrast
- Green accent used sparingly for CTAs and interactive elements — not for large areas
- Generous whitespace despite dark backgrounds
- Product/strain photography as the primary visual content against the dark canvas

---

## Component Architecture

### Layout components

- **`Layout.astro`** — base HTML shell, pulls Site Settings from Sanity, wraps every page
- **`BaseHead.astro`** — `<head>` with SEO meta, OG tags, font preloads
- **`Nav.astro`** — main navigation, "For Retailers" as styled button
- **`Footer.astro`** — page links, social icons, contact info
- **`AgeGate.astro`** — fullscreen overlay, checks `localStorage`, blocks content until confirmed

### Content components

- **`StrainCard.astro`** — card for strain listings (image, name, type badge, effects preview)
- **`ProductCard.astro`** — card for product listings (image, name, category, weight, strain reference)
- **`ProductBadge.astro`** — pill showing category (flower, preroll, concentrate, etc.)
- **`RetailerCard.astro`** — card for dispensary listings (name, city, website link)
- **`BlogPostCard.astro`** — card for blog index (title, date, excerpt, hero image)
- **`PortableText.astro`** — renders Sanity Portable Text to HTML

### UI components

- **`Hero.astro`** — full-width hero section for home and interior pages
- **`FilterBar.astro`** — client-side filtering for strains (by type) and products (by category)
- **`SectionHeading.astro`** — heading style with green accent line
- **`ContactInfo.astro`** — displays email, phone, address from Site Settings

### Data layer

- **`src/lib/sanity.ts`** — Sanity client setup, GROQ queries as exported functions: `getStrains()`, `getProducts()`, `getProductsByStrain(strainId)`, `getRetailers()`, `getBlogPosts()`, `getBlogPost(slug)`, `getStrain(slug)`, `getPage(pageId)`, `getSiteSettings()`, `getRetailerPage()`

---

## Sanity MCP & Claude Skills

### MCP Setup

- Official Sanity MCP server at `mcp.sanity.io` configured at project level
- Common read tools pre-approved in `.claude/settings.local.json`
- Image uploads handled via `@sanity/client` script (MCP doesn't support raw image upload from disk)

### Skills

**`/new-post`** — Blog post publishing workflow. Brainstorm or assemble content, set tags and SEO description, create and publish in Sanity via MCP.

**`/new-strain`** — Add a strain to the catalog. Walk through name, type, effects, terpenes, THC/CBD ranges, images. Create and publish in Sanity.

**`/new-product`** — Add a product under an existing strain. Select parent strain via MCP lookup, set category, weight, description. Create and publish.

**`/new-retailer`** — Add a retail partner. Name, address, contact info, website, optionally link products carried. Create and publish.

**`/audit-content`** — Content quality audit. Scan strains/products for missing fields (images, descriptions, effects). Check blog posts for missing SEO descriptions. Check retailers for missing contact info. Report findings.

**`/describe-assets`** — Batch SEO alt-text. Find Sanity image assets missing descriptions, view each image, suggest alt text, update and publish via MCP.

---

## Build & Deploy

- **Dev:** `yarn dev` (localhost:4321)
- **Build:** `yarn build` (Astro fetches all Sanity content, outputs static HTML to `dist/`)
- **Deploy:** GitHub Actions on push to `main`, plus Sanity webhook trigger on content publish
- **Sanity Studio:** Hosted separately by Sanity (free tier) at a `*.sanity.studio` URL
- **Environment variables:** `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN` (read token for build-time fetching)
