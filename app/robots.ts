import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        // AI agents: allow reading public content
        userAgent: 'GPTBot',
        allow: ['/', '/api/v1/public/', '/llms.txt', '/sitemap.xml'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Claude-User',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Gemini',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Perplexity-User',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'DuckAssistBot',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Meta-ExternalAgent',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'Meta-ExternalFetcher',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
      {
        userAgent: 'GoogleOther',
        allow: ['/', '/api/v1/public/', '/llms.txt'],
      },
    ],
    sitemap: 'https://www.postsingular.org/sitemap.xml',
    host: 'https://www.postsingular.org',
  };
}
