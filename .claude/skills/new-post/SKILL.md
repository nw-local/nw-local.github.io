---
name: new-post
description: Create and publish a blog post in Sanity CMS
---

# /new-post

Create and publish a blog post for Northwest Local Cannabis.

## Usage

- `/new-post` — brainstorm mode, collaboratively draft the post
- `/new-post "Post Title"` — start with a title pre-filled

## Workflow

1. **Determine mode:**
   - **Brainstorm** — help the user develop the topic, draft content collaboratively
   - **Assembly** — user provides content, we format and publish

2. **Gather post details:**
   - Title (required)
   - Description / SEO excerpt (required, max 160 chars)
   - Body content (Portable Text)
   - Tags (array of strings)
   - Publish date (defaults to now)

3. **Confirm with user** — show summary before creating

4. **Create in Sanity** — use MCP tools to create and publish the blog post

5. **Report** — show the created document ID and URL
