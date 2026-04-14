---
name: new-retailer
description: Add a retail partner to Sanity CMS
---

# /new-retailer

Add a dispensary / retail partner to the Northwest Local Cannabis website.

## Usage

- `/new-retailer` — interactive mode
- `/new-retailer "Green Leaf Dispensary"` — start with a name pre-filled

## Workflow

1. **Gather retailer details:**
   - Name (required)
   - Street address (required)
   - City (required)
   - State (default: WA)
   - ZIP code (required)
   - Website URL
   - Phone
   - Email
   - Featured? (boolean)

2. **Optionally link products** — query existing products and let user select which ones this retailer carries

3. **Confirm with user** — show summary before creating

4. **Create in Sanity** — use MCP tools to create and publish the retailer document

5. **Report** — show the created document ID
