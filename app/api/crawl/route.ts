import { NextRequest, NextResponse } from "next/server";
import { parseChapterPage } from "@/lib/crawler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL pattern
    if (!url.includes("truyen-tranh") && !url.includes("chuong")) {
      return NextResponse.json(
        {
          success: false,
          error: "URL không hợp lệ. Vui lòng nhập URL dạng: https://nhattruyenqq.com/truyen-tranh/.../chuong-X",
        },
        { status: 400 }
      );
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: new URL(url).origin + "/",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể truy cập trang (HTTP ${response.status}). Trang có thể đã thay đổi URL.`,
        },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Parse the HTML to extract images and chapter info
    const chapterData = parseChapterPage(html, url);

    if (chapterData.images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy ảnh nào trong chương này. Trang nguồn có thể đã thay đổi cấu trúc.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: chapterData,
    });
  } catch (error) {
    console.error("Crawl error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, error: `Lỗi khi crawl: ${message}` },
      { status: 500 }
    );
  }
}
