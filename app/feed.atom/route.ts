import { atomXml, feedLimit, getFeedEntries } from '@/src/lib/feeds';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entries = await getFeedEntries(feedLimit(url.searchParams.get('limit')));
  return new Response(atomXml(entries), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}