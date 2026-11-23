import { redirect } from "react-router";
import type { Route } from "./+types/en-redirect";

/** WeedHub serves Spanish only for now. /en and /pt URLs move permanently to Spanish. */
export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/(en|pt)(?=\/|$)/, "") || "/";
  return redirect(`${rest}${url.search}`, 301);
}
