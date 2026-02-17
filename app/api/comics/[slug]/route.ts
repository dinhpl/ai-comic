import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Slug is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();

    // 1. Fetch comic metadata
    const { data: comic, error: comicError } = await supabase
      .from("comics")
      .select("*")
      .eq("slug", slug)
      .single();

    if (comicError || !comic) {
      return NextResponse.json(
        { success: false, error: "Comic not found" },
        { status: 404 }
      );
    }

    // 2. Fetch all chapters for this comic
    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select("chapter_number, chapter_title, created_at")
      .eq("comic_id", comic.id)
      .order("chapter_number", { ascending: true });

    if (chaptersError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch chapters" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...comic,
        chapters: chapters || [],
      },
    });
  } catch (error: any) {
    console.error("API Error [Comic Detail]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
