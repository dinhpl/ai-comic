import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/comics
 * Returns list of all comics in the database with first chapter info
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    // If slug provided, return detailed info for one comic
    if (slug) {
      const { data: comic, error } = await supabase
        .from("comics")
        .select("id, slug, title, cover_url, total_chapters, updated_at")
        .eq("slug", slug)
        .single();

      if (error || !comic) {
        return NextResponse.json(
          { success: false, error: "Truyện không tồn tại" },
          { status: 404 }
        );
      }

      // Get available chapters
      const { data: chapters } = await supabase
        .from("chapters")
        .select("chapter_number")
        .eq("comic_id", comic.id)
        .order("chapter_number", { ascending: true });

      return NextResponse.json({
        success: true,
        data: {
          ...comic,
          chapters: (chapters || []).map((c: Record<string, unknown>) => c.chapter_number),
        },
      });
    }

    // List all comics
    const { data: comics, error } = await supabase
      .from("comics")
      .select("id, slug, title, cover_url, total_chapters, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // For each comic, get the first available chapter number
    const comicsWithFirstChapter = await Promise.all(
      (comics || []).map(async (comic: Record<string, unknown>) => {
        const { data: firstChap } = await supabase
          .from("chapters")
          .select("chapter_number")
          .eq("comic_id", comic.id)
          .order("chapter_number", { ascending: true })
          .limit(1)
          .single();

        return {
          ...comic,
          first_chapter: firstChap
            ? (firstChap as Record<string, unknown>).chapter_number
            : 1,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: comicsWithFirstChapter,
    });
  } catch (error) {
    console.error("Comics API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
