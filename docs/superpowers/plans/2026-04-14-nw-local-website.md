# Northwest Local Cannabis Website — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static cannabis producer/processor website with Astro 6 + Sanity CMS, deployed to GitHub Pages.

**Architecture:** All content lives in Sanity (strains, products, blog, pages, retailers, site settings). Astro fetches everything at build time via `@sanity/client` and generates static HTML. A Sanity webhook triggers GitHub Actions rebuilds on content publish. Dark + Electric Green visual theme.

**Tech Stack:** Astro 6, Sanity v3, `@sanity/client`, `@sanity/image-url`, `astro-portabletext`, GitHub Pages, GitHub Actions

**Design Spec:** `docs/superpowers/specs/2026-04-14-nw-local-website-design.md`

---

## File Structure

```
nw-local.com/
├── studio/                          # Sanity Studio (separate deploy)
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   ├── package.json
│   └── schemaTypes/
│       ├── index.ts
│       ├── blockContent.ts
│       ├── strain.ts
│       ├── product.ts
│       ├── retailer.ts
│       ├── blogPost.ts
│       ├── siteSettings.ts
│       ├── retailerPage.ts
│       └── page.ts
├── src/
│   ├── lib/
│   │   ├── sanity.ts                # Sanity client + GROQ query functions
│   │   └── image.ts                 # Image URL builder
│   ├── components/
│   │   ├── BaseHead.astro           # Modified: SEO head
│   │   ├── Nav.astro                # New: main navigation
│   │   ├── Footer.astro             # Modified: full footer
│   │   ├── AgeGate.astro            # New: 21+ overlay
│   │   ├── Hero.astro               # New: hero section
│   │   ├── SectionHeading.astro     # New: heading with green accent
│   │   ├── FilterBar.astro          # New: client-side category filter
│   │   ├── ContactInfo.astro        # New: contact display
│   │   ├── PortableText.astro       # New: Sanity rich text renderer
│   │   ├── StrainCard.astro         # New: strain listing card
│   │   ├── ProductCard.astro        # New: product listing card
│   │   ├── ProductBadge.astro       # New: category pill
│   │   ├── RetailerCard.astro       # New: retailer listing card
│   │   └── BlogPostCard.astro       # New: blog listing card
│   ├── layouts/
│   │   └── Layout.astro             # New: base layout (replaces BlogPost.astro)
│   ├── pages/
│   │   ├── index.astro              # Modified: home page
│   │   ├── about.astro              # Modified: about page
│   │   ├── strains/
│   │   │   ├── index.astro          # New: strain listing
│   │   │   └── [...slug].astro      # New: strain detail
│   │   ├── products.astro           # New: product listing
│   │   ├── find-us.astro            # New: retailer listing
│   │   ├── retailers.astro          # New: for retailers page
│   │   ├── blog/
│   │   │   ├── index.astro          # Modified: blog listing
│   │   │   └── [...slug].astro      # Modified: blog detail
│   │   ├── contact.astro            # New: contact page
│   │   └── rss.xml.ts               # Modified: RSS from Sanity
│   ├── styles/
│   │   └── global.css               # Modified: dark + electric green theme
│   └── consts.ts                    # Remove (replaced by Site Settings)
├── astro.config.mjs                 # Modified: add Sanity integration
├── .env                             # New: Sanity env vars
└── .claude/
    └── skills/
        ├── new-post/SKILL.md
        ├── new-strain/SKILL.md
        ├── new-product/SKILL.md
        ├── new-retailer/SKILL.md
        ├── audit-content/SKILL.md
        └── describe-assets/SKILL.md
```

---

### Task 1: Create Sanity Project and Studio

**Files:**
- Create: `studio/package.json`
- Create: `studio/sanity.config.ts`
- Create: `studio/sanity.cli.ts`
- Create: `studio/tsconfig.json`
- Create: `.env`

**Prerequisites:** A Sanity account. The engineer will need to create a project at sanity.io/manage or via `npx sanity@latest init`.

- [ ] **Step 1: Initialize Sanity project**

Run from repo root:

```bash
cd studio && npx sanity@latest init --project-id <YOUR_PROJECT_ID> --dataset production --template clean --typescript --output-path .
```

If you don't have a project ID yet, run `npx sanity@latest init` interactively to create one. Select "Clean project" template, TypeScript, dataset name "production".

- [ ] **Step 2: Verify Studio boots**

```bash
cd studio && npx sanity dev
```

Expected: Studio launches at `http://localhost:3333` with an empty schema.

- [ ] **Step 3: Create `.env` in repo root with Sanity credentials**

Create `/nw-local.com/.env`:

```env
SANITY_PROJECT_ID="<your-project-id>"
SANITY_DATASET="production"
SANITY_API_TOKEN="<create-a-read-token-at-sanity.io/manage>"
```

Create the API token at sanity.io/manage → your project → API → Tokens → Add API Token → "Astro Build" → Viewer role.

- [ ] **Step 4: Add `.env` and `studio/node_modules` to `.gitignore`**

Append to `.gitignore`:

```
# sanity studio
studio/node_modules/
studio/dist/
```

Verify `.env` is already gitignored (it is, from the existing gitignore).

- [ ] **Step 5: Commit**

```bash
git add studio/ .gitignore .env.example
git commit -m "feat: initialize Sanity Studio project"
```

Note: Create a `.env.example` with placeholder values (no real tokens) for documentation.

---

### Task 2: Define Sanity Schemas — Block Content and Strain

**Files:**
- Create: `studio/schemaTypes/blockContent.ts`
- Create: `studio/schemaTypes/strain.ts`
- Modify: `studio/schemaTypes/index.ts`

- [ ] **Step 1: Create shared blockContent type**

Create `studio/schemaTypes/blockContent.ts`:

```typescript
import { defineArrayMember, defineType } from 'sanity'

export const blockContentType = defineType({
  name: 'blockContent',
  title: 'Block Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              { title: 'URL', name: 'href', type: 'url' },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alternative Text' },
        { name: 'caption', type: 'string', title: 'Caption' },
      ],
    }),
  ],
})
```

- [ ] **Step 2: Create strain schema**

Create `studio/schemaTypes/strain.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const strainType = defineType({
  name: 'strain',
  title: 'Strain',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'strainType',
      title: 'Strain Type',
      type: 'string',
      options: {
        list: [
          { title: 'Indica', value: 'indica' },
          { title: 'Sativa', value: 'sativa' },
          { title: 'Hybrid', value: 'hybrid' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'blockContent',
    }),
    defineField({
      name: 'effects',
      title: 'Effects',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'terpenes',
      title: 'Terpenes',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'thcRange',
      title: 'THC Range',
      type: 'string',
      description: 'e.g. "22-26%"',
    }),
    defineField({
      name: 'cbdRange',
      title: 'CBD Range',
      type: 'string',
      description: 'e.g. "<1%"',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative Text', type: 'string', validation: (rule) => rule.required() }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{
        type: 'image',
        options: { hotspot: true },
        fields: [{ name: 'alt', title: 'Alternative Text', type: 'string' }],
      }],
    }),
    defineField({
      name: 'nextHarvestDate',
      title: 'Next Expected Harvest Date',
      type: 'date',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'available',
      title: 'Available',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'strainType', media: 'heroImage' },
  },
})
```

- [ ] **Step 3: Update schema index**

Replace `studio/schemaTypes/index.ts`:

```typescript
import { blockContentType } from './blockContent'
import { strainType } from './strain'

export const schemaTypes = [
  blockContentType,
  strainType,
]
```

- [ ] **Step 4: Verify in Studio**

```bash
cd studio && npx sanity dev
```

Expected: Studio shows "Strain" document type in the sidebar. Create a test strain to verify all fields render correctly.

- [ ] **Step 5: Commit**

```bash
git add studio/schemaTypes/
git commit -m "feat: add blockContent and strain schemas"
```

---

### Task 3: Define Sanity Schemas — Product, Retailer, Blog Post

