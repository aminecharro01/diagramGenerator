import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { callAI } from "@/lib/ai/provider";
import { getRefinePrompt } from "@/lib/ai/prompts";
import { layoutDiagram } from "@/lib/diagram/layout";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access. Please log in first." },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    const body = await request.json();
    const { existingDiagram, instruction } = body;

    if (!existingDiagram || !instruction) {
      return NextResponse.json(
        { error: "Missing required parameters: existingDiagram and instruction." },
        { status: 400 }
      );
    }

    // 3. Enforce usage limits
    const limitResult = await checkRateLimit(supabase, user.id, 10);
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Daily rate limit reached. Free plans are limited to 10 AI operations per day.",
          limitReached: true,
          limit: limitResult.limit,
        },
        { status: 429 }
      );
    }

    // 4. Construct prompts and invoke AI refinement
    const refineSystemPrompt = getRefinePrompt(
      JSON.stringify(existingDiagram)
    );
    const refinedRaw = await callAI(refineSystemPrompt, instruction);

    // 5. Re-run automatic layouts to place new nodes/edges cleanly
    const layoutedDiagram = layoutDiagram(refinedRaw);

    // 6. Return response
    return NextResponse.json({
      success: true,
      diagram: layoutedDiagram,
      usage: {
        count: limitResult.count,
        limit: limitResult.limit,
      },
    });
  } catch (err: any) {
    console.error("API /api/refine error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during diagram refinement." },
      { status: 500 }
    );
  }
}
