import { connectDB } from "~/lib/db.server";
import { ProductCategoryModel } from "~/models/product-category.server";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/productos";
import { NewsletterSignup } from "~/components/layout/newsletter-signup";

export function meta() {
  return [
    { title: "Productos de Cannabis — WeedHub" },
    { name: "description", content: "Flores, concentrados, semillas, nutrientes y equipos de cultivo. Cannabis verificado en México y Latinoamérica." },
  ];
}

export async function loader() {
  await connectDB();
  const categories = await ProductCategoryModel.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .lean();
  return {
    consumo: categories.filter((c) => (c as any).sector !== "cultivo"),
    cultivo: categories.filter((c) => (c as any).sector === "cultivo"),
  };
}

export default function ProductosPage() {
  const { consumo, cultivo } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-[900px] px-6 py-20">
      {/* Hero */}
      <div className="mb-16">
        <div className="kicker mb-3">WeedHub · Catálogo</div>
        <h1 className="display text-5xl mb-6">Catálogo de Productos</h1>
        <p className="text-lg text-fg-muted leading-relaxed max-w-2xl">
          Flores, concentrados, comestibles y también semillas, nutrientes y equipo de cultivo —
          organizados por categoría, verificados por marca, calificados por la comunidad.
        </p>
      </div>

      {/* Consumo */}
      <div className="mb-12">
        <div className="kicker mb-4">Para consumo</div>
        <div className="grid sm:grid-cols-2 gap-4">
          {consumo.length > 0 ? consumo.map((cat) => (
            <div key={String(cat._id)} className="card p-5">
              <div className="font-medium mb-1">{cat.labelEs}</div>
              {cat.hasCannabinoidsProfile && (
                <span className="pill accent text-xs">THC/CBD</span>
              )}
            </div>
          )) : DEFAULT_CONSUMO.map((cat) => (
            <div key={cat.label} className="card p-5">
              <div className="font-medium mb-1">{cat.label}</div>
              <p className="text-sm text-fg-muted">{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cultivo */}
      <div className="mb-16">
        <div className="kicker mb-4">Para cultivadores</div>
        <div className="grid sm:grid-cols-2 gap-4">
          {cultivo.length > 0 ? cultivo.map((cat) => (
            <div key={String(cat._id)} className="card p-5">
              <div className="font-medium mb-1">{cat.labelEs}</div>
            </div>
          )) : DEFAULT_CULTIVO.map((cat) => (
            <div key={cat.label} className="card p-5">
              <div className="font-medium mb-1">{cat.label}</div>
              <p className="text-sm text-fg-muted">{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 card mb-16">
        <div className="kicker mb-2">En construcción</div>
        <p className="text-fg-muted text-sm max-w-xl">
          El catálogo se llenará conforme las marcas registren sus productos y la comunidad los revise.
          Sé de los primeros en saberlo cuando esté listo.
        </p>
      </div>

      <NewsletterSignup />
    </div>
  );
}

const DEFAULT_CONSUMO = [
  { label: "Flor / Cogollos", description: "Cannabis sin procesar, secado y curado." },
  { label: "Concentrados", description: "Cera, resina, aceite. Alta potencia." },
  { label: "Comestibles", description: "Gomitas, chocolates, bebidas infusionadas." },
  { label: "Vapes", description: "Cartuchos y dispositivos. Sin combustión." },
  { label: "Tinturas", description: "Extractos sublinguales. Dosificación precisa." },
  { label: "Tópicos", description: "Cremas y bálsamos. Sin psicoactividad." },
];

const DEFAULT_CULTIVO = [
  { label: "Semillas", description: "Feminizadas, autoflorecientes y regulares." },
  { label: "Clones / Esquejes", description: "Material genético probado." },
  { label: "Nutrientes", description: "Fertilizantes y aditivos para cada etapa." },
  { label: "Sustratos", description: "Tierra, coco coir, hidropónico." },
  { label: "Iluminación", description: "LED, HPS, CMH para indoor." },
  { label: "Equipo", description: "Carpas, extractores, temporizadores." },
];
