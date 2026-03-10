import { z } from "zod";

export const authSchema = z.object({
  email: z
    .string()
    .email("Correo electrónico inválido")
    .min(1, "El correo es requerido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  displayName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .optional(),
});

export const reviewSchema = z.object({
  ratings: z.object({
    overall: z.number().min(1).max(5),
    potency: z.number().min(1).max(5),
    flavor: z.number().min(1).max(5),
    aroma: z.number().min(1).max(5),
    appearance: z.number().min(1).max(5),
    effects: z.number().min(1).max(5),
  }),
  comment: z.string().max(2000).optional(),
  context: z.object({
    method: z.string().optional(),
    timeOfDay: z.string().optional(),
    setting: z.string().optional(),
  }).optional(),
  effectsExperienced: z.array(z.string()).optional(),
});

export const profileSchema = z.object({
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  avatar: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const onboardingSchema = z.object({
  experienceLevel: z.enum(["principiante", "intermedio", "experimentado", "experto"]),
  preferredEffects: z.array(z.string()),
  preferredMethods: z.array(z.string()),
  preferredTime: z.array(z.string()),
  thcPreference: z.enum(["low", "medium", "high", "any"]),
  cbdPreference: z.enum(["low", "medium", "high", "any"]),
});

export const strainSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["sativa", "indica", "hybrid"]),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  genetics: z.object({
    parent1: z.string().optional(),
    parent2: z.string().optional(),
    breeder: z.string().optional(),
  }).optional(),
  cannabinoidProfile: z.object({
    thc: z.object({ min: z.number(), max: z.number() }),
    cbd: z.object({ min: z.number(), max: z.number() }),
  }),
  effects: z.array(z.string()),
  flavors: z.array(z.string()),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
