import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { connectDB } from "~/lib/db.server";
import { StrainModel } from "~/models/strain.server";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Imágenes IA — Admin WeedHub" }];
}

type ImageStatus = "cloudinary" | "pexels" | "none";

type StrainRow = {
  _id: string;
  name: string;
  slug: string;
  type: string;
  imageUrl: string | null;
  colorHint: string | null;
  dominantTerpene: string | null;
  rank: number;
  imageStatus: ImageStatus;
};

export async function loader() {
  await connectDB();
  const strains = await StrainModel.find({ isArchived: false, reviewCount: { $gte: 1 } })
    .sort({ "averageRatings.overall": -1, reviewCount: -1 })
    .limit(100)
    .select("name slug type imageUrl colorHint dominantTerpene")
    .lean();

  const rows: StrainRow[] = strains.map((s, i) => {
    const url = s.imageUrl ?? null;
    let imageStatus: ImageStatus = "none";
    if (url?.includes("res.cloudinary.com")) imageStatus = "cloudinary";
    else if (url?.includes("pexels")) imageStatus = "pexels";

    return {
      _id: String(s._id),
      name: s.name,
      slug: s.slug,
      type: s.type,
      imageUrl: url,
      colorHint: s.colorHint ?? null,
      dominantTerpene: s.dominantTerpene ?? null,
      rank: i + 1,
      imageStatus,
    };
  });

  return { strains: rows };
}

type FetcherData = { imageUrl?: string; error?: string };

// Pool of 5 fetchers — hooks must be called unconditionally at top level
function useFetcherPool(): ReturnType<typeof useFetcher<FetcherData>>[] {
  return [
    useFetcher<FetcherData>(),
    useFetcher<FetcherData>(),
    useFetcher<FetcherData>(),
    useFetcher<FetcherData>(),
    useFetcher<FetcherData>(),
  ];
}

