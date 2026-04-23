export interface Country {
  code: string;
  label: string;
  flag: string;
}

export const LATIN_COUNTRIES: Country[] = [
  { code: "MX", label: "México", flag: "🇲🇽" },
  { code: "CO", label: "Colombia", flag: "🇨🇴" },
  { code: "AR", label: "Argentina", flag: "🇦🇷" },
  { code: "CL", label: "Chile", flag: "🇨🇱" },
  { code: "UY", label: "Uruguay", flag: "🇺🇾" },
  { code: "PE", label: "Perú", flag: "🇵🇪" },
  { code: "EC", label: "Ecuador", flag: "🇪🇨" },
  { code: "VE", label: "Venezuela", flag: "🇻🇪" },
  { code: "BO", label: "Bolivia", flag: "🇧🇴" },
  { code: "PY", label: "Paraguay", flag: "🇵🇾" },
  { code: "CR", label: "Costa Rica", flag: "🇨🇷" },
  { code: "PA", label: "Panamá", flag: "🇵🇦" },
  { code: "GT", label: "Guatemala", flag: "🇬🇹" },
  { code: "DO", label: "República Dominicana", flag: "🇩🇴" },
  { code: "PR", label: "Puerto Rico", flag: "🇵🇷" },
  { code: "ES", label: "España", flag: "🇪🇸" },
  { code: "US", label: "Estados Unidos", flag: "🇺🇸" },
  { code: "OT", label: "Otro", flag: "🌎" },
];

const COUNTRY_CODES = new Set(LATIN_COUNTRIES.map((c) => c.code));

export function isValidCountry(code: string | undefined | null): boolean {
  return !!code && COUNTRY_CODES.has(code);
}

export function countryLabel(code: string | undefined | null): string {
  if (!code) return "";
  return LATIN_COUNTRIES.find((c) => c.code === code)?.label || code;
}

export function countryFlag(code: string | undefined | null): string {
  if (!code) return "";
  return LATIN_COUNTRIES.find((c) => c.code === code)?.flag || "";
}

export interface AcquisitionSource {
  value: string;
  label: string;
}

export const ACQUISITION_SOURCES: AcquisitionSource[] = [
  { value: "friend", label: "Un amigo me lo mostró" },
  { value: "search", label: "Buscando en Google" },
  { value: "social", label: "Redes sociales" },
  { value: "press", label: "Prensa o artículo" },
  { value: "magazine", label: "Revista cannábica" },
  { value: "event", label: "Evento o feria" },
  { value: "other", label: "Otro" },
];

const ACQUISITION_VALUES = new Set(ACQUISITION_SOURCES.map((s) => s.value));

export function isValidAcquisitionSource(value: string | undefined): boolean {
  return !!value && ACQUISITION_VALUES.has(value);
}
