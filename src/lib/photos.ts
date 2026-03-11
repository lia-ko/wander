/**
 * Fetch place thumbnails from Wikipedia/Wikimedia.
 * Uses the MediaWiki API — no API key required.
 */

const thumbCache = new Map<string, string | null>();
const THUMB_CACHE_MAX = 200;

const THUMB_WIDTH = 200; // px — enough for 2x retina at ~100px card width

/** Resize a Wikimedia thumbnail URL to a specific width. */
function resizeThumbUrl(url: string, width: number): string {
  // Wikimedia URLs look like: .../thumb/.../320px-Foo.jpg
  // We can swap the width prefix to get a different size
  return url.replace(/\/\d+px-/, `/${width}px-`);
}

/** Extract thumbnail URL from Wikipedia summary data, resized for our cards. */
function extractThumb(data: { thumbnail?: { source?: string } }): string | null {
  const src = data.thumbnail?.source;
  if (!src) return null;
  return resizeThumbUrl(src, THUMB_WIDTH);
}

/** Fetch a thumbnail URL for a place name via Wikipedia search. */
export async function fetchThumbnail(
  name: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const key = name.toLowerCase().trim();
  if (thumbCache.has(key)) return thumbCache.get(key)!;

  const cacheSet = (k: string, v: string | null) => {
    if (thumbCache.size >= THUMB_CACHE_MAX) {
      const oldest = thumbCache.keys().next().value;
      if (oldest !== undefined) thumbCache.delete(oldest);
    }
    thumbCache.set(k, v);
  };

  try {
    const encoded = encodeURIComponent(name);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { signal },
    );

    if (res.ok) {
      const data = await res.json();
      const url = extractThumb(data);
      cacheSet(key, url);
      return url;
    }

    // If direct lookup fails, try search
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&srnamespace=0&srlimit=1&format=json&origin=*`,
      { signal },
    );
    if (!searchRes.ok) {
      cacheSet(key, null);
      return null;
    }
    const searchData = await searchRes.json();
    const title = searchData.query?.search?.[0]?.title;
    if (!title) {
      cacheSet(key, null);
      return null;
    }

    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { signal },
    );
    if (!summaryRes.ok) {
      cacheSet(key, null);
      return null;
    }
    const summaryData = await summaryRes.json();
    const url = extractThumb(summaryData);
    cacheSet(key, url);
    return url;
  } catch {
    // Aborted or network error — don't cache failures from aborts
    if (!signal?.aborted) cacheSet(key, null);
    return null;
  }
}

/**
 * Batch-fetch thumbnails for multiple pins.
 * Returns a Map of pinId -> thumbnail URL.
 * Fetches in parallel with a concurrency limit to avoid hammering the API.
 */
export async function batchFetchThumbnails(
  pins: Array<{ id: number; name: string }>,
  signal?: AbortSignal,
): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  if (pins.length === 0) return results;

  // Process in batches of 4 to be polite
  const BATCH_SIZE = 4;
  for (let i = 0; i < pins.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;
    const batch = pins.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (pin) => {
        const url = await fetchThumbnail(pin.name, signal);
        if (url) results.set(pin.id, url);
      }),
    );
    // Small delay between batches
    if (i + BATCH_SIZE < pins.length && !signal?.aborted) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return results;
}