**Files:**
- Create: `studio/schemaTypes/product.ts`
- Create: `studio/schemaTypes/retailer.ts`
- Create: `studio/schemaTypes/blogPost.ts`
- Modify: `studio/schemaTypes/index.ts`

- [ ] **Step 1: Create product schema**

Create `studio/schemaTypes/product.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'strain',
      title: 'Strain',
      type: 'reference',
      to: [{ type: 'strain' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Flower', value: 'flower' },
          { title: 'Pre-Roll', value: 'preroll' },
          { title: 'Concentrate', value: 'concentrate' },
          { title: 'Edible', value: 'edible' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'weight',
      title: 'Weight',
      type: 'string',
      description: 'e.g. "1g", "3.5g", "1oz"',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'blockContent',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative Text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'available',
      title: 'Available',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'category', media: 'image' },
  },
})
```

- [ ] **Step 2: Create retailer schema**

Create `studio/schemaTypes/retailer.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const retailerType = defineType({
  name: 'retailer',
  title: 'Retailer',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Street Address',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'state',
      title: 'State',
      type: 'string',
      initialValue: 'WA',
      validation: (rule) => rule.required().max(2),
    }),
    defineField({
      name: 'zip',
      title: 'ZIP Code',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lat',
      title: 'Latitude',
      type: 'number',
      validation: (rule) => rule.min(-90).max(90),
    }),
    defineField({
      name: 'lng',
      title: 'Longitude',
      type: 'number',
      validation: (rule) => rule.min(-180).max(180),
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative Text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'productsAvailable',
      title: 'Products Available',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'city', media: 'logo' },
  },
})
```

- [ ] **Step 3: Create blogPost schema**

Create `studio/schemaTypes/blogPost.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const blogPostType = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'SEO excerpt. Max 160 characters.',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative Text', type: 'string', validation: (rule) => rule.required() }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'heroImage' },
  },
})
```

- [ ] **Step 4: Update schema index**

Replace `studio/schemaTypes/index.ts`:

```typescript
import { blockContentType } from './blockContent'
import { blogPostType } from './blogPost'
import { productType } from './product'
import { retailerType } from './retailer'
import { strainType } from './strain'

export const schemaTypes = [
  blockContentType,
  blogPostType,
  productType,
  retailerType,
  strainType,
]
```

- [ ] **Step 5: Verify in Studio**

```bash
cd studio && npx sanity dev
```

Expected: Studio shows Blog Post, Product, Retailer, and Strain in the sidebar. Verify Product's strain reference field shows the strain picker.

- [ ] **Step 6: Commit**

```bash
git add studio/schemaTypes/
git commit -m "feat: add product, retailer, and blogPost schemas"
```

---

### Task 4: Define Sanity Schemas — Singletons (Site Settings, Pages, Retailer Page)

**Files:**
- Create: `studio/schemaTypes/siteSettings.ts`
- Create: `studio/schemaTypes/page.ts`
- Create: `studio/schemaTypes/retailerPage.ts`
- Modify: `studio/schemaTypes/index.ts`
- Modify: `studio/sanity.config.ts`

- [ ] **Step 1: Create siteSettings schema**

Create `studio/schemaTypes/siteSettings.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative Text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url', validation: (rule) => rule.uri({ scheme: ['http', 'https'] }) }),
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url', validation: (rule) => rule.uri({ scheme: ['http', 'https'] }) }),
        defineField({ name: 'twitter', title: 'Twitter / X URL', type: 'url', validation: (rule) => rule.uri({ scheme: ['http', 'https'] }) }),
      ],
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'ageGateMessage',
      title: 'Age Gate Message',
      type: 'text',
      rows: 2,
      description: 'Message shown on the 21+ age verification gate.',
    }),
  ],
  preview: {
    select: { title: 'siteTitle' },
  },
})
```

- [ ] **Step 2: Create page schema**

Create `studio/schemaTypes/page.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pageId',
      title: 'Page ID',
      type: 'string',
      description: 'Identifies which page this content belongs to.',
      options: {
        list: [
          { title: 'Home', value: 'home' },
          { title: 'About', value: 'about' },
          { title: 'Contact', value: 'contact' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'string',
      description: 'Meta description. Max 160 characters.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative Text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'pageId', media: 'heroImage' },
  },
})
```

- [ ] **Step 3: Create retailerPage schema**

Create `studio/schemaTypes/retailerPage.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const retailerPageType = defineType({
  name: 'retailerPage',
  title: 'Retailer Page',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'blockContent',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Wholesale Contact Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'contactPhone',
      title: 'Wholesale Contact Phone',
      type: 'string',
    }),
    defineField({
      name: 'downloadables',
      title: 'Downloadable Files',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
          defineField({ name: 'file', title: 'File', type: 'file', validation: (rule) => rule.required().assetRequired() }),
        ],
        preview: { select: { title: 'label' } },
      }],
    }),
  ],
  preview: {
    select: { title: 'headline' },
  },
})
```

- [ ] **Step 4: Update schema index with all types**

Replace `studio/schemaTypes/index.ts`:

```typescript
import { blockContentType } from './blockContent'
import { blogPostType } from './blogPost'
import { pageType } from './page'
import { productType } from './product'
import { retailerPageType } from './retailerPage'
import { retailerType } from './retailer'
import { siteSettingsType } from './siteSettings'
import { strainType } from './strain'

export const schemaTypes = [
  blockContentType,
  blogPostType,
  pageType,
  productType,
  retailerPageType,
  retailerType,
  siteSettingsType,
  strainType,
]
```

- [ ] **Step 5: Configure Studio desk structure for singletons**

Update `studio/sanity.config.ts` to add custom desk structure that shows singletons as single items (not lists):

```typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

const SINGLETON_TYPES = new Set(['siteSettings', 'retailerPage'])
const SINGLETON_ACTIONS = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  name: 'nw-local',
  title: 'Northwest Local Cannabis',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            S.documentTypeListItem('strain').title('Strains'),
            S.documentTypeListItem('product').title('Products'),
            S.divider(),
            S.documentTypeListItem('blogPost').title('Blog Posts'),
            S.divider(),
            S.documentTypeListItem('retailer').title('Retailers'),
            S.listItem()
              .title('For Retailers Page')
              .id('retailerPage')
              .child(S.document().schemaType('retailerPage').documentId('retailerPage')),
            S.divider(),
            S.documentTypeListItem('page').title('Pages'),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },
  document: {
    actions: (input, context) =>
      SINGLETON_TYPES.has(context.schemaType)
        ? input.filter(({ action }) => action && SINGLETON_ACTIONS.has(action))
        : input,
  },
})
```

- [ ] **Step 6: Verify singletons in Studio**

```bash
cd studio && npx sanity dev
```

Expected: Sidebar shows "Site Settings" and "For Retailers Page" as single document links (not lists). "Strains", "Products", "Blog Posts", "Retailers", and "Pages" appear as lists. Create a Site Settings document and verify all fields.

- [ ] **Step 7: Commit**

```bash
git add studio/
git commit -m "feat: add singleton schemas and custom desk structure"
```

---

### Task 5: Install Astro Dependencies and Configure Sanity Client

**Files:**
- Modify: `package.json` (via yarn add)
- Modify: `astro.config.mjs`
- Create: `src/lib/sanity.ts`
- Create: `src/lib/image.ts`
- Modify: `src/env.d.ts` or create if needed

- [ ] **Step 1: Install dependencies**

```bash
yarn add @sanity/client @sanity/image-url astro-portabletext
```

- [ ] **Step 2: Update astro.config.mjs**

Replace `astro.config.mjs`:

```javascript
// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.nw-local.com',
  integrations: [sitemap()],
});
```

Note: We remove `@astrojs/mdx` since all content comes from Sanity now.

- [ ] **Step 3: Uninstall unused packages**

```bash
yarn remove @astrojs/mdx @astrojs/rss
```

We'll re-add RSS support later using Sanity data instead of file-based content.

- [ ] **Step 4: Create Sanity client and query functions**

Create `src/lib/sanity.ts`:

