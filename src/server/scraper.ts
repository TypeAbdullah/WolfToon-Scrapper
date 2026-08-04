import iconv from 'iconv-lite';
import { getSettings } from './config.js';
import { ManhwaItem, ManhwaDetail, ChapterItem } from '../shared/types.js';

function encodeEucKr(str: string): string {
  const buf = iconv.encode(str, 'euc-kr');
  return Array.from(buf).map(b => '%' + b.toString(16).padStart(2, '0').toUpperCase()).join('');
}

async function fetchPageHtml(urlOrPath: string): Promise<string> {
  const settings = getSettings();
  let fullUrl = urlOrPath;
  if (!urlOrPath.startsWith('http')) {
    fullUrl = `${settings.baseUrl}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;
  }

  const response = await fetch(fullUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': `${settings.baseUrl}/`,
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} when fetching ${fullUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return iconv.decode(buffer, 'euc-kr');
}

export async function searchManhwa(query: string): Promise<ManhwaItem[]> {
  const encodedQ = encodeEucKr(query);
  const html = await fetchPageHtml(`/sh?q=${encodedQ}`);
  return parseManhwaListFromHtml(html);
}

export async function browseManhwa(type: 'ing' | 'end' | 'all' = 'ing', page: number = 1): Promise<ManhwaItem[]> {
  const path = type === 'end' ? `/end?pg=${page}` : `/ing?pg=${page}`;
  const html = await fetchPageHtml(path);
  return parseManhwaListFromHtml(html);
}

function parseManhwaListFromHtml(html: string): ManhwaItem[] {
  const items: ManhwaItem[] = [];
  const settings = getSettings();

  // Look for card containers or link items with /list?toon=ID
  const cardRegex = /<a[^>]+href=["']\/list\?toon=(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [...html.matchAll(cardRegex)];

  const seenIds = new Set<string>();

  for (const m of matches) {
    const toonId = m[1];
    if (seenIds.has(toonId)) continue;
    seenIds.add(toonId);

    const innerHtml = m[2];
    
    // Extract thumbnail image if present
    let coverUrl = '';
    const imgMatch = innerHtml.match(/src=["'](https?:\/\/[^"']+)["']/i) || 
                     innerHtml.match(/data-src=["'](https?:\/\/[^"']+)["']/i) ||
                     innerHtml.match(/background-image:\s*url\(['"]?(https?:\/\/[^"']+)['"]?\)/i);
    if (imgMatch) {
      coverUrl = imgMatch[1];
    } else {
      // Fallback placeholder image or domain relative image
      const relImgMatch = innerHtml.match(/src=["'](\/assets\/[^"']+)["']/i);
      if (relImgMatch) {
        coverUrl = `${settings.baseUrl}${relImgMatch[1]}`;
      }
    }

    // Clean title & raw text
    const cleanText = innerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract latest chapter badge if present (e.g. "383화" or "100화")
    let latestChapter = '';
    const chMatch = cleanText.match(/(\d+화)/);
    if (chMatch) {
      latestChapter = chMatch[1];
    }

    // Filter out badges like "UP", "19", "NEW" from front of title
    let title = cleanText
      .replace(/^(UP|NEW|19|BEST|\d+)+/gi, '')
      .replace(/\d+화$/g, '')
      .trim();

    if (!title) {
      title = `Manhwa #${toonId}`;
    }

    items.push({
      id: toonId,
      toonId,
      title,
      href: `/list?toon=${toonId}`,
      coverUrl: coverUrl || undefined,
      latestChapter: latestChapter || undefined,
    });
  }

  return items;
}