export default function GenerateImagesPage({ loaderData }: { loaderData: { strains: StrainRow[] } }) {
  const { strains: initialStrains } = loaderData;

  const [showAll, setShowAll] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [inFlight, setInFlight] = useState<Map<number, string>>(new Map()); // fetcherIndex → strainId
  const [done, setDone] = useState<Map<string, string>>(new Map()); // strainId → new imageUrl
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  const [strainImages, setStrainImages] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const s of initialStrains) {
      if (s.imageUrl) m.set(s._id, s.imageUrl);
    }
    return m;
  });

  const fetchers = useFetcherPool();
  const isRunning = queue.length > 0 || inFlight.size > 0;

  // Dispatch queue items to idle fetchers
  useEffect(() => {
    if (paused || queue.length === 0) return;

    for (let i = 0; i < fetchers.length; i++) {
      if (fetchers[i].state === "idle" && !inFlight.has(i) && queue.length > 0) {
        const [nextId, ...rest] = queue;
        if (done.has(nextId) || failed.has(nextId)) {
          setQueue(rest);
          continue;
        }
        setQueue(rest);
        setInFlight((prev) => new Map(prev).set(i, nextId));

        const formData = new FormData();
        formData.set("strainId", nextId);
        fetchers[i].submit(formData, {
          method: "post",
          action: "/api/admin/generate-strain-image",
        });
      }
    }
  }, [queue, inFlight, paused, done, failed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Collect fetcher results
  useEffect(() => {
    for (let i = 0; i < fetchers.length; i++) {
      const f = fetchers[i];
      const strainId = inFlight.get(i);
      if (!strainId) continue;

      if (f.state === "idle" && f.data) {
        if (f.data.imageUrl) {
          setDone((prev) => new Map(prev).set(strainId, f.data!.imageUrl!));
          setStrainImages((prev) => new Map(prev).set(strainId, f.data!.imageUrl!));
        } else {
          setFailed((prev) => new Set(prev).add(strainId));
        }
        setInFlight((prev) => {
          const next = new Map(prev);
          next.delete(i);
          return next;
        });
      }
    }
  }, [fetchers.map((f) => f.state + f.data).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  function startBulk() {
    const ids = initialStrains
      .filter((s) => s.imageStatus !== "cloudinary" && !done.has(s._id))
      .map((s) => s._id);
    setPaused(false);
    setQueue(ids);
  }

  function generateOne(strainId: string) {
    setQueue((prev) => [strainId, ...prev.filter((id) => id !== strainId)]);
    setPaused(false);
  }

  const countNone = initialStrains.filter((s) => s.imageStatus === "none").length;
  const countPexels = initialStrains.filter((s) => s.imageStatus === "pexels").length;
  const countCloudinary = initialStrains.filter((s) => s.imageStatus === "cloudinary").length;
  const countMissing = countNone + countPexels;
  const totalProgress = done.size + failed.size;
  const totalToProcess = done.size + failed.size + queue.length + inFlight.size;

  const visibleStrains = showAll
    ? initialStrains
    : initialStrains.filter((s) => s.imageStatus !== "cloudinary" || done.has(s._id) || failed.has(s._id));

  return (
    <div>
      <div className="mb-8">
        <div className="kicker mb-1">Admin</div>
        <h1 className="display text-3xl mb-4">Imágenes Top 100</h1>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="pill" style={{ color: "var(--warm)" }}>{countNone} sin imagen</span>
          <span className="pill">{countPexels} Pexels</span>
          <span className="pill" style={{ color: "var(--accent)" }}>{countCloudinary} Cloudinary</span>
        </div>

        {/* Progress bar */}
        {(isRunning || totalProgress > 0) && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-fg-muted mb-1">
              <span>{totalProgress} / {totalToProcess} procesadas</span>
              {failed.size > 0 && (
                <span style={{ color: "var(--warm)" }}>{failed.size} errores</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-elev overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: totalToProcess > 0 ? `${(totalProgress / totalToProcess) * 100}%` : "0%",
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="primary" onClick={startBulk} disabled={isRunning && !paused || countMissing === 0}>
            Generar imágenes faltantes ({countMissing})
          </Button>
          {isRunning && !paused && (
            <Button variant="ghost" onClick={() => setPaused(true)}>
              Pausar
            </Button>
          )}
          {paused && queue.length > 0 && (
            <Button variant="ghost" onClick={() => setPaused(false)}>
              Reanudar ({queue.length} restantes)
            </Button>
          )}
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm text-fg-muted hover:text-fg transition-colors"
          >
            {showAll ? "Solo faltantes" : "Ver todas"}
          </button>
        </div>
      </div>

      {/* Strain list */}
      <div className="space-y-0">
        {visibleStrains.map((strain) => {
          const currentImage = strainImages.get(strain._id) ?? strain.imageUrl;
          const isInFlight = Array.from(inFlight.values()).includes(strain._id);
          const isDone = done.has(strain._id);
          const isFailed = failed.has(strain._id);
          const isQueued = queue.includes(strain._id);

          let statusLabel = "";
          let statusColor = "";
          if (isInFlight) { statusLabel = "Generando..."; statusColor = "var(--accent)"; }
          else if (isDone) { statusLabel = "✓ Generada"; statusColor = "var(--accent)"; }
          else if (isFailed) { statusLabel = "Error"; statusColor = "var(--warm)"; }
          else if (isQueued) { statusLabel = "En cola"; statusColor = "var(--fg-muted)"; }
          else if (strain.imageStatus === "cloudinary") { statusLabel = "Cloudinary"; statusColor = "var(--accent)"; }
          else if (strain.imageStatus === "pexels") { statusLabel = "Pexels"; statusColor = "var(--fg-muted)"; }
          else { statusLabel = "Sin imagen"; statusColor = "var(--warm)"; }

          return (
            <div
              key={strain._id}
              className="flex items-center gap-4 py-3 border-b border-line last:border-0"
            >
              {/* Rank */}
              <span className="mono text-xs text-fg-dim w-6 text-right shrink-0">{strain.rank}</span>

              {/* Thumbnail */}
              <div
                className="w-14 h-10 rounded overflow-hidden border border-line shrink-0 bg-elev grid place-items-center"
              >
                {currentImage ? (
                  <img src={currentImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: strain.colorHint || "var(--bg-elev)" }}
                  />
                )}
              </div>

              {/* Name + type */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{strain.name}</div>
                <div className="text-xs text-fg-muted capitalize">{strain.type}</div>
              </div>

              {/* Status */}
              <span
                className={cn("text-xs font-medium shrink-0", isInFlight && "animate-pulse")}
                style={{ color: statusColor }}
              >
                {statusLabel}
              </span>

              {/* Individual generate button */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isInFlight || isQueued}
                onClick={() => generateOne(strain._id)}
                className="shrink-0 text-xs"
              >
                Generar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
