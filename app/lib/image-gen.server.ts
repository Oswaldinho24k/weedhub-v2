export async function generateStrainImage(prompt: string): Promise<string> {
  const apiKey = process.env.IMAGE_GEN_API_KEY;
  if (!apiKey) {
    throw new Error("IMAGE_GEN_API_KEY no está configurada. Agrégala en las variables de entorno.");
  }

  const provider = process.env.IMAGE_GEN_PROVIDER || "fal";

  if (provider === "fal") {
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_4_3",
        num_images: 1,
        num_inference_steps: 4,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`fal.ai error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { images: Array<{ url: string }> };
    const url = data?.images?.[0]?.url;
    if (!url) throw new Error("fal.ai no devolvió ninguna imagen");
    return url;
  }

  throw new Error(`Proveedor desconocido: IMAGE_GEN_PROVIDER="${provider}". Usa "fal".`);
}