```typescript
import { createClient } from '@sanity/client'

const SANITY_PROJECT_ID = import.meta.env.SANITY_PROJECT_ID
const SANITY_DATASET = import.meta.env.SANITY_DATASET
const SANITY_API_TOKEN = import.meta.env.SANITY_API_TOKEN

if (!SANITY_PROJECT_ID) throw new Error('Missing SANITY_PROJECT_ID env var')
if (!SANITY_DATASET) throw new Error('Missing SANITY_DATASET env var')

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2026-04-14',
  useCdn: true,
  token: SANITY_API_TOKEN,
})

// --- Strains ---

export async function getStrains() {
  return sanityClient.fetch(
    `*[_type == "strain"] | order(sortOrder asc, name asc) {
      _id, name, slug, strainType, effects, terpenes,
      thcRange, cbdRange, nextHarvestDate,
      heroImage { asset->, alt },
      featured, available
    }`
  )
}

export async function getStrain(slug: string) {
  return sanityClient.fetch(
    `*[_type == "strain" && slug.current == $slug][0] {
      _id, name, slug, strainType, description,
      effects, terpenes, thcRange, cbdRange, nextHarvestDate,
      heroImage { asset->, alt },
      gallery[] { asset->, alt },
      featured, available
    }`,
    { slug }
  )
}

// --- Products ---

export async function getProducts() {
  return sanityClient.fetch(
    `*[_type == "product"] | order(sortOrder asc, name asc) {
      _id, name, slug, category, weight, available,
      image { asset->, alt },
      "strain": strain->{ _id, name, slug, strainType, heroImage { asset->, alt } }
    }`
  )
}

export async function getProductsByStrain(strainId: string) {
  return sanityClient.fetch(
    `*[_type == "product" && strain._ref == $strainId] | order(sortOrder asc) {
      _id, name, slug, category, weight, available,
      image { asset->, alt },
      description
    }`,
    { strainId }
  )
}

// --- Blog ---

export async function getBlogPosts() {
  return sanityClient.fetch(
    `*[_type == "blogPost"] | order(publishedAt desc) {
      _id, title, slug, description, publishedAt, tags,
      heroImage { asset->, alt }
    }`
  )
}

export async function getBlogPost(slug: string) {
  return sanityClient.fetch(
    `*[_type == "blogPost" && slug.current == $slug][0] {
      _id, title, slug, description, publishedAt, tags,
      heroImage { asset->, alt },
      body[] {
        ...,
        _type == "image" => { asset->, alt, caption }
      }
    }`,
    { slug }
  )
}

// --- Retailers ---

export async function getRetailers() {
  return sanityClient.fetch(
    `*[_type == "retailer"] | order(city asc, name asc) {
      _id, name, slug, address, city, state, zip,
      lat, lng, website, phone, email,
      logo { asset->, alt },
      featured,
      productsAvailable[]->{ _id, name, slug, category }
    }`
  )
}

// --- Pages (singletons by pageId) ---

export async function getPage(pageId: string) {
  return sanityClient.fetch(
    `*[_type == "page" && pageId == $pageId][0] {
      _id, title, pageId, seoDescription,
      heroImage { asset->, alt },
      body[] {
        ...,
        _type == "image" => { asset->, alt, caption }
      }
    }`,
    { pageId }
  )
}

// --- Site Settings ---

export async function getSiteSettings() {
  return sanityClient.fetch(
    `*[_type == "siteSettings"][0] {
      siteTitle, siteDescription,
      logo { asset->, alt },
      socialLinks,
      contactEmail, contactPhone, address,
      ageGateMessage
    }`
  )
}

// --- Retailer Page ---

export async function getRetailerPage() {
  return sanityClient.fetch(
    `*[_type == "retailerPage"][0] {
      headline, intro[] {
        ...,
        _type == "image" => { asset->, alt, caption }
      },
      contactEmail, contactPhone,
      "downloadables": downloadables[] { label, "url": file.asset->url }
    }`
  )
}
```

- [ ] **Step 5: Create image URL builder**

Create `src/lib/image.ts`:

```typescript
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { sanityClient } from './sanity'

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
```

- [ ] **Step 6: Verify build doesn't break**

```bash
yarn build
```

Expected: Build may warn about unused pages referencing old content collections, but should not error on the new lib files. We'll clean up old files in the next task.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ astro.config.mjs package.json yarn.lock
git commit -m "feat: add Sanity client, GROQ queries, and image builder"
```

---

### Task 6: Remove Old Content System and Scaffold New Layout

**Files:**
- Delete: `src/content/` (entire directory)
- Delete: `src/content.config.ts`
- Delete: `src/consts.ts`
- Delete: `src/components/FormattedDate.astro`
- Delete: `src/components/HeaderLink.astro`
- Delete: `src/layouts/BlogPost.astro`
- Delete: `src/pages/rss.xml.js`
- Create: `src/layouts/Layout.astro`
- Modify: `src/components/BaseHead.astro`

- [ ] **Step 1: Delete old content files**

```bash
rm -rf src/content src/content.config.ts src/consts.ts
rm src/components/FormattedDate.astro src/components/HeaderLink.astro
rm src/layouts/BlogPost.astro src/pages/rss.xml.js
```

- [ ] **Step 2: Create base Layout component**

Create `src/layouts/Layout.astro`:

```astro
---
import BaseHead from '../components/BaseHead.astro'
import Nav from '../components/Nav.astro'
import Footer from '../components/Footer.astro'
import AgeGate from '../components/AgeGate.astro'
import { getSiteSettings } from '../lib/sanity'

interface Props {
  title: string
  description: string
  ogImage?: string
}

const { title, description, ogImage } = Astro.props
const settings = await getSiteSettings()
---

<!doctype html>
<html lang="en">
  <head>
    <BaseHead title={title} description={description} ogImage={ogImage} />
  </head>
  <body>
    <AgeGate message={settings?.ageGateMessage} />
    <Nav settings={settings} />
    <main>
      <slot />
    </main>
    <Footer settings={settings} />
  </body>
</html>
```

- [ ] **Step 3: Update BaseHead component**

Replace `src/components/BaseHead.astro`:

```astro
---
import '../styles/global.css'

interface Props {
  title: string
  description: string
  ogImage?: string
}

const canonicalURL = new URL(Astro.url.pathname, Astro.site)
const { title, description, ogImage } = Astro.props
---

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" href="/favicon.ico" />
<link rel="sitemap" href="/sitemap-index.xml" />
<meta name="generator" content={Astro.generator} />

<link rel="canonical" href={canonicalURL} />

<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />

<meta property="og:type" content="website" />
<meta property="og:url" content={Astro.url} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
{ogImage && <meta property="og:image" content={ogImage} />}

<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content={Astro.url} />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
{ogImage && <meta property="twitter:image" content={ogImage} />}
```

- [ ] **Step 4: Create placeholder Nav component**

Create `src/components/Nav.astro`:

```astro
---
interface Props {
  settings: {
    siteTitle?: string
    logo?: { asset: { url: string }; alt?: string }
  }
}

const { settings } = Astro.props
const currentPath = Astro.url.pathname

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/strains', label: 'Strains' },
  { href: '/products', label: 'Products' },
  { href: '/find-us', label: 'Find Us' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]
---

<header>
  <nav>
    <a href="/" class="nav-logo">
      {settings?.siteTitle ?? 'Northwest Local Cannabis'}
    </a>
    <div class="nav-links">
      {NAV_LINKS.map((link) => (
        <a href={link.href} class:list={[{ active: currentPath === link.href }]}>
          {link.label}
        </a>
      ))}
      <a href="/retailers" class="nav-retailers-cta">For Retailers</a>
    </div>
  </nav>
</header>
```

- [ ] **Step 5: Create placeholder Footer component**

Replace `src/components/Footer.astro`:

```astro
---
interface Props {
  settings: {
    contactEmail?: string
    contactPhone?: string
    address?: string
    socialLinks?: {
      instagram?: string
      facebook?: string
      twitter?: string
    }
  }
}

const { settings } = Astro.props
---

