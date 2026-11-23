/**
 * WeedHub action registry (see AGENTS.md: "El átomo: la Action").
 *
 * Every admin operation is defined once as an action that calls a service. The same action
 * is used by the admin AI agent (api/admin.ai), by MCP clients (routes/mcp.tsx) and can be
 * called from admin routes. Actions never touch HTTP; services never touch AI.
 *
 * Risk levels (human-in-the-loop):
 *   read        → the agent runs it freely.
 *   write       → reversible change; the agent may run it. Content edits made by the
 *                 agent always land as "pendiente" for human review.
 *   destructive → deletes, archives, role/permission changes, publishing, anything hard to
 *                 undo: never runs without an explicit human confirmation.
 */
import type Anthropic from "@anthropic-ai/sdk";

export type Risk = "read" | "write" | "destructive";
export type ActionResult = { success: boolean; data?: unknown; error?: string };
export interface ActionContext {
  actor: "admin" | "agente" | "mcp";
  /** username of the human on whose behalf the action runs */
  by: string;
}

export interface ActionDef {
  name: string;
  /** Module, for grouping in docs and tool listings (e.g. "cepas", "glosario"). */
  module: string;
  /** Says when to use it, what to call before, and what it does NOT do. Max ~3 lines. */
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  risk: Risk;
  /** One-line human summary shown on the confirmation button for destructive actions. */
  confirmLabel?: (input: Record<string, unknown>) => string;
  execute: (input: Record<string, unknown>, ctx: ActionContext) => Promise<ActionResult>;
}

const registry = new Map<string, ActionDef>();

export function defineAction(def: ActionDef) {
  if (registry.has(def.name)) throw new Error(`Action "${def.name}" defined twice`);
  registry.set(def.name, def);
  return def;
}

export function getAction(name: string) {
  return registry.get(name);
}

export function getAllActions() {
  return [...registry.values()].sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name));
}

export function toClaudeTools(): Anthropic.Tool[] {
  return getAllActions().map((a) => ({
    name: a.name,
    description: a.risk === "destructive" ? `${a.description}\n[Requiere confirmación de la persona: al llamarla se le muestra un botón; no se ejecuta sola.]` : a.description,
    input_schema: a.inputSchema as Anthropic.Tool["input_schema"],
  }));
}

export type ExecuteOutcome =
  | { status: "done"; result: ActionResult }
  | { status: "needs_confirmation"; action: string; input: Record<string, unknown>; label: string }
  | { status: "unknown" };

/** Single entry point. Destructive actions require `confirmed: true` (a human click). */
export async function executeAction(
  name: string,
  input: Record<string, unknown>,
  ctx: ActionContext,
  opts: { confirmed?: boolean } = {}
): Promise<ExecuteOutcome> {
  const a = registry.get(name);
  if (!a) return { status: "unknown" };
  if (a.risk === "destructive" && !opts.confirmed) {
    return { status: "needs_confirmation", action: name, input, label: a.confirmLabel?.(input) ?? `${name}` };
  }
  try {
    return { status: "done", result: await a.execute(input ?? {}, ctx) };
  } catch (err) {
    return { status: "done", result: { success: false, error: err instanceof Error ? err.message : String(err) } };
  }
}
