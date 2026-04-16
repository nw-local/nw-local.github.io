# prep-images: Image Processing & Dedup Tool

**Date:** 2026-04-16
**Status:** Approved

## Problem

Adding strains requires converting images (HEIC from iPhone, PNG, etc.) to JPG, renaming them with SEO-friendly slugs, and manually checking whether they've already been uploaded to Sanity. This is repetitive and error-prone.

## Solution

A `make prep-images` target backed by `scripts/prep-images.sh` that:

1. Converts all images in a directory to JPG
2. Renames them with a strain-slug prefix
3. Checks each against Sanity's existing assets to flag duplicates
4. Outputs processed files to a `_processed/` subfolder

## Invocation

```bash
make prep-images DIR="~/Dropbox/.../Donnie Burger" STRAIN="Donny Burger"
```

**Arguments:**

| Arg | Required | Description |
|-----|----------|-------------|
| `DIR` | Yes | Path to directory containing source images |
| `STRAIN` | Yes | Strain name (used to generate the slug prefix) |

## Script Flow (`scripts/prep-images.sh`)

1. **Parse args** — `DIR` and `STRAIN`, both required
2. **Slugify** strain name → lowercase, spaces/underscores to hyphens, strip non-alphanumeric (e.g., "Donny Burger" → `donny-burger`)
3. **Find images** in `DIR` — match extensions: `.heic`, `.heif`, `.png`, `.jpg`, `.jpeg`, `.webp` (case-insensitive). Non-recursive. Skip `_processed/` subdirectory.
4. **Create `DIR/_processed/`** if it doesn't exist
5. **For each image:**
   - If not JPG: convert to JPG using `sips -s format jpeg -s formatOptions 90 <input> --out <output>` (90% quality to balance size/quality)
   - If already JPG: copy as-is
   - Rename to `{strain-slug}-{original-stem}.jpg` (stem is the original filename without extension, lowercased, spaces to hyphens)
   - Write to `_processed/`
6. **Dedup check for each processed file:**
   - Compute SHA-1: `shasum <file> | awk '{print $1}'`
   - Query Sanity (read-only token): `*[_type == "sanity.imageAsset" && sha1hash == $hash][0]{_id, label, originalFilename}`
   - If match: print `SKIP (duplicate): {filename} → already uploaded as {asset._id}`
   - If no match: print `NEW: {filename}`
7. **Print summary:** `X files processed: Y new, Z duplicates`

## Dedup Mechanism

- SHA-1 is computed on the **converted JPG bytes**, not the original source file
- Sanity stores `sha1hash` on every `sanity.imageAsset` document
- Query uses `SANITY_API_TOKEN` (read-only) — does not require `SANITY_WRITE_TOKEN`
- Converting the same source HEIC twice with `sips` produces identical JPG bytes → same SHA-1 → reliable dedup

## Output Structure

Given:
```
~/Dropbox/.../Donnie Burger/
  hero.heic
  closeup.heic
  canopy.png
```

After `make prep-images DIR="..." STRAIN="Donny Burger"`:
```
~/Dropbox/.../Donnie Burger/
  hero.heic              (untouched)
  closeup.heic           (untouched)
  canopy.png             (untouched)
  _processed/
    donny-burger-hero.jpg
    donny-burger-closeup.jpg
    donny-burger-canopy.jpg
```

## Environment Variables

| Var | Required | Purpose |
|-----|----------|---------|
| `SANITY_PROJECT_ID` | Yes | Sanity project ID for dedup query |
| `SANITY_DATASET` | Yes | Sanity dataset name for dedup query |
| `SANITY_API_TOKEN` | Yes | Read-only token for dedup query |

All provided automatically via `make` (which loads `.env`).

## Dependencies

- `sips` — macOS built-in, already used by `upload-image.sh`
- `shasum` — macOS built-in
- `curl` + `python3` — for Sanity GROQ query (python3 for JSON parsing, already used by `upload-image.sh`)
- No new external dependencies

## Files Changed

| File | Change |
|------|--------|
| `scripts/prep-images.sh` | **New** — main script |
| `Makefile` | Add `prep-images` target |
| `.claude/skills/new-strain/skill.md` | Update step 5 to suggest `make prep-images` when user provides a directory |

## What This Does NOT Do

- **Does not auto-upload** — uploading remains manual via `make upload-image` so the user can provide LABEL and DESCRIPTION per image
- **Does not resize** — images are converted and renamed but not resized; the user controls source dimensions
- **Does not recurse subdirectories** — only processes top-level images in `DIR`
- **Does not delete originals** — originals stay untouched; only `_processed/` is written to
