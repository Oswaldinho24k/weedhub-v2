import { type RouteConfig, index, route } from "@react-router/dev/routes";

/**
 * Content that Google indexes per-locale → gets URL prefix.
 * Landing, directory, strain detail, community, editorial, legal, DS.
 *
 * User-facing flows (auth, onboarding, profile, review submit, admin)
 * stay unlocalized; they read the active locale from cookie at runtime.
 * This keeps route IDs simple and matches real-world i18n patterns.
 */
function publicRoutes(prefix: "" | "pt") {
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
    route(p("sobre"), "routes/sobre.tsx", { id: id("sobre") }),
    route(p("mapa-verde"), "routes/mapa-verde.tsx", { id: id("mapa-verde") }),
    route(p("mapa-verde/:country"), "routes/mapa-verde.$country.tsx", { id: id("mapa-verde-country") }),
    route(p("top-100"), "routes/top-100.tsx", { id: id("top-100") }),
    route(p("para"), "routes/para.tsx", { id: id("para") }),
    route(p("para/:condition"), "routes/para.$condition.tsx", { id: id("para-condition") }),
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
  // Only Spanish is served: /en, /pt and their subpaths 301 to the Spanish URL
  route("en", "routes/en-redirect.tsx", { id: "en-root" }),
  route("pt", "routes/en-redirect.tsx", { id: "pt-root" }),
  route("pt/*", "routes/en-redirect.tsx", { id: "pt-splat" }),
  route("en/*", "routes/en-redirect.tsx", { id: "en-splat" }),

  // Account / review / admin flows — unlocalized, read locale from cookie
  route("auth", "routes/auth.tsx"),
  route("auth/forgot-password", "routes/auth_.forgot-password.tsx"),
  route("auth/reset-password", "routes/auth_.reset-password.tsx"),
  route("auth/google", "routes/auth_.google.tsx"),
  route("auth/google/callback", "routes/auth_.google.callback.tsx"),
  route("logout", "routes/logout.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("strains/:slug/review", "routes/strains.$slug.review.tsx"),
  route("strains/sugerir", "routes/strains_.sugerir.tsx"),
  route("profile", "routes/profile.tsx"),
  route("profile/:username", "routes/profile.$username.tsx"),
  route("profile/edit", "routes/profile_.edit.tsx"),
  route("profile/saved", "routes/profile_.saved.tsx"),
  route("profile/delete", "routes/profile_.delete.tsx"),
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("revision", "routes/admin.revision.tsx"),
    route("generate-images", "routes/admin.generate-images.tsx"),
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
    route("community", "routes/admin.community.tsx"),
  ]),

  // Comunidad / Foros
  route("comunidad", "routes/comunidad.tsx"),
  route("comunidad/nuevo", "routes/comunidad_.nuevo.tsx"),
  route("comunidad/:slug", "routes/comunidad.$slug.tsx"),

  // AI recommender
  route("recomendar", "routes/recomendar.tsx"),
  route("api/ai/find-strain", "routes/api/ai.find-strain.tsx"),

  // Mapa Verde — legal status by country

  // Magazine
  route("magazine", "routes/magazine.tsx"),
  route("magazine/:slug", "routes/magazine.$slug.tsx"),
  route("magazine.rss", "routes/magazine[.]rss.tsx"),
  route("llms.txt", "routes/llms[.]txt.tsx"),
  route("mcp", "routes/mcp.tsx"),

  // Rankings y editoriales

  // Condiciones médicas

  // Marcas
  route("marcas", "routes/marcas.tsx"),
  route("marcas/registrar", "routes/marcas_.registrar.tsx"),
  route("marcas/:slug/reclamar", "routes/marcas.$slug_.reclamar.tsx"),
  route("marcas/:slug/editar", "routes/marcas.$slug_.editar.tsx"),
  route("marcas/:slug/review", "routes/marcas.$slug_.review.tsx"),
  route("marcas/:slug", "routes/marcas.$slug.tsx"),
  route("planes", "routes/planes.tsx"),
  route("productos", "routes/productos.tsx"),
  route("productos/:slug", "routes/productos.$slug.tsx"),
  // Dispensarios
  route("dispensarios", "routes/dispensarios.tsx"),
  route("dispensarios/agregar", "routes/dispensarios_.agregar.tsx"),
  route("dispensarios/:slug/review", "routes/dispensarios.$slug_.review.tsx"),
  route("dispensarios/:slug", "routes/dispensarios.$slug.tsx"),

  // API + sitemap — locale-agnostic
  route("api/users/:userId/follow", "routes/api/users.$userId.follow.tsx"),
  route("api/stripe/checkout", "routes/api/stripe.checkout.tsx"),
  route("api/stripe/webhook", "routes/api/stripe.webhook.tsx"),
  route("api/stripe/portal", "routes/api/stripe.portal.tsx"),
  route("api/posts/:postId/vote", "routes/api/posts.$postId.vote.tsx"),
  route("api/comments/:commentId/vote", "routes/api/comments.$commentId.vote.tsx"),
  route("api/reviews/:reviewId/vote", "routes/api/reviews.$reviewId.vote.tsx"),
  route("api/strains/:strainId/quick-rate", "routes/api/strains.$strainId.quick-rate.tsx"),
  route("api/strains/:strainId/save", "routes/api/strains.$strainId.save.tsx"),
  route("api/theme", "routes/api/theme.tsx"),
  route("api/newsletter", "routes/api/newsletter.tsx"),
  route("api/locale", "routes/api/locale.tsx"),
  route("api/strain-search", "routes/api/strain-search.tsx"),
  route("api/admin/ai", "routes/api/admin.ai.tsx"),
  route("api/admin/generate-strain-image", "routes/api.admin.generate-strain-image.ts"),
  route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
] satisfies RouteConfig;
