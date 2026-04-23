/**
 * Brazilian Portuguese editorial curation. AI-drafted.
 * TODO(editorial-pt): Commission native pt-BR writers for launch. Cannabis
 * culture in Brazil has distinct context (legal status, dispensary absence,
 * autocultivo movement) — these stubs should be rewritten, not translated.
 */
import type { Article, CommunityVoice } from "./articles.es";

export const FEATURED_ARTICLES_PT: Article[] = [
  {
    slug: "autocultivo-brasil",
    title: "Autocultivo no Brasil: habeas corpus, ANVISA e a realidade doméstica",
    kicker: "Cultura",
    readTime: "10 min",
    dek:
      "De São Paulo a Recife, cultivadores pessoais navegam um marco legal em construção. Uma leitura honesta sobre o possível e o recomendável.",
    author: "Mariana Ribeiro",
  },
  {
    slug: "terpenos-101",
    title: "Terpenos 101: por que duas variedades com o mesmo THC parecem diferentes",
    kicker: "Ciência",
    readTime: "6 min",
    dek:
      "Mirceno, limoneno, linalol — a química que define aroma, sabor e efeito. Leitura rápida, sem encheção.",
    author: "Dr. Camilo Vega",
  },
  {
    slug: "cannabis-medicinal-cbd",
    title: "Cannabis medicinal no SUS: onde a pauta está (e para onde precisa ir)",
    kicker: "Saúde",
    readTime: "9 min",
    dek:
      "Associações de pacientes, liminares e o acesso real ao CBD brasileiro. O que mudou em 2025.",
    author: "Dra. Paola Lima",
  },
  {
    slug: "dosificacao-microdoses",
    title: "Microdoses: como medir o que funciona sem passar do ponto",
    kicker: "Educação",
    readTime: "5 min",
    dek:
      "Um guia honesto para iniciantes: por que menos é mais e como manter sua própria bitácora.",
    author: "Ana Paula Tovar",
  },
  {
    slug: "cultivo-clima-tropical",
    title: "Cultivo indoor em clima tropical: umidade, fungos e como não perder a colheita",
    kicker: "Cultivo",
    readTime: "12 min",
    dek:
      "De Belo Horizonte a Manaus, os erros mais comuns e como evitá-los. Com tabelas por fase.",
    author: "Hernán Ospina",
  },
  {
    slug: "cbd-ansiedade",
    title: "CBD e ansiedade: o que a evidência diz (e o que é marketing)",
    kicker: "Saúde",
    readTime: "7 min",
    dek:
      "Revisamos sete estudos. Os resultados são promissores — e também mais complicados do que vendem.",
    author: "Dra. Paola Lima",
  },
];

export const COMMUNITY_VOICES_PT: CommunityVoice[] = [
  {
    name: "Laura",
    city: "São Paulo",
    role: "Curiosa",
    quote:
      "Cheguei ao WeedHub buscando informação clara e sem sermões. Encontrei uma comunidade que explica sem julgar.",
  },
  {
    name: "Matheus",
    city: "Rio de Janeiro",
    role: "Cultivador",
    quote:
      "As avaliações com contexto me ajudam a escolher genéticas. Saber se foi fumado ou vaporizado muda tudo.",
  },
  {
    name: "Renata",
    city: "Belo Horizonte",
    role: "Uso terapêutico",
    quote:
      "Finalmente um lugar onde o 'momento do dia' é parte da avaliação. Meu corpo e a Indica têm horários.",
  },
];
