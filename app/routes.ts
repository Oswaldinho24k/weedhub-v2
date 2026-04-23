import { type RouteConfig, index, route } from "@react-router/dev/routes";

/**
 * Content that Google indexes per-locale → gets URL prefix.
 * Landing, directory, strain detail, community, editorial, legal, DS.
 *
 * User-facing flows (auth, onboarding, profile, review submit, admin)
 * stay unlocalized; they read the active locale from cookie at runtime.
 * This keeps route IDs simple and matches real-world i18n patterns.
 */
function publicRoutes(prefix: "" | "pt" | "en") {
  const p = (path: string) => (prefix ? `${prefix}/${path}` : path);
  const id = (base: string) => (prefix ? `${base}-${prefix}` : base);

  return [
    prefix
      ? route(prefix, "routes/_index.tsx", { id: id("_index"), index: true })
      : index("routes/_index.tsx"),
    route(p("strains"), "routes/strains.tsx", { id: id("strains") }),
    route(p("strains/:slug"), "routes/strains.$slug.tsx", { id: id("strain-slug") }),
    route(p("community"), "routes/community.tsx", { id: id("community") }),
    route(p("editorial"), "routes/editorial.tsx", { id: id("editorial") }),
    route(p("terminos"), "routes/terminos.tsx", { id: id("terminos") }),
    route(p("privacidad"), "routes/privacidad.tsx", { id: id("privacidad") }),
    route(p("ds"), "routes/ds.tsx", { id: id("ds") }),
  ];
}

export default [
  // Public content — three locales
  ...publicRoutes(""),
  ...publicRoutes("pt"),
  ...publicRoutes("en"),

  // Account / review / admin flows — unlocalized, read locale from cookie
  route("auth", "routes/auth.tsx"),
  route("logout", "routes/logout.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("strains/:slug/review", "routes/strains.$slug.review.tsx"),
  route("strains/sugerir", "routes/strains_.sugerir.tsx"),
  route("profile", "routes/profile.tsx"),
  route("profile/:username", "routes/profile.$username.tsx"),
  route("profile/edit", "routes/profile_.edit.tsx"),
  route("profile/saved", "routes/profile_.saved.tsx"),
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("strains", "routes/admin.strains.tsx"),
    route("reviews", "routes/admin.reviews.tsx"),
    route("submissions", "routes/admin.submissions.tsx"),
  ]),

  // API + sitemap — locale-agnostic
  route("api/reviews/:reviewId/vote", "routes/api/reviews.$reviewId.vote.tsx"),
  route("api/strains/:strainId/save", "routes/api/strains.$strainId.save.tsx"),
  route("api/theme", "routes/api/theme.tsx"),
  route("api/newsletter", "routes/api/newsletter.tsx"),
  route("api/locale", "routes/api/locale.tsx"),
  route("api/strain-search", "routes/api/strain-search.tsx"),
  route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
] satisfies RouteConfig;