<footer>
  <div class="footer-content">
    <div class="footer-nav">
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/strains">Strains</a>
      <a href="/products">Products</a>
      <a href="/find-us">Find Us</a>
      <a href="/blog">Blog</a>
      <a href="/contact">Contact</a>
      <a href="/retailers">For Retailers</a>
    </div>
    <div class="footer-contact">
      {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}
      {settings?.contactPhone && <a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a>}
    </div>
    <div class="footer-social">
      {settings?.socialLinks?.instagram && <a href={settings.socialLinks.instagram} target="_blank" rel="noopener">Instagram</a>}
      {settings?.socialLinks?.facebook && <a href={settings.socialLinks.facebook} target="_blank" rel="noopener">Facebook</a>}
      {settings?.socialLinks?.twitter && <a href={settings.socialLinks.twitter} target="_blank" rel="noopener">X</a>}
    </div>
    <p class="footer-legal">&copy; {new Date().getFullYear()} Northwest Local Cannabis. All rights reserved.</p>
  </div>
</footer>
```

- [ ] **Step 6: Create AgeGate component**

Create `src/components/AgeGate.astro`:

```astro
---
interface Props {
  message?: string
}

const { message } = Astro.props
const DEFAULT_MESSAGE = 'You must be 21 years or older to view this site.'
---

<div id="age-gate" class="age-gate" style="display:none;">
  <div class="age-gate-content">
    <h2>Age Verification</h2>
    <p>{message ?? DEFAULT_MESSAGE}</p>
    <button id="age-gate-confirm" class="age-gate-button">I am 21 or older</button>
    <a href="https://www.google.com" class="age-gate-deny">I am under 21</a>
  </div>
</div>

<script>
  const AGE_GATE_KEY = 'nw-local-age-verified'

  function initAgeGate() {
    const gate = document.getElementById('age-gate')
    const confirmButton = document.getElementById('age-gate-confirm')

    if (!gate || !confirmButton) return

    if (localStorage.getItem(AGE_GATE_KEY) === 'true') {
      gate.style.display = 'none'
      return
    }

    gate.style.display = 'flex'
    document.body.style.overflow = 'hidden'

    confirmButton.addEventListener('click', () => {
      localStorage.setItem(AGE_GATE_KEY, 'true')
      gate.style.display = 'none'
      document.body.style.overflow = ''
    })
  }

  initAgeGate()
</script>
```

- [ ] **Step 7: Update index.astro to use new Layout (temporary placeholder)**

Replace `src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import { getSiteSettings } from '../lib/sanity'

const settings = await getSiteSettings()
---

<Layout
  title={settings?.siteTitle ?? 'Northwest Local Cannabis'}
  description={settings?.siteDescription ?? 'Washington State licensed cannabis producer and processor.'}
>
  <h1>Northwest Local Cannabis</h1>
  <p>Site under construction.</p>
</Layout>
```

- [ ] **Step 8: Remove unused pages temporarily**

```bash
rm src/pages/about.astro src/pages/blog/index.astro src/pages/blog/\[...slug\].astro
```

We'll recreate these in later tasks.

- [ ] **Step 9: Verify dev server starts**

```bash
yarn dev
```

Expected: Dev server starts at localhost:4321. Home page shows placeholder content with nav and footer. Age gate appears on first visit. Note: Sanity queries will return null if no content exists in Sanity yet — that's fine, the page should still render.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: replace old content system with Sanity-powered layout"
```

---

### Task 7: Global Styles — Dark + Electric Green Theme

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace global.css with dark theme**

Replace `src/styles/global.css`:

```css
:root {
  --bg: #111111;
  --bg-surface: #1a1a1a;
  --accent: #00ff88;
  --accent-hover: #00cc6e;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --border: #333333;
  --max-width: 1200px;
  --content-width: 720px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  background-color: var(--bg);
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 18px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

main {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--text-primary);
  line-height: 1.2;
  font-weight: 800;
}

h1 { font-size: 3rem; letter-spacing: -0.02em; }
h2 { font-size: 2.25rem; letter-spacing: -0.01em; }
h3 { font-size: 1.5rem; }
h4 { font-size: 1.25rem; }

a {
  color: var(--accent);
  text-decoration: none;
  transition: color 0.2s;
}

a:hover {
  color: var(--accent-hover);
}

p {
  margin-bottom: 1em;
  color: var(--text-secondary);
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* --- Navigation --- */

header {
  border-bottom: 1px solid var(--border);
}

header nav {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.nav-logo:hover {
  color: var(--accent);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-links a {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.active {
  color: var(--text-primary);
}

.nav-retailers-cta {
  background: var(--accent);
  color: var(--bg) !important;
  padding: 0.4rem 1rem;
  font-weight: 700 !important;
  border-radius: 4px;
  transition: background 0.2s !important;
}

.nav-retailers-cta:hover {
  background: var(--accent-hover);
}

/* --- Footer --- */

footer {
  border-top: 1px solid var(--border);
  margin-top: 4rem;
}

.footer-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 3rem 1.5rem 2rem;
  display: grid;
  gap: 1.5rem;
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.footer-nav a {
  font-size: 0.85rem;
  color: var(--text-secondary);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.footer-nav a:hover {
  color: var(--text-primary);
}

.footer-contact {
  display: flex;
  gap: 2rem;
}

.footer-contact a {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.footer-social {
  display: flex;
  gap: 1.5rem;
}

.footer-social a {
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.footer-legal {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.6;
}

/* --- Age Gate --- */

.age-gate {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.age-gate-content {
  text-align: center;
  max-width: 420px;
  padding: 2rem;
}

.age-gate-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.age-gate-content p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.age-gate-button {
  background: var(--accent);
  color: var(--bg);
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.age-gate-button:hover {
  background: var(--accent-hover);
}

.age-gate-deny {
  display: block;
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* --- Hero --- */

.hero {
  padding: 4rem 0;
  text-align: left;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.05;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.15rem;
  max-width: 600px;
}

.hero-accent {
  width: 60px;
  height: 3px;
  background: var(--accent);
  margin: 1.5rem 0;
}

/* --- Section Heading --- */

.section-heading {
  margin-bottom: 2rem;
}

.section-heading h2 {
  text-transform: uppercase;
  letter-spacing: 2px;
}

.section-heading-line {
  width: 60px;
  height: 3px;
  background: var(--accent);
  margin-top: 0.5rem;
}

/* --- Cards (shared) --- */

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--accent);
}

.card-image {
  aspect-ratio: 16 / 10;
  background: var(--bg);
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body {
  padding: 1.25rem;
}

.card-body h3 {
  font-size: 1.15rem;
  margin-bottom: 0.5rem;
}

.card-body p {
  font-size: 0.9rem;
  line-height: 1.5;
}

/* --- Product Badge --- */

.product-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 3px;
  background: var(--border);
  color: var(--text-secondary);
}

.product-badge[data-type="indica"] { background: #2a1f4e; color: #b89aff; }
.product-badge[data-type="sativa"] { background: #1f3a1f; color: #88ff88; }
.product-badge[data-type="hybrid"] { background: #3a2f1f; color: #ffcc66; }

/* --- Filter Bar --- */

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.filter-button {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.filter-button:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

.filter-button.active {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(0, 255, 136, 0.1);
}

/* --- Contact Info --- */

.contact-info {
  display: grid;
  gap: 1rem;
}

.contact-info dt {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--accent);
}

.contact-info dd {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

/* --- Portable Text --- */

.portable-text h2 { margin: 2rem 0 1rem; }
.portable-text h3 { margin: 1.5rem 0 0.75rem; }
.portable-text p { margin-bottom: 1.25em; }
.portable-text ul, .portable-text ol { margin: 0 0 1.25em 1.5em; color: var(--text-secondary); }
.portable-text li { margin-bottom: 0.5em; }
.portable-text blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 1.25rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--text-secondary);
}
.portable-text img { border-radius: 8px; margin: 1.5rem 0; }
.portable-text a { color: var(--accent); }
.portable-text code {
  background: var(--bg-surface);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

/* --- Responsive --- */

@media (max-width: 768px) {
  h1 { font-size: 2.25rem; }
  h2 { font-size: 1.75rem; }
  .hero h1 { font-size: 2.5rem; }

  header nav {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verify the theme in dev server**

```bash
yarn dev
```

Expected: Dark background, white text, green accent on the "For Retailers" nav button. Age gate should appear with the dark overlay and green confirm button.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: dark + electric green theme"
```

