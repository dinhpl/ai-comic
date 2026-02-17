import { NextRequest, NextResponse } from "next/server";

// Known manga site domains to use as Referer
const KNOWN_REFERERS: Record<string, string> = {
  "beercloudy.com": "https://nhattruyenqq.com/",
  "cdnntx.com": "https://nhattruyenqq.com/",
  "truyen.cloud": "https://nhattruyenqq.com/",
  "imagesnhattruyenqq.com": "https://nhattruyenqq.com/",
  "cdn.nhattruyenqq.com": "https://nhattruyenqq.com/",
  "nhattruyenqq.com": "https://nhattruyenqq.com/",
};

function getRefererForImage(imageUrl: string, customReferer?: string): string {
  // If a custom referer was passed, use it
  if (customReferer) {
    return customReferer;
  }

  // Try to match known CDN domains
  try {
    const hostname = new URL(imageUrl).hostname;
    for (const [domain, referer] of Object.entries(KNOWN_REFERERS)) {
      if (hostname.includes(domain)) {
        return referer;
      }
    }
  } catch {
    // ignore
  }

  // Default fallback - use nhattruyenqq.com since that's our primary source
  return "https://nhattruyenqq.com/";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    const customReferer = searchParams.get("referer");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);

    // Determine the correct referer for this image
    const referer = getRefererForImage(decodedUrl, customReferer || undefined);

    // Fetch the image from the source with browser-like headers
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: referer,
        Origin: new URL(referer).origin,
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
        "Accept-Encoding": "gzip, deflate, br",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    // Get content type
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Stream the image data
    const imageData = await response.arrayBuffer();

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Proxy image error:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
