/**
 * POST /mcp — MCP server (JSON-RPC 2.0) over the same action registry the admin agent uses.
 * Auth: `Authorization: Bearer <ADMIN_MCP_TOKEN>`. Disabled when the env var is unset.
 * Destructive actions need `"confirm": true` in the tool arguments (the MCP client should
 * only send it after the person approved).
 */
import type { Route } from "./+types/mcp";
import { executeAction, getAllActions } from "~/ai/actions/index.server";

const PROTOCOL = "2025-06-18";

function rpc(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}
function rpcError(id: unknown, code: number, message: string, status = 200) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } }, { status });
}

export async function action({ request }: Route.ActionArgs) {
  const token = process.env.ADMIN_MCP_TOKEN;
  if (!token) return new Response("MCP disabled", { status: 404 });
  if (request.headers.get("authorization") !== `Bearer ${token}`) return new Response("Unauthorized", { status: 401 });

  let msg: { id?: unknown; method?: string; params?: any };
  try {
    msg = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }
  const { id, method, params } = msg;

  if (method === "initialize") {
    return rpc(id, {
      protocolVersion: params?.protocolVersion ?? PROTOCOL,
      capabilities: { tools: {} },
      serverInfo: { name: "weedhub-admin", version: "1.0.0" },
      instructions: "Herramientas del admin de WeedHub (enciclopedia de cannabis en español). El contenido creado queda pendiente de revisión humana. Las acciones destructivas requieren confirm: true.",
    });
  }
  if (method?.startsWith("notifications/")) return new Response(null, { status: 202 });
  if (method === "ping") return rpc(id, {});

  if (method === "tools/list") {
    return rpc(id, {
      tools: getAllActions().map((a) => ({
        name: a.name,
        description: a.risk === "destructive" ? `${a.description}\n[Destructiva: requiere "confirm": true tras aprobación humana.]` : a.description,
        inputSchema: a.risk === "destructive"
          ? { ...a.inputSchema, properties: { ...a.inputSchema.properties, confirm: { type: "boolean" } } }
          : a.inputSchema,
        annotations: { readOnlyHint: a.risk === "read", destructiveHint: a.risk === "destructive" },
      })),
    });
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params ?? {};
    const { confirm, ...input } = args as Record<string, unknown>;
    const outcome = await executeAction(String(name), input, { actor: "mcp", by: "mcp" }, { confirmed: confirm === true });
    if (outcome.status === "unknown") return rpcError(id, -32602, `Unknown tool: ${name}`);
    if (outcome.status === "needs_confirmation") {
      return rpc(id, { content: [{ type: "text", text: `Requiere confirmación humana: ${outcome.label}. Vuelve a llamar con "confirm": true cuando la persona apruebe.` }], isError: true });
    }
    return rpc(id, { content: [{ type: "text", text: JSON.stringify(outcome.result) }], isError: !outcome.result.success });
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
}

export function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
