import Anthropic from "@anthropic-ai/sdk";
import type { Route } from "./+types/admin.ai";
import { requireAdmin } from "~/lib/auth.server";
import { executeAction, toClaudeTools, getAllActions } from "~/ai/actions/index.server";

const SYSTEM_PROMPT = `Eres el asistente del admin de WeedHub, la enciclopedia de cannabis en español para América Latina.
Operas TODO el admin con las mismas acciones que usa la interfaz: cepas, glosario, Mapa Verde, magazine, efectos, reseñas, sugerencias, usuarios, comunidad y negocios. También ayudas a crear y revisar contenido.

Cómo trabajar:
- Responde en español, breve y concreto. Al ejecutar algo, di qué hiciste y el resultado.
- No inventes datos. Si falta un dato, dilo y propone cómo conseguirlo.
- Tú propones y redactas; la persona aprueba. Todo contenido que crees o edites queda "pendiente" y se aprueba en /admin/revision.
- Las acciones destructivas (borrar, archivar, publicar, cambiar roles) no se ejecutan solas: al llamarlas, la persona ve un botón para confirmar. Dile qué va a pasar.
- Si la persona dice "esta cepa", "este término" o similar, usa el contexto de la página donde está.
- Salud y ley: sé conservador; nunca afirmes que el cannabis cura o trata algo.
- Antes de cambios masivos (más de 10 registros), describe el plan y pide confirmación.`;

type ChatTurn = { role: "user" | "assistant"; content: string };
type Pending = { action: string; input: Record<string, unknown>; label: string };

export async function action({ request }: Route.ActionArgs) {
  const admin = await requireAdmin(request);
  const ctx = { actor: "agente" as const, by: admin.username || "admin" };

  let body: { messages?: ChatTurn[]; context?: { path?: string }; confirm?: Pending };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  // A human clicked "Confirmar" on a destructive action the agent proposed.
  if (body.confirm?.action) {
    const outcome = await executeAction(body.confirm.action, body.confirm.input ?? {}, { actor: "admin", by: ctx.by }, { confirmed: true });
    if (outcome.status !== "done") return Response.json({ error: "Acción desconocida" }, { status: 400 });
    return Response.json({
      text: outcome.result.success ? `Hecho: ${body.confirm.label}.` : `No se pudo: ${outcome.result.error}`,
      executedTools: [{ name: body.confirm.action, success: outcome.result.success }],
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20);
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length || history.at(-1)!.role !== "user") {
    return Response.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const client = new Anthropic();
  const tools = toClaudeTools();
  let messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  if (body.context?.path) {
    // Page context as an operator note after the latest user message (keeps the cached prefix stable).
    messages.push({ role: "system" as any, content: `La persona está en ${body.context.path} del admin.` } as any);
  }
  const executedTools: Array<{ name: string; success: boolean }> = [];
  const pending: Pending[] = [];

  for (let i = 0; i < 12; i++) {
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
      if (error instanceof Anthropic.RateLimitError) return Response.json({ text: "Hay mucha demanda. Intenta en un minuto.", executedTools, pending });
      if (error instanceof Anthropic.APIError) return Response.json({ error: `Error del modelo (${error.status ?? "?"})`, executedTools, pending }, { status: 502 });
      throw error;
    }

    if (response.stop_reason === "refusal") {
      return Response.json({ text: "El modelo no quiso continuar con esa petición. Reformúlala o hazla por partes.", executedTools, pending });
    }

    if (response.stop_reason === "tool_use") {
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const outcome = await executeAction(block.name, (block.input ?? {}) as Record<string, unknown>, ctx);
        if (outcome.status === "unknown") {
          results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify({ error: "Acción desconocida" }), is_error: true });
        } else if (outcome.status === "needs_confirmation") {
          pending.push({ action: outcome.action, input: outcome.input, label: outcome.label });
          results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify({ pending: true, message: `No ejecutada: la persona verá un botón para confirmar "${outcome.label}".` }) });
        } else {
          executedTools.push({ name: block.name, success: outcome.result.success });
          results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(outcome.result), is_error: !outcome.result.success });
        }
      }
      messages = [...messages, { role: "assistant", content: response.content }, { role: "user", content: results }];
      continue;
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return Response.json({ text: text || "Listo.", executedTools, pending });
  }

  return Response.json({ text: "Me detuve tras varios pasos. Dime si sigo.", executedTools, pending });
}

/** GET: list of actions (for the admin UI "¿qué puedes hacer?" panel). */
export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return Response.json(getAllActions().map((a) => ({ name: a.name, module: a.module, risk: a.risk, description: a.description })));
}
