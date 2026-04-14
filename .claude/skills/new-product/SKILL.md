---
name: new-product
description: Add a new product under an existing strain in Sanity CMS
---

# /new-product

Add a new product (SKU) under an existing strain in the Northwest Local Cannabis catalog.

## Usage

- `/new-product` — interactive mode
- `/new-product "Blue Dream 1g Pre-Roll"` — start with a name pre-filled

## Workflow

1. **Look up existing strains** — use MCP to query all strains and show the user a list to pick from

2. **Gather product details:**
   - Name (required)
   - Parent strain (required, from lookup)
   - Category: flower, preroll, concentrate, edible, or other (required)
   - Weight (e.g., "1g", "3.5g")
   - Description (optional, product-specific)
   - Available? (boolean)

3. **Confirm with user** — show summary before creating

4. **Create in Sanity** — use MCP tools to create and publish the product document

5. **Report** — show the created document ID
