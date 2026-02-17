/**
 * Local Crawl Script
 * 
 * Usage:
 *   npx tsx scripts/crawl.ts <chapter-url> [--chapters <count>]
 *
 * Examples:
 *   npx tsx scripts/crawl.ts "https://nhattruyenqq.com/truyen-tranh/one-piece/chuong-1" --chapters 10
 *   npx tsx scripts/crawl.ts "https://nhattruyenqq.com/truyen-tranh/one-piece/chuong-50" --chapters 5
 *
 * This script will:
 *   1. Crawl each chapter sequentially from your local machine (no 403 issues)
 *   2. Parse images and chapter data
 *   3. Save everything to Supabase database
 *   4. The Vercel web app reads from this database
 */

import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Crawler logic (same as lib/crawler.ts but standalone)
// ============================================================================
function parseChapterPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title =
    $(".txt-primary a").first().text().trim() ||
    $("h1.txt-primary").text().trim() ||
    $(".top .txt-primary").text().trim() ||
    "Unknown Title";

  const chapterText =
    $(".txt-primary a").last().text().trim() ||
    $("h1").text().trim() ||
    "";

  const chapterMatch = url.match(/chuong-(\d+)/i);
  const chapterNumber = chapterMatch ? parseInt(chapterMatch[1], 10) : 1;
  const chapterTitle = chapterText || `Chương ${chapterNumber}`;

  const images: { src: string; alt: string; index: number }[] = [];

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
          alt: $(el).attr("alt") || `Page ${images.length + 1}`,
          index: images.length,
        });
      }
    });
  }

  let nextChapterUrl: string | null = null;
  const navSelectors = [
    ".next a",
    "#next_chap",
    `a[href*="chuong-${chapterNumber + 1}"]`,
    ".btn-next",
    ".chapter-nav .next a",
  ];

  for (const sel of navSelectors) {
    const nextEl = $(sel).first();
    if (nextEl.length && nextEl.attr("href")) {
      const href = nextEl.attr("href")!;
      nextChapterUrl = href.startsWith("http")
        ? href
        : new URL(href, url).toString();
      break;
    }
  }

  if (!nextChapterUrl) {
    const baseUrl = url.replace(/chuong-\d+.*$/, "");
    nextChapterUrl = `${baseUrl}chuong-${chapterNumber + 1}`;
  }

  return { title, chapterNumber, chapterTitle, images, nextChapterUrl };
}

function extractSlugFromUrl(url: string): string {
  const match = url.match(/truyen-tranh\/([^/]+)/);
  return match ? match[1] : "unknown";
}

// ============================================================================
// Fetch a page with browser-like headers (local = no 403!)
// ============================================================================
async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: new URL(url).origin + "/",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return await response.text();
}