---

### Task 8: Reusable UI Components

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/SectionHeading.astro`
- Create: `src/components/ContactInfo.astro`
- Create: `src/components/PortableText.astro`
- Create: `src/components/ProductBadge.astro`

- [ ] **Step 1: Create Hero component**

Create `src/components/Hero.astro`:

```astro
---
interface Props {
  title: string
  subtitle?: string
}

const { title, subtitle } = Astro.props
---

<section class="hero">
  <h1>{title}</h1>
  <div class="hero-accent"></div>
  {subtitle && <p>{subtitle}</p>}
  <slot />
</section>
```

- [ ] **Step 2: Create SectionHeading component**

Create `src/components/SectionHeading.astro`:

```astro
---
interface Props {
  title: string
}

const { title } = Astro.props
---

<div class="section-heading">
  <h2>{title}</h2>
  <div class="section-heading-line"></div>
</div>
```

- [ ] **Step 3: Create ContactInfo component**

Create `src/components/ContactInfo.astro`:

```astro
---
interface Props {
  email?: string
  phone?: string
  address?: string
}

const { email, phone, address } = Astro.props
---

<dl class="contact-info">
  {email && (
    <>
      <dt>Email</dt>
      <dd><a href={`mailto:${email}`}>{email}</a></dd>
    </>
  )}
  {phone && (
    <>
      <dt>Phone</dt>
      <dd><a href={`tel:${phone}`}>{phone}</a></dd>
    </>
  )}
  {address && (
    <>
      <dt>Address</dt>
      <dd set:html={address.replace(/\n/g, '<br />')} />
    </>
  )}
</dl>
```

- [ ] **Step 4: Create PortableText component**

Create `src/components/PortableText.astro`:

```astro
---
import { PortableText as PT } from 'astro-portabletext'
import { urlFor } from '../lib/image'

const { value } = Astro.props
---

<div class="portable-text">
  <PT value={value} />
</div>
```

Note: `astro-portabletext` handles standard block content (headings, lists, marks, links) out of the box. For inline images, we may need to add a custom image component later — for now the default rendering is sufficient.

- [ ] **Step 5: Create ProductBadge component**

Create `src/components/ProductBadge.astro`:

```astro
---
interface Props {
  type: string
  label?: string
}

const { type, label } = Astro.props

const LABELS: Record<string, string> = {
  indica: 'Indica',
  sativa: 'Sativa',
  hybrid: 'Hybrid',
  flower: 'Flower',
  preroll: 'Pre-Roll',
  concentrate: 'Concentrate',
  edible: 'Edible',
  other: 'Other',
}
---

<span class="product-badge" data-type={type}>
  {label ?? LABELS[type] ?? type}
</span>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add Hero, SectionHeading, ContactInfo, PortableText, ProductBadge components"
```

---

### Task 9: Content Card Components

**Files:**
- Create: `src/components/StrainCard.astro`
- Create: `src/components/ProductCard.astro`
- Create: `src/components/RetailerCard.astro`
- Create: `src/components/BlogPostCard.astro`
- Create: `src/components/FilterBar.astro`

- [ ] **Step 1: Create StrainCard component**

Create `src/components/StrainCard.astro`:

```astro
---
import { urlFor } from '../lib/image'
import ProductBadge from './ProductBadge.astro'

interface Props {
  name: string
  slug: { current: string }
  strainType: string
  effects?: string[]
  heroImage?: { asset: { url: string }; alt?: string }
  available: boolean
}

const { name, slug, strainType, effects, heroImage, available } = Astro.props
---

<a href={`/strains/${slug.current}`} class="card">
  <div class="card-image">
    {heroImage?.asset && (
      <img
        src={urlFor(heroImage).width(600).height(375).format('webp').url()}
        alt={heroImage.alt ?? name}
        width="600"
        height="375"
        loading="lazy"
      />
    )}
  </div>
  <div class="card-body">
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
      <ProductBadge type={strainType} />
      {!available && <span class="product-badge">Unavailable</span>}
    </div>
    <h3>{name}</h3>
    {effects && effects.length > 0 && (
      <p>{effects.slice(0, 3).join(' · ')}</p>
    )}
  </div>
</a>
```

- [ ] **Step 2: Create ProductCard component**

Create `src/components/ProductCard.astro`:

```astro
---
import { urlFor } from '../lib/image'
import ProductBadge from './ProductBadge.astro'

interface Props {
  name: string
  slug: { current: string }
  category: string
  weight?: string
  available: boolean
  image?: { asset: { url: string }; alt?: string }
  strain?: {
    name: string
    slug: { current: string }
    strainType: string
    heroImage?: { asset: { url: string }; alt?: string }
  }
}

const { name, category, weight, available, image, strain } = Astro.props
const displayImage = image ?? strain?.heroImage
---

<div class="card" data-category={category}>
  <div class="card-image">
    {displayImage?.asset && (
      <img
        src={urlFor(displayImage).width(600).height(375).format('webp').url()}
        alt={displayImage.alt ?? name}
        width="600"
        height="375"
        loading="lazy"
      />
    )}
  </div>
  <div class="card-body">
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
      <ProductBadge type={category} />
      {weight && <span class="product-badge">{weight}</span>}
      {!available && <span class="product-badge">Unavailable</span>}
    </div>
    <h3>{name}</h3>
    {strain && (
      <p>
        <a href={`/strains/${strain.slug.current}`}>
          {strain.name}
        </a>
        {' · '}
        <ProductBadge type={strain.strainType} />
      </p>
    )}
  </div>
</div>
```

- [ ] **Step 3: Create RetailerCard component**

Create `src/components/RetailerCard.astro`:

```astro
---
interface Props {
  name: string
  address: string
  city: string
  state: string
  zip: string
  website?: string
  phone?: string
  email?: string
}

const { name, address, city, state, zip, website, phone, email } = Astro.props
---

<div class="card">
  <div class="card-body">
    <h3>{name}</h3>
    <p>{address}<br />{city}, {state} {zip}</p>
    <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-top:0.75rem;">
      {website && <a href={website} target="_blank" rel="noopener">Website</a>}
      {phone && <a href={`tel:${phone}`}>{phone}</a>}
      {email && <a href={`mailto:${email}`}>Email</a>}
    </div>
  </div>
</div>
```

- [ ] **Step 4: Create BlogPostCard component**

Create `src/components/BlogPostCard.astro`:

```astro
---
import { urlFor } from '../lib/image'

interface Props {
  title: string
  slug: { current: string }
  description: string
  publishedAt: string
  heroImage?: { asset: { url: string }; alt?: string }
}

const { title, slug, description, publishedAt, heroImage } = Astro.props
const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
---

<a href={`/blog/${slug.current}`} class="card">
  <div class="card-image">
    {heroImage?.asset && (
      <img
        src={urlFor(heroImage).width(600).height(375).format('webp').url()}
        alt={heroImage.alt ?? title}
        width="600"
        height="375"
        loading="lazy"
      />
    )}
  </div>
  <div class="card-body">
    <p style="font-size:0.75rem;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem;">
      {formattedDate}
    </p>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
</a>
```

- [ ] **Step 5: Create FilterBar component**

Create `src/components/FilterBar.astro`:

```astro
---
interface Props {
  filters: { value: string; label: string }[]
  filterAttribute?: string
}

const { filters, filterAttribute = 'data-category' } = Astro.props
---

<div class="filter-bar" data-filter-attribute={filterAttribute}>
  <button class="filter-button active" data-filter="all">All</button>
  {filters.map((filter) => (
    <button class="filter-button" data-filter={filter.value}>
      {filter.label}
    </button>
  ))}
</div>

