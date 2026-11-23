/**
 * Loads every action module into the registry (services → actions → routes, see AGENTS.md).
 * Import this once wherever actions are needed: api/admin.ai (the admin agent) and routes/mcp.
 * Add new modules here.
 */
import "./content-review.server";
import "./glossary.server";
import "./strains.server";
import "./articles.server";
import "./legal-status.server";
import "./effects.server";
import "./moderation.server";
import "./users.server";
import "./businesses.server";

export { getAllActions, executeAction, toClaudeTools } from "~/ai/registry.server";
