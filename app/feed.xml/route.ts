import { feedLimit, getFeedEntries, rssXml } from '@/src/lib/feeds';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entries = await getFeedEntries(feedLimit(url.searchParams.get('limit')));
  return new Response(rssXml(entries), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}