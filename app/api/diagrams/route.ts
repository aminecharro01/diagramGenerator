import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 1. GET: Fetch diagrams owned by the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: diagrams, error: dbError } = await supabase
      .from("diagrams")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (dbError) throw dbError;

    return NextResponse.json({ diagrams });
  } catch (err: any) {
    console.error("GET /api/diagrams error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch diagrams" },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new diagram
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
    const { title, description, diagramType, prompt, diagramData } = body;

    if (!title || !diagramType || !diagramData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: diagram, error: dbError } = await supabase
      .from("diagrams")
      .insert({
        user_id: user.id,
        title,
        description,
        diagram_type: diagramType,
        prompt,
        diagram_data: diagramData,
        is_public: false,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Create initial version
    await supabase.from("diagram_versions").insert({
      diagram_id: diagram.id,
      user_id: user.id,
      version_number: 1,
      diagram_data: diagramData,
      prompt: prompt || "Initial creation",
    });

    return NextResponse.json({ success: true, diagram });
  } catch (err: any) {
    console.error("POST /api/diagrams error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create diagram" },
      { status: 500 }
    );
  }
}

// 3. PUT: Update diagram data and optional version snapshots
export async function PUT(request: NextRequest) {
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
    const { id, title, description, diagramData, isPublic, createVersion, versionPrompt } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing diagram ID" }, { status: 400 });
    }

    // Verify ownership first
    const { data: existing, error: fetchError } = await supabase
      .from("diagrams")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare update parameters
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (diagramData !== undefined) updatePayload.diagram_data = diagramData;
    if (isPublic !== undefined) updatePayload.is_public = isPublic;

    const { data: updated, error: updateError } = await supabase
      .from("diagrams")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Handle version snapshots
    if (createVersion && diagramData) {
      // Find highest version count
      const { data: versions, error: vError } = await supabase
        .from("diagram_versions")
        .select("version_number")
        .eq("diagram_id", id)
        .order("version_number", { ascending: false })
        .limit(1);

      let nextVersionNumber = 1;
      if (!vError && versions && versions.length > 0) {
        nextVersionNumber = versions[0].version_number + 1;
      }

      await supabase.from("diagram_versions").insert({
        diagram_id: id,
        user_id: user.id,
        version_number: nextVersionNumber,
        diagram_data: diagramData,
        prompt: versionPrompt || `Version ${nextVersionNumber}`,
      });
    }

    return NextResponse.json({ success: true, diagram: updated });
  } catch (err: any) {
    console.error("PUT /api/diagrams error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update diagram" },
      { status: 500 }
    );
  }
}

// 4. DELETE: Remove diagram record
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing diagram ID" }, { status: 400 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("diagrams")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete diagram (automatically deletes versions and shares via cascade)
    const { error: deleteError } = await supabase
      .from("diagrams")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/diagrams error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete diagram" },
      { status: 500 }
    );
  }
}
