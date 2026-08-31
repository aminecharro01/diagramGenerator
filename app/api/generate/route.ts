import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { callAI } from "@/lib/ai/provider";
import { getSystemPromptForType, getPromptForType } from "@/lib/ai/prompts";
import { layoutDiagram } from "@/lib/diagram/layout";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user using the server cookies (strictly secure)
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
    const { prompt, diagramType, settings } = body;

    if (!prompt || !diagramType) {
      return NextResponse.json(
        { error: "Missing required parameters: prompt and diagramType." },
        { status: 400 }
      );
    }

    // 3. Enforce usage limits (Rate limiting)
    // Free tier gets 10 generations per day
    const limitResult = await checkRateLimit(supabase, user.id, 10);
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Daily rate limit reached. Free plans are limited to 10 AI generations per day.",
          limitReached: true,
          limit: limitResult.limit,
        },
        { status: 429 }
      );
    }

    // 4. Construct prompts and invoke AI provider
    const userPrompt = getPromptForType(diagramType, prompt, settings);
    const systemPrompt = getSystemPromptForType(diagramType);
    const generatedRaw = await callAI(systemPrompt, userPrompt);

    // 5. Run automatic graph layouts for node placement coordinates
    const layoutedDiagram = layoutDiagram(generatedRaw, settings);
    if (layoutedDiagram && settings) {
      layoutedDiagram.settings = settings;
    }

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
    console.error("API /api/generate error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during diagram generation." },
      { status: 500 }
    );
  }
}