export async function getManhwaDetail(toonId: string): Promise<ManhwaDetail> {
  const html = await fetchPageHtml(`/list?toon=${toonId}`);

  // Parse page title (preferably from h1.w-title)
  let title = `Manhwa #${toonId}`;
  const h1Match = html.match(/<h1[^>]*class=["'][^"']*w-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    title = h1Match[1].replace(/<[^>]+>/g, '').trim();
  } else {
    const pageTitleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (pageTitleMatch) {
      title = pageTitleMatch[1].replace(/-.*$/g, '').trim();
    }
  }

  // Parse cover image thumbnail reliably
  let coverUrl = '';

  // Match 1: inside thumb-wrap div container
  const thumbWrapMatch = html.match(/class=["'][^"']*thumb-wrap[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
  
  // Match 2: image URL containing /toonId/ (e.g. /8283/)
  const toonIdImgMatch = html.match(new RegExp(`<img[^>]+src=["'](https?:\\\/\\\/[^"']*\\\/${toonId}\\\/[^"']+)["']`, 'i'));

  // Match 3: inside title-sec container
  const titleSecMatch = html.match(/class=["'][^"']*title-sec[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);

  if (thumbWrapMatch && thumbWrapMatch[1]) {
    coverUrl = thumbWrapMatch[1];
  } else if (toonIdImgMatch && toonIdImgMatch[1]) {
    coverUrl = toonIdImgMatch[1];
  } else if (titleSecMatch && titleSecMatch[1]) {
    coverUrl = titleSecMatch[1];
  } else {
    // Fallback: search for first non-ad img src
    const allImgs = [...html.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi)];
    for (const m of allImgs) {
      const src = m[1];
      if (!src.includes('ioxbppx2') && !src.includes('banner') && !src.includes('ad') && !src.includes('logo') && !src.includes('sprite')) {
        coverUrl = src;
        break;
      }
    }
  }

  // Parse description / summary if available
  let description = '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  // Parse genre tags if available
  const genres: string[] = [];
  const genreMatches = [...html.matchAll(/<a[^>]+class=["'][^"']*gtag[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)];
  for (const gm of genreMatches) {
    const tag = gm[1].replace(/<[^>]+>/g, '').replace('#', '').trim();
    if (tag) genres.push(tag);
  }

  // Parse all chapter links: /view?toon=ID&num=NUM
  const chapters: ChapterItem[] = [];
  const chapterRegex = /<a[^>]+href=["']\/view\?toon=\d+&amp;num=(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const chapterRegex2 = /<a[^>]+href=["']\/view\?toon=\d+&num=(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  
  const matches = [...html.matchAll(chapterRegex), ...html.matchAll(chapterRegex2)];
  const seenNums = new Set<string>();

  for (const m of matches) {
    const num = m[1];
    if (seenNums.has(num)) continue;
    seenNums.add(num);

    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract date if available (e.g. 2026-08-04)
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : undefined;

    // Title cleanup
    let chTitle = text;
    if (chTitle.includes('화')) {
      chTitle = chTitle;
    } else {
      chTitle = `Chapter ${num}`;
    }

    chapters.push({
      toonId,
      num,
      title: chTitle,
      href: `/view?toon=${toonId}&num=${num}`,
      date,
    });
  }

  // Sort chapters naturally by chapter number descending or ascending
  chapters.sort((a, b) => parseFloat(b.num) - parseFloat(a.num));

  return {
    id: toonId,
    toonId,
    title,
    coverUrl: coverUrl || undefined,
    description: description || undefined,
    genres: genres.length > 0 ? genres : undefined,
    chapters,
  };
}

export async function getChapterImageUrls(toonId: string, num: string): Promise<string[]> {
  const html = await fetchPageHtml(`/view?toon=${toonId}&num=${num}`);
  
  const imageUrls: string[] = [];

  // Extract img elements with data-src attribute (primary delivery format on wfwf sites)
  const dataSrcRegex = /<img[^>]+data-src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = dataSrcRegex.exec(html)) !== null) {
    const imgUrl = match[1].trim();
    if (imgUrl.startsWith('http') && !imgUrl.includes('sprite') && !imgUrl.includes('logo') && !imgUrl.includes('ad')) {
      imageUrls.push(imgUrl);
    }
  }

  // Fallback if data-src was not found: check standard src attributes
  if (imageUrls.length === 0) {
    const srcRegex = /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*>/gi;
    while ((match = srcRegex.exec(html)) !== null) {
      const imgUrl = match[1].trim();
      // Filter out domain ads or UI assets
      if (!imgUrl.includes('banner') && !imgUrl.includes('sprite') && !imgUrl.includes('logo') && !imgUrl.includes('ad') && !imgUrl.includes('icon')) {
        imageUrls.push(imgUrl);
      }
    }
  }

  return imageUrls;
}
