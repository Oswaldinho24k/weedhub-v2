import { data } from "react-router";
import type { Route } from "./+types/dispensarios.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  throw data("Página en construcción", { status: 404 });
}

export function meta() {
  return [{ title: "Dispensario — WeedHub" }];
}

export default function DispensarioSlugPage() {
  return null;
}
