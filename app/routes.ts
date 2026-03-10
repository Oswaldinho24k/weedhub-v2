import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("auth", "routes/auth.tsx"),
  route("logout", "routes/logout.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("strains", "routes/strains.tsx"),
  route("strains/:slug", "routes/strains.$slug.tsx"),
  route("strains/:slug/review", "routes/strains.$slug.review.tsx"),
  route("profile", "routes/profile.tsx"),
  route("profile/:userId", "routes/profile.$userId.tsx"),
  route("profile/edit", "routes/profile_.edit.tsx"),
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("strains", "routes/admin.strains.tsx"),
    route("reviews", "routes/admin.reviews.tsx"),
  ]),
  route("api/reviews/:reviewId/vote", "routes/api/reviews.$reviewId.vote.tsx"),
  route("api/strains/:strainId/save", "routes/api/strains.$strainId.save.tsx"),
] satisfies RouteConfig;
