import Anthropic from "@anthropic-ai/sdk";
import type { Route } from "./+types/admin.ai";
import { requireAdmin } from "~/lib/auth.server";
import { adminActions, actionsToClaudeTools } from "~/lib/admin-actions.server";

const SYSTEM_PROMPT = `Eres el asistente editorial y de operaciones del admin de WeedHub, la enciclopedia de cannabis en español para América Latina.
Trabajas junto a la persona que valida el contenido. Tus herramientas leen y editan la base: cepas, glosario, Mapa Verde, magazine, efectos, reseñas y usuarios.

Cómo trabajar:
- Responde en español, breve y concreto. Cuando ejecutes algo, di qué hiciste y con qué resultado.
- No inventes datos. Si un dato no está en el registro ni te lo dio la persona, dilo y propón cómo conseguirlo.
- Tú propones; la persona aprueba. No puedes aprobar ni rechazar registros: eso se hace en /admin/revision. Toda edición tuya deja el registro en "pendiente".
- Para revisar contenido, empieza con review_stats o list_review_queue y trabaja registro por registro.
- Temas legales y de salud: sé conservador, nunca afirmes que el cannabis cura o trata algo.
- Antes de cambios masivos (más de 10 registros), describe el plan y pide confirmación.`;

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  let body: { messages?: ChatTurn[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  // The client keeps the visible conversation; replay it so the agent remembers context.
  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20);
  if (!history.length || history.at(-1)!.role !== "user") {
    return Response.json({ error: "Mensaje vacío" }, { status: 400 });
  }
  while (history.length && history[0].role !== "user") history.shift();

  const client = new Anthropic();
  const tools = actionsToClaudeTools();
  let messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const executedTools: Array<{ name: string; success: boolean }> = [];

  for (let i = 0; i < 10; i++) {
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        output_config: { effort: "medium" },
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        return Response.json({ text: "Hay mucha demanda en este momento. Intenta de nuevo en un minuto.", executedTools });
      }
      if (error instanceof Anthropic.APIError) {
        return Response.json({ error: `Error del modelo (${error.status ?? "?"})`, executedTools }, { status: 502 });
      }
      throw error;
    }

    if (response.stop_reason === "refusal") {
      return Response.json({ text: "El modelo no quiso continuar con esa petición. Reformúlala o hazla por partes.", executedTools });
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const tool = adminActions[block.name];
        if (!tool) {
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify({ error: "Acción desconocida" }), is_error: true });
          continue;
        }
        try {
          const result = await tool.execute((block.input ?? {}) as Record<string, unknown>);
          executedTools.push({ name: block.name, success: result.success });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result), is_error: !result.success });
        } catch (err) {
          executedTools.push({ name: block.name, success: false });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify({ error: String(err) }), is_error: true });
        }
      }
      // Append the full assistant content (incl. thinking blocks) and all results in one user turn.
      messages = [...messages, { role: "assistant", content: response.content }, { role: "user", content: toolResults }];
      continue;
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return Response.json({ text: text || "Listo.", executedTools });
  }

  return Response.json({ text: "Me detuve tras varios pasos. Dime si sigo.", executedTools });
}
