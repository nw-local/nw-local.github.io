---
name: new-strain
description: Add a new strain to the Sanity CMS catalog
---

# /new-strain

Add a new cannabis strain to the Northwest Local Cannabis catalog via Sanity MCP.

## Usage

- `/new-strain` — interactive mode, walk through all fields
- `/new-strain "Blue Dream"` — start with a name pre-filled

## Workflow

1. **Gather strain details:**
   - Name (required)
   - Strain type: indica, sativa, or hybrid (required)
   - Description (rich text)
   - Effects (array of strings, e.g., "relaxed", "creative")
   - Terpenes (array of strings, e.g., "myrcene", "limonene")
   - THC range (e.g., "22-26%")
   - CBD range (e.g., "<1%")
   - Next expected harvest date (optional)
   - Featured on homepage? (boolean)
   - Currently available? (boolean)

2. **Confirm with user** — show a summary of all fields before creating

3. **Create in Sanity** — use MCP tools to create and publish the strain document

4. **Report** — show the created document ID and a link to edit in Sanity Studio
