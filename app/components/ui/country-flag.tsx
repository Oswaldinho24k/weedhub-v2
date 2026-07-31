import {
  MX, CO, UY, AR, CL, BR, PE, BO, PY, EC, VE,
  CR, PA, GT, HN, SV, NI, DO, CU, PR, ES, DE,
  US, CA,
} from "country-flag-icons/react/3x2";
import type { FC } from "react";

type FlagComponent = FC<{ title?: string; className?: string }>;

const FLAG_MAP: Record<string, FlagComponent> = {
  MX, CO, UY, AR, CL, BR, PE, BO, PY, EC, VE,
  CR, PA, GT, HN, SV, NI, DO, CU, PR, ES, DE,
  US, CA,
};

export function CountryFlag({
  code,
  title,
  className = "w-7 h-auto",
}: {
  code: string;
  title?: string;
  className?: string;
}) {
  const Flag = FLAG_MAP[code.toUpperCase()];
  if (!Flag) return null;
  return <Flag title={title} className={className} />;
}
