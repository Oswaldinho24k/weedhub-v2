import { redirect } from "react-router";
import type { Route } from "./+types/en-redirect";

/** WeedHub serves Spanish and Portuguese only. Old /en URLs move permanently to Spanish. */
export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return redirect(`${rest}${url.search}`, 301);
}
