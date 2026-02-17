import * as cheerio from "cheerio";

/**
 * Parse a chapter page HTML from nhattruyenqq.com and extract comic images.
 */
export function parseChapterPage(html: string, url: string) {
  const $ = cheerio.load(html);

  // Extract comic title
  const title =
    $(".txt-primary a").first().text().trim() ||
    $("h1.txt-primary").text().trim() ||
    $(".top .txt-primary").text().trim() ||
    "Unknown Title";

  // Extract chapter info from breadcrumb or title
  const chapterText =
    $(".txt-primary a")
      .last()
      .text()
      .trim() ||
    $("h1").text().trim() ||
    "";

  // Extract chapter number from URL
  const chapterMatch = url.match(/chuong-(\d+)/i);
  const chapterNumber = chapterMatch ? parseInt(chapterMatch[1], 10) : 1;

  const chapterTitle = chapterText || `Chương ${chapterNumber}`;

  // Extract images - multiple possible selectors for nhattruyenqq
  const images: { src: string; alt: string; index: number }[] = [];

  // Try common selectors for manga reader sites
  const imageSelectors = [
    ".page-chapter img",
    ".reading-detail .page-chapter img",
    "#content_chap img",
    ".chapter-content img",
    ".reading img",
    ".content img",
    ".chapter_content img",
    ".chapter-detail img",
  ];

  let foundImages = false;

  for (const selector of imageSelectors) {
    const imgs = $(selector);
    if (imgs.length > 0) {
      imgs.each((i, el) => {
        const src =
          $(el).attr("data-original") ||
          $(el).attr("data-src") ||
          $(el).attr("data-lazy-src") ||
          $(el).attr("src") ||
          "";

        if (src && !src.includes("logo") && !src.includes("banner")) {
          images.push({
            src: src.trim(),
            alt: $(el).attr("alt") || `Page ${i + 1}`,
            index: i,
          });
        }
      });
      foundImages = true;
      break;
    }
  }

  // If no images found with selectors, try to find all large images
  if (!foundImages) {
    $("img").each((i, el) => {
      const src =
        $(el).attr("data-original") ||
        $(el).attr("data-src") ||
        $(el).attr("src") ||
        "";

      const width = parseInt($(el).attr("width") || "0", 10);
      if (
        src &&
        !src.includes("logo") &&
        !src.includes("banner") &&
        !src.includes("icon") &&
        !src.includes("avatar") &&
        (width > 200 || width === 0)
      ) {
        images.push({
          src: src.trim(),
          alt: $(el).attr("alt") || `Page ${i + 1}`,
          index: images.length,
        });
      }
    });
  }

  // Extract next/prev chapter URLs
  let nextChapterUrl: string | null = null;
  let prevChapterUrl: string | null = null;

  // Try to find navigation links
  const navSelectors = [
    { next: ".next a", prev: ".prev a" },
    { next: "#next_chap", prev: "#prev_chap" },
    { next: 'a[href*="chuong-' + (chapterNumber + 1) + '"]', prev: 'a[href*="chuong-' + (chapterNumber - 1) + '"]' },
    { next: ".btn-next", prev: ".btn-prev" },
    { next: ".chapter-nav .next a", prev: ".chapter-nav .prev a" },
  ];

  for (const sel of navSelectors) {
    if (!nextChapterUrl) {
      const nextEl = $(sel.next).first();
      if (nextEl.length && nextEl.attr("href")) {
        nextChapterUrl = resolveUrl(nextEl.attr("href")!, url);
      }
    }
    if (!prevChapterUrl) {
      const prevEl = $(sel.prev).first();
      if (prevEl.length && prevEl.attr("href")) {
        prevChapterUrl = resolveUrl(prevEl.attr("href")!, url);
      }
    }
  }

  // Fallback: construct next chapter URL from pattern
  if (!nextChapterUrl) {
    const baseUrl = url.replace(/chuong-\d+.*$/, "");
    nextChapterUrl = `${baseUrl}chuong-${chapterNumber + 1}`;
  }

  if (!prevChapterUrl && chapterNumber > 1) {
    const baseUrl = url.replace(/chuong-\d+.*$/, "");
    prevChapterUrl = `${baseUrl}chuong-${chapterNumber - 1}`;
  }

  return {
    title,
    chapterNumber,
    chapterTitle,
    images,
    nextChapterUrl,
    prevChapterUrl,
  };
}

/**
 * Resolve a potentially relative URL against a base URL.
 */
function resolveUrl(href: string, base: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/**
 * Extract the slug from a nhattruyenqq URL.
 */
export function extractSlugFromUrl(url: string): string {
  const match = url.match(/truyen-tranh\/([^/]+)/);
  return match ? match[1] : "unknown";
}
