# nw-local.com

Customer-facing website for **Northwest Local Cannabis**, a Washington State i502 licensed cannabis producer/processor.

[![Deploy to GitHub Pages](https://github.com/nw-local/nw-local.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/nw-local/nw-local.github.io/actions/workflows/deploy.yml)
[![CI](https://github.com/nw-local/nw-local.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/nw-local/nw-local.github.io/actions/workflows/ci.yml)
[![Astro](https://img.shields.io/badge/Astro-6.x-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![Sanity CMS](https://img.shields.io/badge/Sanity-CMS-F03E2F?logo=sanity&logoColor=white)](https://www.sanity.io)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.12-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Yarn](https://img.shields.io/badge/yarn-package%20manager-2C8EBB?logo=yarn&logoColor=white)](https://yarnpkg.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deployed](https://img.shields.io/badge/site-nw--local.com-1f6feb)](https://www.nw-local.com)

The site is a static, content-driven catalog of strains, products, blog posts, and retail partners. Content is authored in [Sanity Studio](https://nw-local.sanity.studio/), built into static HTML by [Astro](https://astro.build) at deploy time, and hosted on [GitHub Pages](https://pages.github.com/).

---

## Tech stack

| Layer            | Tool                                                   |
| ---------------- | ------------------------------------------------------ |
| Framework        | Astro 6 (SSG, strict TypeScript)                       |
| CMS              | Sanity (project ID `nyd3p2n0`, dataset `production`)   |
| Hosting          | GitHub Pages                                           |
| CI/CD            | GitHub Actions (`.github/workflows/deploy.yml`)        |
| Package manager  | yarn                                                   |
| Integrations     | `@astrojs/rss`, `@astrojs/sitemap`, `astro-portabletext` |
| Image handling   | `sharp`, `@sanity/image-url`                           |
| Analytics        | Google Analytics 4                                     |

There are no Markdown files in the repo — every piece of content (strains, products, blog posts, pages, retailers, site settings) lives in Sanity and is fetched at build time via GROQ queries in `src/lib/sanity.ts`.

---

## Quick start

Prereqs: Node 22.12+, yarn, and access to the Sanity project.

```sh
# 1. Clone
git clone git@github.com:nw-local/nw-local.github.io.git nw-local.com
cd nw-local.com

# 2. Install
yarn install
cd studio && yarn install && cd ..

# 3. Environment
cp .env.example .env  # if present, otherwise see "Environment variables" below
# fill in SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN, PUBLIC_GOOGLE_ANALYTICS_ID

# 4. Dev
make dev
```

The dev server runs at <http://localhost:4321>.

---

## Commands

All commands run from the repo root.

| Task                | Command              | Notes                                                |
| ------------------- | -------------------- | ---------------------------------------------------- |
| Dev server          | `make dev`           | localhost:4321                                       |
| Production build    | `make build`         | output → `./dist/`                                   |
| Preview build       | `make preview`       | local preview of the built site                      |
| Sanity Studio (dev) | `make studio`        | localhost:3333                                       |
| Deploy Sanity Studio| `make deploy-studio` | deploys to <https://nw-local.sanity.studio/>         |
| Type check          | `yarn astro check`   |                                                      |
| Lint                | `make lint`          | ESLint                                               |
| Format              | `make format`        | ESLint `--fix` (auto-fix)                            |
| Upgrade deps (safe) | `make upgrade`       | minor/patch only, respects tilde ranges              |
| Upgrade deps (major)| `make upgrade-latest`| ignores semver — review `yarn outdated` before/after |
| Prep images         | `make prep-images`   | see [Image workflow](#image-workflow)                |
| Upload image        | `make upload-image`  | see [Image workflow](#image-workflow)                |

---

## Automated testing

For a content-driven static site with no business logic, heavy testing is overkill — the failure modes are different from those of a typical app. The current setup is intentionally minimal.

In place:

- **CI type check** (`.github/workflows/ci.yml`) — runs `yarn astro check` on every PR and push to `main`. Catches broken GROQ query types, missing required fields on Sanity entity types, and Astro template errors before they reach the deploy job. The data layer in [`src/lib/sanity.ts`](src/lib/sanity.ts) parameterizes each `fetch<T>()` call with a typed entity (`Strain`, `Product`, `BlogPost`, etc.), so consumers in `.astro` pages get strict typing for free.

Considered for future addition:

- **Playwright smoke test** — build the site and verify the homepage and a strain detail page render with expected content. Would catch dead pages from broken queries or missing layouts.

Out of scope:

- **Unit tests** — most code is data fetching and static rendering; minimal logic to test in isolation.
- **Visual regression** — overkill unless the design is iterating frequently.
- **Content quality** (missing alt text, broken external links, ghost terpenes) — already covered by the [`/audit-content`](#claude-code-skills) skill, which can be run on a schedule rather than as a CI gate.

---

## Project structure

```text
.
├── astro.config.mjs           # site URL + integrations
├── Makefile                   # all run/build/image commands
├── package.json
├── public/                    # static assets served as-is
├── src/
│   ├── components/            # Astro components (Nav, Footer, AgeGate, etc.)
│   ├── content.config.ts      # content collection schemas (mostly unused — content is in Sanity)
│   ├── layouts/
│   │   └── Layout.astro       # base layout: BaseHead, Nav, Footer, AgeGate, fetches site settings
│   ├── lib/
│   │   ├── sanity.ts          # Sanity client + ALL GROQ queries
│   │   └── image.ts           # urlFor() — Sanity image URL builder
│   ├── pages/
│   │   ├── index.astro
│   │   ├── strains/[...slug].astro   # dynamic strain pages via getStaticPaths
│   │   ├── blog/[...slug].astro      # dynamic blog post pages
│   │   └── ...
│   └── styles/
│       └── global.css         # Dark + Electric Green theme via CSS custom properties
├── scripts/
│   ├── prep-images.sh         # HEIC→JPG, dedup, slug-rename
│   └── upload-image.sh        # POSTs to Sanity asset endpoint
└── studio/                    # Sanity Studio project (schemas, deployment config)
    └── schemaTypes/           # document type definitions
```

The age-gate overlay (`src/components/AgeGate.astro`) is client-side and uses `localStorage` to persist the 21+ acknowledgement.

---

## Sanity content model

All content types live in `studio/schemaTypes/`. Strain pages and blog post pages are statically generated via `getStaticPaths()`.

| Document type     | Purpose                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| `strain`          | Cannabis strains — effects, terpenes, THC/CBD ranges, hero + gallery images   |
| `product`         | SKUs (flower, preroll, concentrate, edible) referencing a parent strain        |
| `blogPost`        | Blog posts with rich text body, tags, hero image                               |
| `retailer`        | Dispensary partners with address, contact info, products carried               |
| `page`            | Singleton pages (home, about, contact) with flexible body content              |
| `siteSettings`    | Global config: title, logo, social links, contact info, age gate message      |
| `retailerPage`    | Wholesale singleton page with downloadable product sheets                      |
| `terpene`         | Terpene reference documents — aroma, effects, foundIn, hero image             |

Strains link to terpenes by **string name** (not by reference). The strain page resolves the matching `terpene` document by slug at render time. Typos silently produce ghost terpenes, so when adding a strain, check existing terpene names first.

---

## Deployment

The site auto-deploys to GitHub Pages on every push to `main`.

```text
git push origin main
        │
        ▼
GitHub Actions: .github/workflows/deploy.yml
        │
        ├── checkout
        ├── withastro/action@v6 (install, build with secrets injected)
        └── actions/deploy-pages@v5 → https://www.nw-local.com
```

**Sanity webhook**: when an editor publishes content in Sanity Studio, Sanity posts to GitHub Actions `workflow_dispatch` to trigger a rebuild (~1-2 min end-to-end).

- Webhook URL: `https://api.github.com/repos/nw-local/nw-local.github.io/actions/workflows/deploy.yml/dispatches`
- Projection: `{"ref": "main"}`
- Auth: fine-grained GitHub PAT with Actions (read/write) on the repo
- Configured at: sanity.io/manage → project `nyd3p2n0` → API → Webhooks

The Sanity Studio itself (the editor UI) is hosted separately at <https://nw-local.sanity.studio/> and deploys with `make deploy-studio`.

---

## Environment variables

All four are required for both local development and CI.

| Variable                       | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `SANITY_PROJECT_ID`            | Sanity project ID (`nyd3p2n0`)                           |
| `SANITY_DATASET`               | Sanity dataset name (`production`)                       |
| `SANITY_API_TOKEN`             | Read-only token for build-time content fetching          |
| `PUBLIC_GOOGLE_ANALYTICS_ID`   | GA4 measurement ID (e.g. `G-XXXXXXXXXX`)                 |

Local: put them in `.env` at the repo root. CI: stored as GitHub Actions secrets.

A separate `SANITY_WRITE_TOKEN` is used **only** by the image-upload helper script (`make upload-image`) when adding new image assets. It is not needed to build or run the site.

---

## Image workflow

For uploading strain/blog/retailer images to Sanity. Two scripts orchestrated by `make`:

```sh
# 1. Convert HEIC→JPG, slugify filenames, dedup against Sanity
make prep-images DIR="path/to/images" STRAIN="Strain Name" \
    RENAME="IMG_3559.HEIC:bud-closeup,IMG_3561.HEIC:trichome-detail"

# 2. Upload each NEW file with descriptive alt text
make upload-image FILE="path/to/_processed/strain-name-bud-closeup.jpg" \
    LABEL="Short label" \
    DESCRIPTION="SEO-friendly alt text describing the image content"
```

`prep-images` writes to a `_processed/` subdirectory inside the source folder. **Keep `_processed/` around** — it acts as the canonical local manifest of what's currently uploaded for that strain, and the dedup logic uses it to detect duplicates and renames on subsequent runs.

Hero images: landscape 4:3, minimum 1200×900. Portrait images get cropped on the strain detail page.

---

## Claude Code skills

This repo ships with custom [Claude Code](https://claude.ai/code) slash-command skills under `.claude/skills/` that automate routine content operations against the Sanity MCP server. They drive the strain catalog, blog, and retailer onboarding.

| Skill              | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `/new-strain`      | Add a strain — researches multiple sources, validates links, writes original copy, uploads images, publishes to Sanity |
| `/update-strain`   | Update an existing strain's images, content, or fields                |
| `/new-product`     | Add a product SKU under an existing strain                            |
| `/new-post`        | Create and publish a blog post                                         |
| `/new-retailer`    | Add a retail partner                                                   |
| `/audit-content`   | Scan content for missing fields and quality issues                     |
| `/describe-assets` | Add alt text to image assets missing descriptions                      |

Each skill encodes the full workflow (research → preview → user approval → image processing → Sanity mutations → publish) and uses the Sanity MCP with `workspaceName: "nw-local"`. See `.claude/skills/<skill>/SKILL.md` for the full instructions of each.

---

## Useful links

- Production site: <https://www.nw-local.com>
- Sanity Studio: <https://nw-local.sanity.studio/>
- Sanity project management: <https://www.sanity.io/manage/personal/project/nyd3p2n0>
- Astro docs: <https://docs.astro.build>
- Sanity GROQ reference: <https://www.sanity.io/docs/groq>

---

## License

Private — all rights reserved. Northwest Local Cannabis.
