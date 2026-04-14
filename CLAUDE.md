# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Customer-facing website for **Northwest Local Cannabis**, a Washington State i502 licensed cannabis producer/processor. Built with **Astro 6** (started from the blog starter template). Uses **yarn** as the package manager and deploys to **GitHub Pages** via GitHub Actions.

## Commands

| Task | Command |
|------|---------|
| Dev server | `yarn dev` (localhost:4321) |
| Build | `yarn build` (outputs to `./dist/`) |
| Preview build | `yarn preview` |
| Type check | `yarn astro check` |
| Add integration | `yarn astro add <integration>` |

No test framework is configured.

## Architecture

- **Astro 6** with static site generation (SSG), strict TypeScript (`astro/tsconfigs/strict`)
- **Integrations**: `@astrojs/mdx` (MDX support), `@astrojs/rss` (RSS feed), `@astrojs/sitemap`
- **Content Collections**: Blog posts in `src/content/blog/` as `.md`/`.mdx` files, schema defined in `src/content.config.ts` with Zod validation (title, description, pubDate, optional updatedDate, optional heroImage)
- **Global constants**: `src/consts.ts` exports `SITE_TITLE` and `SITE_DESCRIPTION`, imported across pages and components
- **Styling**: Plain CSS in `src/styles/global.css` using CSS custom properties; loaded globally via `BaseHead.astro`. Font: Atkinson (woff files in `public/fonts/`)
- **Layout chain**: Pages use `BaseHead` for `<head>` (meta, OG tags, fonts), `Header`/`Footer` for navigation, and `BlogPost.astro` layout wraps blog content with hero image + date display
- **Dynamic routing**: `src/pages/blog/[...slug].astro` generates static pages from the blog collection using `getStaticPaths()`

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main` using `withastro/action@v6`.

## Key Files

- `astro.config.mjs` — Astro configuration (site URL, integrations)
- `src/content.config.ts` — Blog collection schema definition
- `src/consts.ts` — Site-wide constants
- `src/components/BaseHead.astro` — Shared `<head>` with SEO/OG meta tags
- `src/layouts/BlogPost.astro` — Blog post page layout
- `src/pages/blog/[...slug].astro` — Dynamic blog post route generation
