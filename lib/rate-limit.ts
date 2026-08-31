import { SupabaseClient } from "@supabase/supabase-js";

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  dailyLimit: number = 10
): Promise<RateLimitResult> {
  try {
    // 1. Fetch current usage record for the user
    const { data: usage, error } = await supabase
      .from("usage")
      .select("generation_count, last_generation_at")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no row found, which is fine (we will initialize it)
      throw error;
    }

    const now = new Date();
    
    // 2. If no record exists, create one and return allowed
    if (!usage) {
      const { error: insertError } = await supabase.from("usage").insert({
        user_id: userId,
        generation_count: 1,
        last_generation_at: now.toISOString(),
      });

      if (insertError) throw insertError;
      return { allowed: true, count: 1, limit: dailyLimit };
    }

    const lastGen = new Date(usage.last_generation_at);
    
    // Check if the last generation was on a different calendar day (UTC)
    const isNewDay =
      lastGen.getUTCDate() !== now.getUTCDate() ||
      lastGen.getUTCMonth() !== now.getUTCMonth() ||
      lastGen.getUTCFullYear() !== now.getUTCFullYear();

    let newCount = usage.generation_count;

    if (isNewDay) {
      // It's a new day, reset counter to 1
      newCount = 1;
      const { error: resetError } = await supabase
        .from("usage")
        .update({
          generation_count: newCount,
          last_generation_at: now.toISOString(),
        })
        .eq("user_id", userId);

      if (resetError) throw resetError;
      return { allowed: true, count: newCount, limit: dailyLimit };
    }

    // It's the same day, check limits
    if (newCount >= dailyLimit) {
      return { allowed: false, count: newCount, limit: dailyLimit };
    }

    // Increment count
    newCount += 1;
    const { error: updateError } = await supabase
      .from("usage")
      .update({
        generation_count: newCount,
        last_generation_at: now.toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;
    return { allowed: true, count: newCount, limit: dailyLimit };
  } catch (err) {
    console.error("Rate limit check error:", err);
    // If rate-limiting database operations fail, default to allowing usage so we don't block users due to minor db glitches
    return { allowed: true, count: 0, limit: dailyLimit };
  }
}