// ============================================================================
// Save to Supabase
// ============================================================================
async function getOrCreateComic(
  slug: string,
  title: string,
  sourceUrl: string,
  coverUrl: string
): Promise<number> {
  // Check if comic exists
  const { data: existing } = await supabase
    .from("comics")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new comic
  const { data: created, error } = await supabase
    .from("comics")
    .insert({
      slug,
      title,
      source_url: sourceUrl,
      cover_url: coverUrl,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create comic: ${error.message}`);
  return created!.id;
}

async function saveChapter(
  comicId: number,
  chapter: ReturnType<typeof parseChapterPage>,
  sourceUrl: string
): Promise<void> {
  // Upsert chapter
  const { data: chapterRow, error: chapterError } = await supabase
    .from("chapters")
    .upsert(
      {
        comic_id: comicId,
        chapter_number: chapter.chapterNumber,
        chapter_title: chapter.chapterTitle,
        source_url: sourceUrl,
        next_chapter_url: chapter.nextChapterUrl,
        image_count: chapter.images.length,
      },
      { onConflict: "comic_id,chapter_number" }
    )
    .select("id")
    .single();

  if (chapterError) throw new Error(`Failed to save chapter: ${chapterError.message}`);
  const chapterId = chapterRow!.id;

  // Delete existing images for this chapter (for clean re-crawl)
  await supabase.from("chapter_images").delete().eq("chapter_id", chapterId);

  // Insert images in batches of 50
  const batchSize = 50;
  for (let i = 0; i < chapter.images.length; i += batchSize) {
    const batch = chapter.images.slice(i, i + batchSize).map((img) => ({
      chapter_id: chapterId,
      image_index: img.index,
      src: img.src,
      alt: img.alt,
    }));

    const { error: imgError } = await supabase
      .from("chapter_images")
      .insert(batch);

    if (imgError) {
      console.warn(`  ⚠️ Warning saving images batch: ${imgError.message}`);
    }
  }
}

async function updateComicTotalChapters(comicId: number): Promise<void> {
  const { count } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("comic_id", comicId);

  await supabase
    .from("comics")
    .update({ total_chapters: count || 0, updated_at: new Date().toISOString() })
    .eq("id", comicId);
}

// ============================================================================
// Main Crawl Flow
// ============================================================================
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📖 Comic Crawler — Crawl chapters and save to Supabase

Usage:
  npx tsx scripts/crawl.ts <chapter-url> [--chapters <count>]

Examples:
  npx tsx scripts/crawl.ts "https://nhattruyenqq.com/truyen-tranh/one-piece/chuong-1" --chapters 10
  npx tsx scripts/crawl.ts "https://nhattruyenqq.com/truyen-tranh/naruto/chuong-50" --chapters 5
    `);
    process.exit(0);
  }

  const startUrl = args[0];
  const chaptersIdx = args.indexOf("--chapters");
  const maxChapters = chaptersIdx !== -1 ? parseInt(args[chaptersIdx + 1], 10) : 10;

  if (!startUrl.includes("truyen-tranh") || !startUrl.includes("chuong")) {
    console.error("❌ URL phải có dạng: https://nhattruyenqq.com/truyen-tranh/.../chuong-X");
    process.exit(1);
  }

  const slug = extractSlugFromUrl(startUrl);
  console.log(`\n🚀 Starting crawl for: ${slug}`);
  console.log(`📍 Start URL: ${startUrl}`);
  console.log(`📚 Chapters to crawl: ${maxChapters}\n`);

  let currentUrl: string | null = startUrl;
  let comicId: number | null = null;
  let crawledCount = 0;
  const delay = 800; // ms between requests

  while (currentUrl && crawledCount < maxChapters) {
    try {
      console.log(`📥 [${crawledCount + 1}/${maxChapters}] Crawling: ${currentUrl}`);

      const html = await fetchPage(currentUrl);
      const chapter = parseChapterPage(html, currentUrl);

      console.log(`   ✅ ${chapter.chapterTitle} — ${chapter.images.length} ảnh`);

      // Create comic on first chapter
      if (comicId === null) {
        const coverUrl = chapter.images[0]?.src || "";
        comicId = await getOrCreateComic(slug, chapter.title, startUrl, coverUrl);
        console.log(`   📚 Comic ID: ${comicId} (${chapter.title})`);
      }

      // Save chapter to DB
      await saveChapter(comicId, chapter, currentUrl);
      console.log(`   💾 Saved to database`);

      crawledCount++;

      // Check if there's a valid next chapter
      if (chapter.nextChapterUrl && crawledCount < maxChapters) {
        // Verify next chapter URL looks valid
        const nextMatch = chapter.nextChapterUrl.match(/chuong-(\d+)/i);
        if (nextMatch) {
          const nextNum = parseInt(nextMatch[1], 10);
          if (nextNum <= chapter.chapterNumber) {
            console.log(`   ⏹️ Next URL points to same or earlier chapter, stopping.`);
            break;
          }
        }

        currentUrl = chapter.nextChapterUrl;
        // Rate limit
        await new Promise((r) => setTimeout(r, delay));
      } else {
        currentUrl = null;
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err instanceof Error ? err.message : err}`);
      // Try to continue with constructed next URL
      const match = currentUrl!.match(/chuong-(\d+)/i);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        const baseUrl = currentUrl!.replace(/chuong-\d+.*$/, "");
        currentUrl = `${baseUrl}chuong-${nextNum}`;
        console.log(`   🔄 Trying fallback URL: ${currentUrl}`);
        await new Promise((r) => setTimeout(r, delay * 2));
      } else {
        break;
      }
    }
  }

  // Update total chapters
  if (comicId !== null) {
    await updateComicTotalChapters(comicId);
  }

  console.log(`\n✅ Done! Crawled ${crawledCount} chapters for "${slug}"`);
  console.log(`📊 Data saved to Supabase — your Vercel app can now read it.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
