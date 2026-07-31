import Anthropic from "@anthropic-ai/sdk";
import type { Route } from "./+types/admin.ai";
import { requireAdmin } from "~/lib/auth.server";
import { adminActions, actionsToClaudeTools } from "~/lib/admin-actions.server";

const SYSTEM_PROMPT = `Eres el asistente interno de administración de WeedHub, la enciclopedia de cannabis en español.
Tienes acceso a herramientas para consultar y modificar la base de datos: cepas, efectos, reseñas, usuarios y glosario.
Responde siempre en español. Sé conciso. Cuando ejecutes una operación, confirma qué hiciste y el resultado.
No inventes datos — si no encuentras algo, dilo claramente.`;

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  let body: { messages: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const userMessage = body.messages?.at(-1)?.content;
  if (!userMessage) {
    return Response.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const tools = actionsToClaudeTools();

  type MsgParam = Anthropic.Messages.MessageParam;
  let messages: MsgParam[] = [{ role: "user", content: userMessage }];

  const executedTools: Array<{ name: string; success: boolean }> = [];

  for (let i = 0; i < 6; i++) {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return Response.json({ text, executedTools });
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const action = adminActions[block.name];
        if (!action) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({ error: "Acción desconocida" }),
          });
          continue;
        }
        const result = await action.execute(block.input as Record<string, unknown>);
        executedTools.push({ name: block.name, success: result.success });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      continue;
    }

    break;
  }

  return Response.json({ text: "Sin respuesta del asistente.", executedTools });
}
