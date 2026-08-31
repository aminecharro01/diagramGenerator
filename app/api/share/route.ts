import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { diagramId } = body;

    if (!diagramId) {
      return NextResponse.json({ error: "Missing diagram ID" }, { status: 400 });
    }

    // Verify ownership
    const { data: diagram, error: fetchError } = await supabase
      .from("diagrams")
      .select("id, user_id, is_public")
      .eq("id", diagramId)
      .single();

    if (fetchError || !diagram) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    if (diagram.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Ensure the diagram is set to public (so select policy allows read-only viewing)
    if (!diagram.is_public) {
      await supabase
        .from("diagrams")
        .update({ is_public: true })
        .eq("id", diagramId);
    }

    // 2. Check if a share token already exists
    const { data: existingShare } = await supabase
      .from("shares")
      .select("share_token")
      .eq("diagram_id", diagramId)
      .limit(1)
      .maybeSingle();

    if (existingShare) {
      return NextResponse.json({ shareToken: existingShare.share_token });
    }

    // 3. Otherwise, generate a secure token
    const token = crypto.randomUUID().replace(/-/g, "");

    const { error: insertError } = await supabase.from("shares").insert({
      diagram_id: diagramId,
      user_id: user.id,
      share_token: token,
    });

    if (insertError) throw insertError;

    return NextResponse.json({ shareToken: token });
  } catch (err: any) {
    console.error("POST /api/share error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create share link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const diagramId = searchParams.get("diagramId");

    if (!diagramId) {
      return NextResponse.json({ error: "Missing diagram ID" }, { status: 400 });
    }

    // Verify ownership
    const { data: diagram, error: fetchError } = await supabase
      .from("diagrams")
      .select("id, user_id")
      .eq("id", diagramId)
      .single();

    if (fetchError || !diagram) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    if (diagram.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Revoke share token (delete shares entry)
    await supabase.from("shares").delete().eq("diagram_id", diagramId);

    // Turn is_public to false on diagram
    await supabase
      .from("diagrams")
      .update({ is_public: false })
      .eq("id", diagramId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/share error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