<script>
  function initFilterBars() {
    document.querySelectorAll<HTMLElement>('.filter-bar').forEach((bar) => {
      const attribute = bar.dataset.filterAttribute ?? 'data-category'
      const buttons = bar.querySelectorAll<HTMLButtonElement>('.filter-button')
      const cards = bar.parentElement?.querySelectorAll<HTMLElement>(`[${attribute}]`) ?? []

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          const filter = button.dataset.filter

          buttons.forEach((buttonElement) => buttonElement.classList.remove('active'))
          button.classList.add('active')

          cards.forEach((card) => {
            if (filter === 'all' || card.getAttribute(attribute) === filter) {
              card.style.display = ''
            } else {
              card.style.display = 'none'
            }
          })
        })
      })
    })
  }

  initFilterBars()
</script>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add StrainCard, ProductCard, RetailerCard, BlogPostCard, and FilterBar components"
```

---

### Task 10: Home Page

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Build the home page**

Replace `src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import Hero from '../components/Hero.astro'
import SectionHeading from '../components/SectionHeading.astro'
import StrainCard from '../components/StrainCard.astro'
import { getSiteSettings, getStrains, getPage } from '../lib/sanity'

const settings = await getSiteSettings()
const page = await getPage('home')
const allStrains = await getStrains() ?? []
const featuredStrains = allStrains.filter((strain: { featured: boolean }) => strain.featured)
---

<Layout
  title={page?.title ?? settings?.siteTitle ?? 'Northwest Local Cannabis'}
  description={page?.seoDescription ?? settings?.siteDescription ?? 'Washington State licensed cannabis producer and processor.'}
>
  <Hero
    title="Grown Different."
    subtitle="Washington State craft cannabis — from seed to shelf."
  >
    <div style="display:flex;gap:1rem;margin-top:1.5rem;">
      <a href="/strains" class="nav-retailers-cta" style="text-decoration:none;font-size:0.85rem;padding:0.6rem 1.5rem;">
        Explore Strains
      </a>
      <a href="/retailers" style="border:1px solid var(--border);color:var(--text-secondary);padding:0.6rem 1.5rem;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;border-radius:4px;">
        Wholesale
      </a>
    </div>
  </Hero>

  {featuredStrains.length > 0 && (
    <section style="margin-top:3rem;">
      <SectionHeading title="Featured Strains" />
      <div class="card-grid">
        {featuredStrains.map((strain: Record<string, unknown>) => (
          <StrainCard {...strain as any} />
        ))}
      </div>
    </section>
  )}

  <section style="margin-top:4rem;display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
    <a href="/find-us" class="card" style="text-decoration:none;">
      <div class="card-body" style="padding:2rem;">
        <h3 style="text-transform:uppercase;letter-spacing:2px;">Find Our Products</h3>
        <p>See which dispensaries carry Northwest Local Cannabis.</p>
      </div>
    </a>
    <a href="/retailers" class="card" style="text-decoration:none;">
      <div class="card-body" style="padding:2rem;">
        <h3 style="text-transform:uppercase;letter-spacing:2px;">Partner With Us</h3>
        <p>Interested in carrying our products? Get in touch.</p>
      </div>
    </a>
  </section>
</Layout>
```

- [ ] **Step 2: Verify in dev server**

```bash
yarn dev
```

Expected: Home page shows hero with "GROWN DIFFERENT." headline, green accent line, two CTA buttons, featured strains section (empty if no Sanity content yet), and two bottom cards linking to Find Us and For Retailers.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: build home page with hero, featured strains, and CTAs"
```

---

### Task 11: About Page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Build the about page**

Create `src/pages/about.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import Hero from '../components/Hero.astro'
import PortableText from '../components/PortableText.astro'
import { getPage } from '../lib/sanity'
import { urlFor } from '../lib/image'

const page = await getPage('about')
---

<Layout
  title={page?.title ?? 'About'}
  description={page?.seoDescription ?? 'About Northwest Local Cannabis.'}
>
  <Hero title={page?.title ?? 'About Us'} />

  {page?.heroImage?.asset && (
    <img
      src={urlFor(page.heroImage).width(1200).height(500).format('webp').url()}
      alt={page.heroImage.alt ?? ''}
      width="1200"
      height="500"
      style="border-radius:8px;margin-bottom:2rem;object-fit:cover;width:100%;"
    />
  )}

  {page?.body && (
    <div style="max-width:var(--content-width);">
      <PortableText value={page.body} />
    </div>
  )}
</Layout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: build about page with CMS content"
```

---

### Task 12: Strains Pages (List + Detail)

**Files:**
- Create: `src/pages/strains/index.astro`
- Create: `src/pages/strains/[...slug].astro`

- [ ] **Step 1: Build strains listing page**

Create `src/pages/strains/index.astro`:

```astro
---
import Layout from '../../layouts/Layout.astro'
import Hero from '../../components/Hero.astro'
import SectionHeading from '../../components/SectionHeading.astro'
import StrainCard from '../../components/StrainCard.astro'
import FilterBar from '../../components/FilterBar.astro'
import { getStrains } from '../../lib/sanity'

const strains = await getStrains() ?? []

const STRAIN_FILTERS = [
  { value: 'indica', label: 'Indica' },
  { value: 'sativa', label: 'Sativa' },
  { value: 'hybrid', label: 'Hybrid' },
]
---

<Layout title="Strains" description="Explore our craft cannabis strains.">
  <Hero title="Our Strains" subtitle="Craft genetics grown in Washington State." />

  <FilterBar filters={STRAIN_FILTERS} filterAttribute="data-strain-type" />

  <div class="card-grid">
    {strains.map((strain: Record<string, unknown>) => (
      <div data-strain-type={strain.strainType as string}>
        <StrainCard {...strain as any} />
      </div>
    ))}
  </div>

  {strains.length === 0 && (
    <p style="text-align:center;margin-top:2rem;">No strains available yet. Check back soon.</p>
  )}
</Layout>
```

Note: The FilterBar script finds filterable elements by querying for elements with the matching `data-*` attribute within the parent container. The wrapper div carries `data-strain-type` because StrainCard renders an `<a class="card">` internally.

- [ ] **Step 2: Build strain detail page**

Create `src/pages/strains/[...slug].astro`:

```astro
---
import Layout from '../../layouts/Layout.astro'
import Hero from '../../components/Hero.astro'
import PortableText from '../../components/PortableText.astro'
import ProductBadge from '../../components/ProductBadge.astro'
import ProductCard from '../../components/ProductCard.astro'
import SectionHeading from '../../components/SectionHeading.astro'
import { getStrains, getStrain, getProductsByStrain } from '../../lib/sanity'
import { urlFor } from '../../lib/image'

export async function getStaticPaths() {
  const strains = await getStrains() ?? []
  return strains.map((strain: { slug: { current: string } }) => ({
    params: { slug: strain.slug.current },
  }))
}

const { slug } = Astro.params
const strain = await getStrain(slug!)
if (!strain) return Astro.redirect('/strains')

const products = await getProductsByStrain(strain._id) ?? []
---

<Layout title={strain.name} description={`${strain.name} — ${strain.strainType} cannabis strain by Northwest Local Cannabis.`}>
  <Hero title={strain.name}>
    <div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.5rem;">
      <ProductBadge type={strain.strainType} />
      {strain.thcRange && <span style="color:var(--text-secondary);font-size:0.9rem;">THC: {strain.thcRange}</span>}
      {strain.cbdRange && <span style="color:var(--text-secondary);font-size:0.9rem;">CBD: {strain.cbdRange}</span>}
    </div>
  </Hero>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:3rem;">
    <div>
      {strain.heroImage?.asset && (
        <img
          src={urlFor(strain.heroImage).width(800).height(600).format('webp').url()}
          alt={strain.heroImage.alt ?? strain.name}
          width="800"
          height="600"
          style="border-radius:8px;width:100%;object-fit:cover;"
        />
      )}
    </div>
    <div>
      {strain.description && <PortableText value={strain.description} />}

      {strain.effects && strain.effects.length > 0 && (
        <div style="margin-top:1.5rem;">
          <h4 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:0.75rem;">Effects</h4>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
            {strain.effects.map((effect: string) => (
              <span class="product-badge">{effect}</span>
            ))}
          </div>
        </div>
      )}

      {strain.terpenes && strain.terpenes.length > 0 && (
        <div style="margin-top:1.5rem;">
          <h4 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:2px;color:var(--accent);margin-bottom:0.75rem;">Terpenes</h4>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
            {strain.terpenes.map((terpene: string) => (
              <span class="product-badge">{terpene}</span>
            ))}
          </div>
        </div>
      )}

      {strain.nextHarvestDate && (
        <p style="margin-top:1.5rem;color:var(--accent);font-weight:600;">
          Next harvest: {new Date(strain.nextHarvestDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      )}
    </div>
  </div>

  {strain.gallery && strain.gallery.length > 0 && (
    <section style="margin-bottom:3rem;">
      <SectionHeading title="Gallery" />
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:1rem;">
        {strain.gallery.map((image: { asset: { url: string }; alt?: string }) => (
          <img
            src={urlFor(image).width(500).height(500).format('webp').url()}
            alt={image.alt ?? ''}
            width="500"
            height="500"
            style="border-radius:8px;object-fit:cover;width:100%;aspect-ratio:1;"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  )}

  {products.length > 0 && (
    <section>
      <SectionHeading title="Products" />
      <div class="card-grid">
        {products.map((product: Record<string, unknown>) => (
          <ProductCard {...product as any} />
        ))}
      </div>
    </section>
  )}
</Layout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/strains/
git commit -m "feat: build strains listing and detail pages"
```

