import { Link } from "react-router";
import { Icon } from "~/components/ui/icon";

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

  const TONE: Record<string, string> = { sativa: "cartulina--yellow", indica: "cartulina--pink", hybrid: "cartulina--green" };
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 flex-wrap">
      {hasParents && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            {parents.map((p, i) => (
              <div key={p.slug} className="flex items-center gap-3">
                <NodePill name={p.name} slug={p.slug} type={p.type} />
                {i < parents.length - 1 && <span className="rotulo text-3xl">×</span>}
              </div>
            ))}
          </div>
          <Icon name="arrowRight" size={30} strokeWidth={3} className="rotate-90 md:rotate-0 self-start md:self-auto" />
        </>
      )}
      <div className={`cartulina ${TONE[strain.type] ?? "cartulina--blank"} px-5 py-3 -rotate-1`}>
        <span className="marker text-2xl">{strain.name}</span>
      </div>

      {hasChildren && (
        <div className="basis-full mt-4">
          <h3 className="text-lg font-extrabold [font-stretch:85%] mb-3">Descendientes conocidos</h3>
          <div className="flex gap-2 flex-wrap">
            {children.slice(0, 8).map((c) => (
              <NodePill key={c.slug} name={c.name} slug={c.slug} type={c.type} />
            ))}
            {children.length > 8 && <span className="pill">+{children.length - 8} más</span>}
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

function NodePill({ name, slug }: GeneticNode) {
  return (
    <Link
      to={`/strains/${slug}`}
      className="inline-block border-2 border-ink bg-white text-ink px-3 py-1.5 font-extrabold [font-stretch:85%] hover:bg-yellow transition-colors"
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
