import { NextResponse } from "next/server";
import { z } from "zod";
import {
  searchAcrossPlatforms,
  SocialPlatform,
} from "@/lib/search/platforms";
import { summarizeJobs } from "@/lib/ai/summarize";

const requestSchema = z.object({
  keywords: z.string().trim().min(1).default("job vacancy"),
  location: z.string().trim().min(1).default("Butwal, Nepal"),
  radiusKm: z.number().min(1).max(200).optional(),
  platforms: z
    .array(z.enum(["facebook", "linkedin", "instagram"]))
    .nonempty()
    .default(["facebook", "linkedin", "instagram"]),
  maxResults: z.number().min(1).max(30).optional(),
  includeSummary: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = requestSchema.parse(payload);

    const platforms = dedupePlatforms(parsed.platforms);

    const results = await searchAcrossPlatforms(platforms, {
      keywords: parsed.keywords,
      location: parsed.location,
      radiusKm: parsed.radiusKm,
      maxResults: parsed.maxResults,
    });

    const summary = parsed.includeSummary
      ? await summarizeJobs(results, {
          query: parsed.keywords,
          location: parsed.location,
        })
      : null;

    return NextResponse.json({
      results,
      summary,
      generatedAt: new Date().toISOString(),
      total: results.length,
      platforms,
    });
  } catch (error) {
    console.error("Search failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to fetch job leads at this time" },
      { status: 500 },
    );
  }
}

function dedupePlatforms(platforms: SocialPlatform[]): SocialPlatform[] {
  return Array.from(new Set(platforms));
}
