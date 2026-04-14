# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Customer-facing website for **Northwest Local Cannabis**, a Washington State i502 licensed cannabis producer/processor. Built with **Astro 6** + **Sanity CMS**. All content (strains, products, blog posts, pages, retailers, site settings) lives in Sanity and is fetched at build time. Deploys to **GitHub Pages** via GitHub Actions. Uses **yarn** as the package manager.

## Commands

Use `make` targets — they load `.env` automatically via `-include .env` + `export`.

| Task | Command |
|------|---------|
| Dev server | `make dev` (localhost:4321) |
| Build | `make build` (outputs to `./dist/`) |
| Preview build | `make preview` |
| Sanity Studio | `make studio` (localhost:3333) |
| Deploy Studio | `make deploy-studio` |
| Type check | `yarn astro check` |

No test framework is configured.

## Architecture

- **Astro 6** with static site generation (SSG), strict TypeScript
- **Sanity CMS** is the single source of truth for all content — no Markdown files in the repo
- **Integrations**: `@astrojs/rss`, `@astrojs/sitemap`
- **Data layer**: `src/lib/sanity.ts` — Sanity client + GROQ query functions; `src/lib/image.ts` — image URL builder
- **Styling**: Dark + Electric Green theme in `src/styles/global.css` using CSS custom properties. System font stack (no custom fonts).
- **Layout chain**: `Layout.astro` wraps every page — fetches site settings from Sanity, renders `BaseHead`, `Nav`, `Footer`, and `AgeGate`
- **Age gate**: Client-side 21+ overlay using `localStorage` for persistence
- **Dynamic routing**: `src/pages/strains/[...slug].astro` and `src/pages/blog/[...slug].astro` generate static pages via `getStaticPaths()`
- **Webhook rebuild**: Sanity content publish triggers a GitHub Actions rebuild via `workflow_dispatch`

## Sanity Content Model

| Document Type | Purpose |
|---------------|---------|
| `strain` | Cannabis strains with effects, terpenes, THC/CBD ranges, gallery |
| `product` | SKUs (flower, preroll, concentrate, edible) referencing a parent strain |
| `blogPost` | Blog posts with rich text body, tags, hero image |
| `retailer` | Dispensary partners with address, contact info, products carried |
| `page` | Singleton pages (home, about, contact) with flexible body content |
| `siteSettings` | Global config: title, logo, social links, contact info, age gate message |
| `retailerPage` | Wholesale page singleton with downloadable product sheets |

## Environment Variables

Required in `.env` (and as GitHub Actions secrets):

- `SANITY_PROJECT_ID` — Sanity project ID (`nyd3p2n0`)
- `SANITY_DATASET` — Sanity dataset name (`production`)
- `SANITY_API_TOKEN` — Read-only API token for build-time fetching

## Deployment

- **GitHub Pages**: Auto-deploys on push to `main` via `.github/workflows/deploy.yml`
- **Sanity Studio**: Hosted at https://nw-local.sanity.studio/ — deploy with `make deploy-studio`
- **Sanity webhook**: On content publish, Sanity sends a POST to the GitHub Actions `workflow_dispatch` endpoint, triggering a rebuild (~1-2 min)
  - Webhook URL: `https://api.github.com/repos/nw-local/nw-local.github.io/actions/workflows/deploy.yml/dispatches`
  - Projection: `{"ref": "main"}`
  - Auth: Fine-grained GitHub PAT with Actions (read/write) permission on the repo
  - Configured at: sanity.io/manage → project nyd3p2n0 → API → Webhooks

## Key Files

- `astro.config.mjs` — Astro configuration (site URL, integrations)
- `src/lib/sanity.ts` — Sanity client, all GROQ queries
- `src/lib/image.ts` — Sanity image URL builder (`urlFor()`)
- `src/layouts/Layout.astro` — Base layout wrapping all pages
- `src/components/AgeGate.astro` — 21+ age verification overlay
- `src/styles/global.css` — Full theme (dark + electric green)
- `studio/` — Sanity Studio project (schemas in `studio/schemaTypes/`)

## Available Skills

| Skill | Purpose |
|-------|---------|
| `/new-strain` | Add a strain to the Sanity catalog |
| `/new-product` | Add a product under an existing strain |
| `/new-post` | Create and publish a blog post |
| `/new-retailer` | Add a retail partner |
| `/audit-content` | Scan content for missing fields and quality issues |
| `/describe-assets` | Add alt text to image assets missing descriptions |