---

### Task 13: Products Page

**Files:**
- Create: `src/pages/products.astro`

- [ ] **Step 1: Build the products page**

Create `src/pages/products.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import Hero from '../components/Hero.astro'
import ProductCard from '../components/ProductCard.astro'
import FilterBar from '../components/FilterBar.astro'
import { getProducts } from '../lib/sanity'

const products = await getProducts() ?? []

const CATEGORY_FILTERS = [
  { value: 'flower', label: 'Flower' },
  { value: 'preroll', label: 'Pre-Rolls' },
  { value: 'concentrate', label: 'Concentrates' },
  { value: 'edible', label: 'Edibles' },
]
---

<Layout title="Products" description="Browse all Northwest Local Cannabis products.">
  <Hero title="Products" subtitle="Browse our full product lineup." />

  <FilterBar filters={CATEGORY_FILTERS} />

  <div class="card-grid">
    {products.map((product: Record<string, unknown>) => (
      <ProductCard {...product as any} />
    ))}
  </div>

  {products.length === 0 && (
    <p style="text-align:center;margin-top:2rem;">No products available yet. Check back soon.</p>
  )}
</Layout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/products.astro
git commit -m "feat: build products page with category filtering"
```

---

### Task 14: Find Us and For Retailers Pages

**Files:**
- Create: `src/pages/find-us.astro`
- Create: `src/pages/retailers.astro`

- [ ] **Step 1: Build the Find Us page**

Create `src/pages/find-us.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import Hero from '../components/Hero.astro'
import RetailerCard from '../components/RetailerCard.astro'
import { getRetailers } from '../lib/sanity'

const retailers = await getRetailers() ?? []

const retailersByCity: Record<string, typeof retailers> = {}
for (const retailer of retailers) {
  const city = retailer.city ?? 'Other'
  if (!retailersByCity[city]) retailersByCity[city] = []
  retailersByCity[city].push(retailer)
}
const sortedCities = Object.keys(retailersByCity).sort()
---

<Layout title="Find Us" description="Find Northwest Local Cannabis products at dispensaries near you.">
  <Hero title="Find Us" subtitle="Dispensaries carrying our products across Washington State." />

  {sortedCities.map((city) => (
    <section style="margin-bottom:2.5rem;">
      <h3 style="text-transform:uppercase;letter-spacing:2px;font-size:1rem;color:var(--accent);margin-bottom:1rem;">{city}</h3>
      <div class="card-grid">
        {retailersByCity[city].map((retailer: Record<string, unknown>) => (
          <RetailerCard {...retailer as any} />
        ))}
      </div>
    </section>
  ))}

  {retailers.length === 0 && (
    <p style="text-align:center;margin-top:2rem;">Retailer listings coming soon.</p>
  )}
</Layout>
```

- [ ] **Step 2: Build the For Retailers page**

Create `src/pages/retailers.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import Hero from '../components/Hero.astro'
import PortableText from '../components/PortableText.astro'
import ContactInfo from '../components/ContactInfo.astro'
import { getRetailerPage } from '../lib/sanity'

const page = await getRetailerPage()
---

<Layout title="For Retailers" description="Partner with Northwest Local Cannabis — wholesale info for dispensary buyers.">
  <Hero title={page?.headline ?? 'For Retailers'} />

  <div style="max-width:var(--content-width);">
    {page?.intro && <PortableText value={page.intro} />}

    {(page?.contactEmail || page?.contactPhone) && (
      <section style="margin-top:2rem;">
        <h3 style="text-transform:uppercase;letter-spacing:2px;font-size:0.85rem;color:var(--accent);margin-bottom:1rem;">Wholesale Inquiries</h3>
        <ContactInfo email={page.contactEmail} phone={page.contactPhone} />
      </section>
    )}

    {page?.downloadables && page.downloadables.length > 0 && (
      <section style="margin-top:2rem;">
        <h3 style="text-transform:uppercase;letter-spacing:2px;font-size:0.85rem;color:var(--accent);margin-bottom:1rem;">Downloads</h3>
        <ul style="list-style:none;display:grid;gap:0.75rem;">
          {page.downloadables.map((download: { label: string; url: string }) => (
            <li>
              <a href={download.url} target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.5rem;">
                {download.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
</Layout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/find-us.astro src/pages/retailers.astro
git commit -m "feat: build Find Us and For Retailers pages"
```

---

### Task 15: Blog Pages (List + Detail)

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Build blog listing page**

Create `src/pages/blog/index.astro`:

```astro
---
import Layout from '../../layouts/Layout.astro'
import Hero from '../../components/Hero.astro'
import BlogPostCard from '../../components/BlogPostCard.astro'
import { getBlogPosts } from '../../lib/sanity'

const posts = await getBlogPosts() ?? []
---

<Layout title="Blog" description="News, updates, and education from Northwest Local Cannabis.">
  <Hero title="Blog" subtitle="News, new drops, and cannabis education." />

  <div class="card-grid">
    {posts.map((post: Record<string, unknown>) => (
      <BlogPostCard {...post as any} />
    ))}
  </div>

  {posts.length === 0 && (
    <p style="text-align:center;margin-top:2rem;">No posts yet. Check back soon.</p>
  )}
</Layout>
```

- [ ] **Step 2: Build blog detail page**

Create `src/pages/blog/[...slug].astro`:

```astro
---
import Layout from '../../layouts/Layout.astro'
import PortableText from '../../components/PortableText.astro'
import { getBlogPosts, getBlogPost } from '../../lib/sanity'
import { urlFor } from '../../lib/image'

export async function getStaticPaths() {
  const posts = await getBlogPosts() ?? []
  return posts.map((post: { slug: { current: string } }) => ({
    params: { slug: post.slug.current },
  }))
}

const { slug } = Astro.params
const post = await getBlogPost(slug!)
if (!post) return Astro.redirect('/blog')

const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
---

<Layout title={post.title} description={post.description}>
  <article style="max-width:var(--content-width);margin:0 auto;">
    <header style="margin-bottom:2rem;">
      <p style="font-size:0.75rem;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem;">
        {formattedDate}
      </p>
      <h1>{post.title}</h1>
      <div class="hero-accent"></div>
      {post.tags && post.tags.length > 0 && (
        <div style="display:flex;gap:0.5rem;margin-top:1rem;">
          {post.tags.map((tag: string) => (
            <span class="product-badge">{tag}</span>
          ))}
        </div>
      )}
    </header>

    {post.heroImage?.asset && (
      <img
        src={urlFor(post.heroImage).width(1200).height(600).format('webp').url()}
        alt={post.heroImage.alt ?? ''}
        width="1200"
        height="600"
        style="border-radius:8px;margin-bottom:2rem;width:100%;object-fit:cover;"
      />
    )}

    {post.body && <PortableText value={post.body} />}
  </article>
</Layout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/
git commit -m "feat: build blog listing and detail pages"
```

