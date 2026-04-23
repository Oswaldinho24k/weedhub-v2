import { UserModel } from "~/models/user.server";

const ADJECTIVES = [
  "Tranquilo", "Serena", "Curioso", "Valiente", "Silente", "Calma",
  "Viva", "Sagaz", "Noble", "Astuto", "Plácida", "Rauda",
  "Audaz", "Mística", "Lúcida", "Sobria", "Aguda", "Fluida",
  "Vibrante", "Ligero", "Radiante", "Sensata", "Intrépida", "Ágil",
  "Profunda", "Sutil", "Luminosa", "Firme", "Liviana", "Risueña",
];

const CREATURES = [
  "Jaguar", "Ceiba", "Quetzal", "Totem", "Nopal", "Puma",
  "Guacamaya", "Ocelote", "Tucán", "Iguana", "Maguey", "Colibrí",
  "Cenzontle", "Axolotl", "Zorro", "Mapache", "Lince", "Tapir",
  "Cóndor", "Flamingo", "Cardenal", "Venado", "Caimán", "Armadillo",
  "Orquídea", "Cactus", "Bromelia", "Palmera", "Amanita", "Bambú",
];

function random<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fourDigit(): string {
  return String(Math.floor(Math.random() * 9000) + 1000);
}

export async function generateAnonymousHandle(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const candidate = `${random(ADJECTIVES)}-${random(CREATURES)}-${fourDigit()}`;
    const exists = await UserModel.exists({ anonymousHandle: candidate });
    if (!exists) return candidate;
  }
  // Fallback after 8 collisions: append timestamp suffix (virtually impossible to collide)
  return `${random(ADJECTIVES)}-${random(CREATURES)}-${fourDigit()}-${Date.now().toString(36).slice(-4)}`;
}
