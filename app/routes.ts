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
    route(p("guias"), "routes/guias.tsx", { id: id("guias") }),
    route(p("guias/:slug"), "routes/guias.$slug.tsx", { id: id("guias-slug") }),
    route(p("glosario"), "routes/glosario.tsx", { id: id("glosario") }),
    route(p("glosario/:slug"), "routes/glosario.$slug.tsx", { id: id("glosario-slug") }),
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
    route("effects", "routes/admin.effects.tsx"),
    route("users", "routes/admin.users.tsx"),
    route("product-categories", "routes/admin.product-categories.tsx"),
    route("brands", "routes/admin.brands.tsx"),
    route("products", "routes/admin.products.tsx"),
    route("dispensaries", "routes/admin.dispensaries.tsx"),
    route("legal-status", "routes/admin.legal-status.tsx"),
    route("glossary", "routes/admin.glossary.tsx"),
    route("articles", "routes/admin.articles.tsx"),
  ]),

  // Mapa Verde — legal status by country
  route("mapa-verde", "routes/mapa-verde.tsx"),
  route("mapa-verde/:country", "routes/mapa-verde.$country.tsx"),

  // Rankings y editoriales
  route("top-100", "routes/top-100.tsx"),

  // Condiciones médicas
  route("para", "routes/para.tsx"),
  route("para/:condition", "routes/para.$condition.tsx"),

  // Public stubs — content will be built as the platform grows
  route("marcas", "routes/marcas.tsx"),
  route("marcas/:slug", "routes/marcas.$slug.tsx"),
  route("productos", "routes/productos.tsx"),
  route("productos/:slug", "routes/productos.$slug.tsx"),
  route("dispensarios", "routes/dispensarios.tsx"),
  route("dispensarios/:slug", "routes/dispensarios.$slug.tsx"),

  // API + sitemap — locale-agnostic
  route("api/reviews/:reviewId/vote", "routes/api/reviews.$reviewId.vote.tsx"),
  route("api/strains/:strainId/quick-rate", "routes/api/strains.$strainId.quick-rate.tsx"),
  route("api/strains/:strainId/save", "routes/api/strains.$strainId.save.tsx"),
  route("api/theme", "routes/api/theme.tsx"),
  route("api/newsletter", "routes/api/newsletter.tsx"),
  route("api/locale", "routes/api/locale.tsx"),
  route("api/strain-search", "routes/api/strain-search.tsx"),
  route("api/admin/ai", "routes/api/admin.ai.tsx"),
  route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
] satisfies RouteConfig;
