import type {
  BlogPost,
  PortableText,
  PortableTextBlock,
  SiteSettings,
  Strain,
} from "./sanity";

interface SchemaBase {
  "@context": "https://schema.org";
  "@type": string;
}

export interface OrganizationSchema extends SchemaBase {
  "@type": "Organization";
  name: string;
  url: string;
  description?: string;
  logo?: string;
  email?: string;
  telephone?: string;
  sameAs?: string[];
}

export interface BrandRef {
  "@type": "Brand";
  name: string;
}

export interface ProductSchema extends SchemaBase {
  "@type": "Product";
  name: string;
  url: string;
  category: string;
  description?: string;
  image?: string;
  brand?: BrandRef;
}

export interface ImageObject {
  "@type": "ImageObject";
  url: string;
}

export interface PublisherRef {
  "@type": "Organization";
  name: string;
  logo?: ImageObject;
}

export interface AuthorRef {
  "@type": "Organization";
  name: string;
}

export interface ArticleSchema extends SchemaBase {
  "@type": "Article";
  headline: string;
  url: string;
  datePublished: string;
  author: AuthorRef;
  publisher: PublisherRef;
  description?: string;
  image?: string;
}

export interface BreadcrumbItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema extends SchemaBase {
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItem[];
}

export type StructuredData =
  | OrganizationSchema
  | ProductSchema
  | ArticleSchema
  | BreadcrumbListSchema;

export function normalizeSiteUrl( siteUrl: string ): string {
  return siteUrl.endsWith( "/" ) ? siteUrl.slice( 0, -1 ) : siteUrl;
}

function isTextSpan( child: unknown ): child is { text: string } {
  if( typeof child !== "object" || child === null ) return false;
  if( !( "text" in child ) ) return false;
  return typeof child.text === "string";
}

export function portableTextToPlainText( blocks?: PortableText, maxParagraphs = 2 ): string {
  if( !blocks ) return "";

  const paragraphs: string[] = [];

  for( const block of blocks ) {
    if( paragraphs.length >= maxParagraphs ) break;
    if( !isParagraphBlock( block ) ) continue;

    const children = block.children;
    if( !Array.isArray( children ) ) continue;

    const text = children
      .filter( isTextSpan )
      .map( child => child.text )
      .join( "" );

    if( text.length > 0 ) paragraphs.push( text );
  }

  return paragraphs.join( " " );
}

function isParagraphBlock( block: PortableTextBlock ): boolean {
  return (
    block._type === "block"
    && block.style === "normal"
    && !block.listItem
  );
}

export function buildOrganization(
  settings: SiteSettings | null,
  siteUrl: string,
): OrganizationSchema | null {
  if( !settings?.siteTitle ) return null;

  const url = normalizeSiteUrl( siteUrl );

  const organization: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteTitle,
    url,
  };

  if( settings.logo?.asset?.url ) organization.logo = settings.logo.asset.url;
  if( settings.siteDescription ) organization.description = settings.siteDescription;
  if( settings.contactEmail ) organization.email = settings.contactEmail;
  if( settings.contactPhone ) organization.telephone = settings.contactPhone;

  const sameAs: string[] = [];
  if( settings.socialLinks?.instagram ) sameAs.push( settings.socialLinks.instagram );
  if( settings.socialLinks?.facebook ) sameAs.push( settings.socialLinks.facebook );
  if( settings.socialLinks?.twitter ) sameAs.push( settings.socialLinks.twitter );
  if( sameAs.length > 0 ) organization.sameAs = sameAs;

  return organization;
}

export function buildProduct(
  strain: Strain,
  siteUrl: string,
  heroImageUrl?: string,
  brandName?: string,
): ProductSchema {
  const url = `${normalizeSiteUrl( siteUrl )}/strains/${strain.slug.current}/`;

  const product: ProductSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: strain.name,
    url,
    category: `Cannabis Strain - ${strain.strainType}`,
  };

  if( heroImageUrl ) product.image = heroImageUrl;

  const description = portableTextToPlainText( strain.description );
  if( description ) product.description = description;

  if( brandName ) {
    product.brand = { "@type": "Brand", name: brandName };
  }

  return product;
}

export function buildArticle(
  post: BlogPost,
  siteUrl: string,
  heroImageUrl: string | undefined,
  settings: SiteSettings | null,
): ArticleSchema {
  const baseUrl = normalizeSiteUrl( siteUrl );
  const url = `${baseUrl}/blog/${post.slug.current}/`;
  const publisherName = settings?.siteTitle ?? "Northwest Local Cannabis";

  const publisher: PublisherRef = {
    "@type": "Organization",
    name: publisherName,
  };
  if( settings?.logo?.asset?.url ) {
    publisher.logo = { "@type": "ImageObject", url: settings.logo.asset.url };
  }

  const article: ArticleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: publisherName },
    publisher,
  };

  if( heroImageUrl ) article.image = heroImageUrl;
  if( post.description ) article.description = post.description;

  return article;
}

export interface BreadcrumbInput {
  name: string;
  url: string;
}

export function buildBreadcrumbList(
  items: BreadcrumbInput[],
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map( ( crumb, index ) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    }) ),
  };
}