---

### Task 16: Contact Page

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: Build the contact page**

Create `src/pages/contact.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import Hero from '../components/Hero.astro'
import PortableText from '../components/PortableText.astro'
import ContactInfo from '../components/ContactInfo.astro'
import { getPage, getSiteSettings } from '../lib/sanity'

const page = await getPage('contact')
const settings = await getSiteSettings()
---

<Layout
  title={page?.title ?? 'Contact'}
  description={page?.seoDescription ?? 'Get in touch with Northwest Local Cannabis.'}
>
  <Hero title={page?.title ?? 'Contact Us'} />

  <div style="max-width:var(--content-width);">
    {page?.body && <PortableText value={page.body} />}

    <ContactInfo
      email={settings?.contactEmail}
      phone={settings?.contactPhone}
      address={settings?.address}
    />
  </div>
</Layout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/contact.astro
git commit -m "feat: build contact page"
```

---

### Task 17: RSS Feed from Sanity

**Files:**
- Create: `src/pages/rss.xml.ts`

- [ ] **Step 1: Re-add RSS dependency**

```bash
yarn add @astrojs/rss
```

- [ ] **Step 2: Create RSS feed endpoint**

Create `src/pages/rss.xml.ts`:

```typescript
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getBlogPosts, getSiteSettings } from '../lib/sanity'

export async function GET(context: APIContext) {
  const settings = await getSiteSettings()
  const posts = await getBlogPosts() ?? []

  return rss({
    title: settings?.siteTitle ?? 'Northwest Local Cannabis',
    description: settings?.siteDescription ?? 'Washington State licensed cannabis producer and processor.',
    site: context.site!.toString(),
    items: posts.map((post: { title: string; slug: { current: string }; description: string; publishedAt: string }) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt),
      description: post.description,
      link: `/blog/${post.slug.current}/`,
    })),
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/rss.xml.ts package.json yarn.lock
git commit -m "feat: add RSS feed from Sanity blog posts"
```

---

### Task 18: GitHub Actions — Sanity Webhook Rebuild

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add webhook trigger to deploy workflow**

Add `repository_dispatch` trigger and Sanity env vars to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  repository_dispatch:
    types: [sanity-content-update]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout your repository using git
        uses: actions/checkout@v6
      - name: Install, build, and upload your site
        uses: withastro/action@v6
        env:
          SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
          SANITY_API_TOKEN: ${{ secrets.SANITY_API_TOKEN }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Document webhook setup**

To trigger rebuilds on content publish, set up a Sanity webhook:

1. Go to sanity.io/manage → your project → API → Webhooks
2. Create a new webhook:
   - **Name:** GitHub Pages Rebuild
   - **URL:** `https://api.github.com/repos/<OWNER>/<REPO>/dispatches`
   - **HTTP method:** POST
   - **HTTP Headers:** `Authorization: token <GITHUB_PAT>` (create a PAT with `repo` scope)
   - **Request body:** `{"event_type": "sanity-content-update"}`
   - **Trigger on:** Create, Update, Delete
   - **Filter:** Leave blank (triggers on all document types)

- [ ] **Step 3: Add secrets to GitHub repo**

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add Sanity webhook trigger and env vars to deploy workflow"
```

---

### Task 19: Sanity MCP Server and Claude Skills

**Files:**
- Create: `.claude/settings.local.json`
- Create: `.claude/skills/new-post/SKILL.md`
- Create: `.claude/skills/new-strain/SKILL.md`
- Create: `.claude/skills/new-product/SKILL.md`
- Create: `.claude/skills/new-retailer/SKILL.md`
- Create: `.claude/skills/audit-content/SKILL.md`
- Create: `.claude/skills/describe-assets/SKILL.md`

- [ ] **Step 1: Configure Sanity MCP server**

```bash
claude mcp add Sanity -t http https://mcp.sanity.io --scope project
```

This adds the MCP server to `.claude/settings.json` at project level.

- [ ] **Step 2: Pre-approve common read tools**

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__Sanity__search_documents",
      "mcp__Sanity__get_document",
      "mcp__Sanity__get_schema",
      "mcp__Sanity__list_documents"
    ]
  }
}
```

Note: Exact tool names may vary — check available tools after MCP connection is established and update accordingly.

- [ ] **Step 3: Create /new-strain skill**

Create `.claude/skills/new-strain/SKILL.md`:

```markdown
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
```

- [ ] **Step 4: Create /new-product skill**

Create `.claude/skills/new-product/SKILL.md`:

```markdown
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
```

- [ ] **Step 5: Create /new-post skill**

Create `.claude/skills/new-post/SKILL.md`:

```markdown
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
```

- [ ] **Step 6: Create /new-retailer skill**

Create `.claude/skills/new-retailer/SKILL.md`:

```markdown
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
```

- [ ] **Step 7: Create /audit-content skill**

Create `.claude/skills/audit-content/SKILL.md`:

```markdown
---
name: audit-content
description: Audit Sanity content for missing fields and quality issues
---

# /audit-content

Scan all content in Sanity CMS and report quality issues.

## Usage

- `/audit-content` — full audit of all content types
- `/audit-content strains` — audit only strains

## Checks

**Strains:**
- Missing hero image
- Missing description
- Empty effects array
- Empty terpenes array
- Missing THC/CBD range
- Missing slug

**Products:**
- Missing strain reference
- Missing category
- Missing image (and no strain hero image fallback)
- Missing slug

**Blog Posts:**
- Missing SEO description
- Description over 160 characters
- Missing hero image
- Missing body content
- Missing slug

**Retailers:**
- Missing address fields (address, city, zip)
- Missing contact info (no phone, email, or website)
- Missing slug

**Site Settings:**
- Missing site title
- Missing logo
- Missing age gate message

## Output

Report findings grouped by content type, with document names and specific missing fields. Suggest fixes where appropriate.
```

- [ ] **Step 8: Create /describe-assets skill**

Create `.claude/skills/describe-assets/SKILL.md`:

```markdown
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
```

- [ ] **Step 9: Commit**

```bash
git add .claude/
git commit -m "feat: add Sanity MCP config and Claude content management skills"
```

---

### Task 20: Update CLAUDE.md and Final Cleanup

**Files:**
- Modify: `CLAUDE.md`
- Delete: `src/assets/` (old placeholder images from starter template)
- Delete: `public/fonts/` (old Atkinson fonts — we use system-ui now)

- [ ] **Step 1: Clean up old starter template files**

```bash
rm -rf src/assets public/fonts
```

- [ ] **Step 2: Update CLAUDE.md**

Replace `CLAUDE.md` with updated project documentation reflecting the Sanity-powered architecture, new file structure, and available skills.

Key sections to update:
- Project Overview (Astro 6 + Sanity + GitHub Pages)
- Commands (include `cd studio && npx sanity dev` for Studio)
- Architecture (Sanity as single source of truth, static build, webhook rebuild)
- Content Model summary (Strain, Product, Blog Post, Retailer, Page, Site Settings, Retailer Page)
- Key Files (src/lib/sanity.ts, src/lib/image.ts, studio/schemaTypes/)
- Available Skills (/new-strain, /new-product, /new-post, /new-retailer, /audit-content, /describe-assets)
- Environment Variables (SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN)

- [ ] **Step 3: Verify full build**

```bash
yarn build
```

Expected: Build completes successfully. Pages are generated in `dist/`. If Sanity has no content yet, pages should render with empty states (e.g., "No strains available yet").

- [ ] **Step 4: Verify dev server**

```bash
yarn dev
```

Expected: All pages accessible and rendering correctly. Navigate through Home, About, Strains, Products, Find Us, For Retailers, Blog, Contact. Age gate appears on first visit.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: update CLAUDE.md and clean up starter template files"
```
