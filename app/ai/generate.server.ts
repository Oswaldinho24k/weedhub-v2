/**
 * Shared Claude call for content drafting (articles, glossary definitions, notes).
 * Returns plain text. Callers decide where the draft is stored; drafts are always
 * saved as "pendiente" so a person approves them in /admin/revision.
 */
import Anthropic from "@anthropic-ai/sdk";

export const CONTENT_MODEL = "claude-opus-5-5";

export const EDITORIAL_RULES = `Reglas editoriales de WeedHub:
- Español latino neutro, voz de "tú", claro y tranquilo. Sin exageraciones, sin signos de exclamación, sin emojis.
- Sin frases de relleno típicas de IA ("en el mundo de", "sumérgete", "no es solo X, es Y", "en conclusión").
- No inventes cifras, estudios, citas, leyes ni fechas. Si no estás seguro de un dato, no lo pongas o márcalo como [VERIFICAR].
- Salud: nunca digas que el cannabis cura o trata algo; usa "hay quien reporta", "la evidencia es limitada" y sugiere consultar a un profesional.
- Ley: sé conservador y recuerda verificar la ley vigente en cada país.
- Solo para personas adultas; no promuevas el consumo.`;

export async function generateText(opts: { system: string; prompt: string; maxTokens?: number; effort?: "low" | "medium" | "high" }) {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false as const, error: "ANTHROPIC_API_KEY no configurada" };
  const client = new Anthropic();
  try {
    const stream = client.messages.stream({
      model: CONTENT_MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      output_config: { effort: opts.effort ?? "medium" },
      system: `${opts.system}\n\n${EDITORIAL_RULES}`,
      messages: [{ role: "user", content: opts.prompt }],
    });
    const res = await stream.finalMessage();
    if (res.stop_reason === "refusal") return { ok: false as const, error: "El modelo no generó el contenido" };
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text ? { ok: true as const, text } : { ok: false as const, error: "Respuesta vacía" };
  } catch (error) {
    if (error instanceof Anthropic.APIError) return { ok: false as const, error: `Error del modelo (${error.status ?? "?"})` };
    throw error;
  }
}
