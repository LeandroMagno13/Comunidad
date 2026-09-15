import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: 'https://www.postsingular.org/sitemap.xml', host: 'https://www.postsingular.org' };
}
