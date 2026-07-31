import { data } from "react-router";
import type { Route } from "./+types/marcas.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  throw data("Página en construcción", { status: 404 });
}

export function meta() {
  return [{ title: "Marca — WeedHub" }];
}

export default function MarcaSlugPage() {
  return null;
}
