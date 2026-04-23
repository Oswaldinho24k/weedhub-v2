import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export interface StrainSubmissionPayload {
  name: string;
  type: "sativa" | "indica" | "hybrid" | "unknown";
  lineage?: string;
  description?: string;
  reasoning: string;
  sourceUrl?: string;
}

export interface ModerationResult {
  safe: boolean;
  reasons: string[];
  raw?: string;
}

/**
 * Cheap plausibility check for strain submissions using Claude Haiku 4.5.
 * Blocks obvious nonsense/spam/abuse. Approves anything plausible — admins
 * still curate before publishing.
 *
 * If ANTHROPIC_API_KEY is unset, returns safe:true (fail-open) — we'd rather
 * queue the submission and let admin handle it than reject legitimate users
 * when the integration is down.
 */
export async function moderateStrainSubmission(
  payload: StrainSubmissionPayload
): Promise<ModerationResult> {
  const c = getClient();
  if (!c) return { safe: true, reasons: [] };

  const prompt = [
    "You are a content moderator for a Spanish-speaking cannabis encyclopedia (WeedHub).",
    "Evaluate the following strain submission from a user. Return JSON only.",
    "Reject if:",
    "- It's clearly nonsense, spam, or gibberish",
    "- It promotes selling/buying controlled substances or posts contact info (phone, email, address) for transactions",
    "- It's hateful, harassing, or threatening",
    "- It mentions minors consuming",
    "- The 'reasoning' field is a meaningless dump (e.g. 'asdfghjkl') or copy-paste unrelated text",
    "Approve if it plausibly describes a cannabis strain — even if data is incomplete or informal.",
    "",
    "Submission:",
    JSON.stringify(payload, null, 2),
    "",
    `Respond with exactly: {"safe": boolean, "reasons": string[]}`,
  ].join("\n");

  try {
    const resp = await c.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = resp.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { safe: true, reasons: [], raw: text };

    const parsed = JSON.parse(match[0]);
    return {
      safe: parsed.safe !== false,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      raw: text,
    };
  } catch (err) {
    // Fail open — don't block legit submissions if the API is flaky.
    console.error("[moderation] fallback to safe:true due to error:", err);
    return { safe: true, reasons: [] };
  }
}
