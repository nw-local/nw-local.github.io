---
name: describe-assets
description: Add alt text to Sanity image assets missing descriptions
---

# /describe-assets

Find Sanity image assets missing alt text and add SEO-friendly descriptions.

## Usage

- `/describe-assets` — process up to 10 assets
- `/describe-assets 25` — process up to 25 assets

## Workflow

1. **Find assets** — use MCP to list image assets that lack descriptions or alt text

2. **For each asset:**
   - Download and visually examine the image
   - Suggest descriptive, SEO-friendly alt text
   - Show suggestion to user for approval
   - Update the asset's alt text in Sanity via MCP

3. **Report** — summary of how many assets were updated
