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
      heroImage { asset->, alt, crop, hotspot },
      featured, available
    }`
  )
}

export async function getStrain(slug: string) {
  return sanityClient.fetch(
    `*[_type == "strain" && slug.current == $slug][0] {
      _id, name, slug, strainType, description,
      effects, terpenes, thcRange, cbdRange, nextHarvestDate,
      heroImage { asset->, alt, crop, hotspot },
      gallery[] { asset->, alt, crop, hotspot },
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
      "strain": strain->{ _id, name, slug, strainType, heroImage { asset->, alt, crop, hotspot } }
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
      heroImage { asset->, alt, crop, hotspot }
    }`
  )
}

export async function getBlogPost(slug: string) {
  return sanityClient.fetch(
    `*[_type == "blogPost" && slug.current == $slug][0] {
      _id, title, slug, description, publishedAt, tags,
      heroImage { asset->, alt, crop, hotspot },
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
      heroImage { asset->, alt, crop, hotspot },
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
