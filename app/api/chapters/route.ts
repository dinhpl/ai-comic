import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/chapters?slug=one-piece&chapter=1
 * Returns chapter data from Supabase database (pre-crawled)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const chapterNum = parseInt(searchParams.get("chapter") || "1", 10);

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "slug parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get comic by slug
    const { data: comic, error: comicError } = await supabase
      .from("comics")
      .select("id, title, slug, cover_url, total_chapters")
      .eq("slug", slug)
      .single();

    if (comicError || !comic) {
      return NextResponse.json(
        {
          success: false,
          error: `Truyện "${slug}" chưa được crawl. Hãy chạy script crawl trước.`,
        },
        { status: 404 }
      );
    }

    // Get chapter
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, chapter_number, chapter_title, next_chapter_url, image_count")
      .eq("comic_id", comic.id)
      .eq("chapter_number", chapterNum)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        {
          success: false,
          error: `Chương ${chapterNum} chưa có trong database. Hãy crawl thêm.`,
        },
        { status: 404 }
      );
    }

    // Get images
    const { data: images, error: imgError } = await supabase
      .from("chapter_images")
      .select("image_index, src, alt")
      .eq("chapter_id", chapter.id)
      .order("image_index", { ascending: true });

    if (imgError) {
      return NextResponse.json(
        { success: false, error: `Lỗi đọc ảnh: ${imgError.message}` },
        { status: 500 }
      );
    }

    // Check if next chapter exists in DB
    const { data: nextChapter } = await supabase
      .from("chapters")
      .select("chapter_number")
      .eq("comic_id", comic.id)
      .eq("chapter_number", chapterNum + 1)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        comic: {
          title: comic.title as string,
          slug: comic.slug as string,
          coverUrl: comic.cover_url as string,
          totalChapters: comic.total_chapters as number,
        },
        chapterNumber: chapter.chapter_number as number,
        chapterTitle: chapter.chapter_title as string,
        images: ((images as Array<Record<string, unknown>>) || []).map(
          (img) => ({
            src: img.src as string,
            alt: img.alt as string,
            index: img.image_index as number,
          })
        ),
        hasNextChapter: !!nextChapter,
        totalImages: chapter.image_count as number,
      },
    });
  } catch (error) {
    console.error("Chapter API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
