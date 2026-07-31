import { data } from "react-router";
import type { Route } from "./+types/productos.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  throw data("Página en construcción", { status: 404 });
}

export function meta() {
  return [{ title: "Producto — WeedHub" }];
}

export default function ProductoSlugPage() {
  return null;
}
