import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.postsingular.org';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/manual', '/bot', '/principios', '/community', '/guilds', '/projects', '/ensayo-de-stress'].map((path) => ({
    url: `${baseUrl}${path || '/'}`, lastModified: new Date('2026-09-15T00:00:00.000Z'), changeFrequency: path === '' ? 'weekly' : 'monthly', priority: path === '' ? 1 : 0.7,
  }));
}
