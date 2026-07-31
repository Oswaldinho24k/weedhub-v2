import { Link } from "react-router";

const TYPE_PILL: Record<string, string> = {
  sativa: "accent",
  indica: "warm",
  hybrid: "lilac",
};

interface GeneticNode {
  name: string;
  slug: string;
  type?: "sativa" | "indica" | "hybrid";
}

interface GeneticTreeProps {
  strain: {
    name: string;
    slug: string;
    type: "sativa" | "indica" | "hybrid";
    genetics?: {
      parent1?: string;
      parent2?: string;
      children?: string[];
    };
    lineage?: string;
  };
  parentNodes?: GeneticNode[];
  childNodes?: GeneticNode[];
}

export function GeneticTree({ strain, parentNodes = [], childNodes = [] }: GeneticTreeProps) {
  const parents = parentNodes.length > 0 ? parentNodes : rawParents(strain);
  const children = childNodes;
  const hasParents = parents.length > 0;
  const hasChildren = children.length > 0;

  if (!hasParents && !hasChildren) return null;

  return (
    <div className="space-y-4">
      {/* Parents row */}
      {hasParents && (
        <div>
          <div className="kicker text-xs mb-3 text-fg-dim">Genética parental</div>
          <div className="flex items-center gap-3 flex-wrap">
            {parents.map((p, i) => (
              <div key={p.slug} className="flex items-center gap-3">
                <NodePill name={p.name} slug={p.slug} type={p.type} />
                {i < parents.length - 1 && (
                  <span className="text-fg-dim text-sm">×</span>
                )}
              </div>
            ))}
            <ConnectorArrow />
          </div>
        </div>
      )}

      {/* Current strain */}
      <div className="flex items-center gap-2">
        {hasParents && <div className="w-4 shrink-0" />}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          {strain.name}
        </div>
        <span className={`pill text-xs ${TYPE_PILL[strain.type] || ""}`}>
          {strain.type}
        </span>
      </div>

      {/* Children row */}
      {hasChildren && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ConnectorArrow rotate />
            <div className="kicker text-xs text-fg-dim">Descendientes conocidos</div>
          </div>
          <div className="flex gap-2 flex-wrap overflow-x-auto">
            {children.slice(0, 8).map((c) => (
              <NodePill key={c.slug} name={c.name} slug={c.slug} type={c.type} />
            ))}
            {children.length > 8 && (
              <span className="pill text-xs text-fg-dim">+{children.length - 8} más</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function rawParents(strain: GeneticTreeProps["strain"]): GeneticNode[] {
  const nodes: GeneticNode[] = [];
  if (strain.genetics?.parent1) {
    nodes.push({
      name: strain.genetics.parent1,
      slug: toSlug(strain.genetics.parent1),
    });
  }
  if (strain.genetics?.parent2) {
    nodes.push({
      name: strain.genetics.parent2,
      slug: toSlug(strain.genetics.parent2),
    });
  }
  return nodes;
}

function NodePill({ name, slug, type }: GeneticNode) {
  const pill = type ? TYPE_PILL[type] || "" : "";
  return (
    <Link
      to={`/strains/${slug}`}
      className={`pill ${pill} text-sm hover:opacity-80 transition-opacity`}
      prefetch="intent"
    >
      {name}
    </Link>
  );
}

function ConnectorArrow({ rotate = false }: { rotate?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`shrink-0 text-fg-dim ${rotate ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path
        d="M8 2v12M4 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
