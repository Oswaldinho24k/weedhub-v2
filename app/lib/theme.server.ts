import { createCookie } from "react-router";

export type Theme = "dark" | "light";

export const themeCookie = createCookie("wh:theme", {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax",
});

export async function getTheme(request: Request): Promise<Theme> {
  const header = request.headers.get("Cookie");
  const value = (await themeCookie.parse(header)) as Theme | null;
  return value === "light" ? "light" : "dark";
}

export async function serializeTheme(theme: Theme): Promise<string> {
  return themeCookie.serialize(theme);
}
