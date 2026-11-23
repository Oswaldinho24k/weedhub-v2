import { Form, Link, redirect, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.revision";
import { requireAdmin } from "~/lib/auth.server";
import {
  COLLECTIONS,
  isCollectionKey,
  reviewStats,
  listQueue,
  getRecord,
  updateRecord,
  setRevisionStatus,
  setEditorialNoteStatus,
  generateEditorialNote,
  nextPending,
  type CollectionKey,
  type RevisionStatus,
} from "~/services/content-review.server";
import { Icon } from "~/components/ui/icon";
import { REVIEW_COLLECTIONS } from "~/lib/review-ui";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Revisión — Admin WeedHub" }, { name: "robots", content: "noindex" }];
}

const STATUS_LABEL: Record<RevisionStatus, string> = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };
const STATUS_CLASS: Record<RevisionStatus, string> = {
  pendiente: "bg-white text-ink border-dashed",
  aprobado: "bg-lime text-ink",
  rechazado: "bg-pink text-ink",
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const c = url.searchParams.get("c");
  const collection: CollectionKey = isCollectionKey(c) ? c : "cepas";
  const status = (url.searchParams.get("s") as RevisionStatus | "todos") || "pendiente";
  const q = url.searchParams.get("q") || "";
  const page = Number(url.searchParams.get("p")) || 1;
  const [stats, queue] = await Promise.all([reviewStats(), listQueue({ collection, status, q, page })]);
  const id = url.searchParams.get("id") || queue.items[0]?.id || null;
  const record = id ? await getRecord(collection, id) : null;
  return { stats, queue, record, collection, status, q, page };
}

export async function action({ request }: Route.ActionArgs) {
  const admin = await requireAdmin(request);
  const by = admin.username || admin.displayName || "admin";
  const fd = await request.formData();
  const intent = String(fd.get("intent"));
  const c = String(fd.get("collection"));
  const id = String(fd.get("id"));
  if (!isCollectionKey(c)) return { error: "Colección inválida" };
  const back = new URL(request.url);

  const values: Record<string, unknown> = {};
  for (const f of COLLECTIONS[c].fields) if (fd.has(`f:${f.path}`)) values[f.path] = fd.get(`f:${f.path}`);

  if (intent === "save" || intent === "save-approve") {
    const r = await updateRecord(c, id, values, "admin", by);
    if (!r.ok) return { error: r.error };
    if (intent === "save") return { ok: "Cambios guardados" };
  }
  if (intent === "save-approve" || intent === "approve" || intent === "reject") {
    await setRevisionStatus(c, id, intent === "reject" ? "rechazado" : "aprobado", by, String(fd.get("note") || ""));
    // keep moving: open the next pending record of the same collection
    const next = await nextPending(c);
    back.searchParams.set("c", c);
    back.searchParams.delete("id");
    if (next) back.searchParams.set("id", next);
    return redirect(back.pathname + back.search);
  }
  if (intent === "note-generate" && c === "cepas") {
    const r = await generateEditorialNote(id);
    return r.ok ? { ok: "Nota generada: revísala y apruébala" } : { error: r.error };
  }
  if ((intent === "note-approve" || intent === "note-reject") && c === "cepas") {
    if (intent === "note-approve" && values["editorialNote.text"] != null) await updateRecord(c, id, { "editorialNote.text": values["editorialNote.text"] }, "admin", by);
    await setEditorialNoteStatus(id, intent === "note-approve" ? "aprobado" : "rechazado", by);
    return { ok: intent === "note-approve" ? "Nota aprobada: ya es pública" : "Nota rechazada" };
  }
  return { error: "Acción desconocida" };
}

export default function RevisionPage({ loaderData, actionData }: Route.ComponentProps) {
  const { stats, queue, record, collection, status, q } = loaderData;
  const [params] = useSearchParams();
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  const link = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v == null ? p.delete(k) : p.set(k, v));
    return `?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display text-3xl">Revisión de contenido</h2>
        <p className="text-fg-muted mt-1 max-w-[70ch]">
          Valida registro por registro la información que publica WeedHub. Aprobar marca el registro como revisado por ti; el asistente IA puede proponer cambios, pero solo tú apruebas.
        </p>
      </div>

      {/* Collections with progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {REVIEW_COLLECTIONS.map(({ key: k, label }) => {
          const st = stats[k];
          const pct = st.total ? Math.round((st.aprobado / st.total) * 100) : 0;
          return (
            <Link
              key={k}
              to={link({ c: k, id: null, p: null, q: null })}
              className={cn("card p-4 transition-colors", k === collection ? "bg-yellow text-ink" : "hover:bg-sunken")}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-extrabold [font-stretch:85%]">{label}</span>
                <span className="text-sm font-bold tnum">{pct}%</span>
              </div>
              <div className="mt-2 h-2 border border-ink bg-white">
                <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 text-xs font-bold tnum">
                {st.pendiente} pendientes · {st.aprobado} aprobados{st.rechazado ? ` · ${st.rechazado} rechazados` : ""}
                {k === "cepas" && st.notasPendientes ? ` · ${st.notasPendientes} notas por revisar` : ""}
              </div>
            </Link>
          );
        })}
      </div>

      {actionData && "error" in actionData && actionData.error && (
        <p className="border-2 border-ink bg-pink text-ink px-3 py-2 font-semibold">{actionData.error}</p>
      )}
      {actionData && "ok" in actionData && actionData.ok && (
        <p className="border-2 border-ink bg-lime text-ink px-3 py-2 font-semibold">{actionData.ok}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
        {/* Queue */}
        <aside className="card p-3 space-y-3 lg:sticky lg:top-6">
          <div className="flex gap-1 flex-wrap">
            {(["pendiente", "aprobado", "rechazado", "todos"] as const).map((s) => (
              <Link key={s} to={link({ s, id: null, p: null })} className={cn("chip !text-xs !py-1", status === s && "on")}>
                {s === "todos" ? "Todos" : STATUS_LABEL[s]}
              </Link>
            ))}
          </div>
          <Form method="get" className="flex gap-2">
            <input type="hidden" name="c" value={collection} />
            <input type="hidden" name="s" value={status} />
            <input name="q" defaultValue={q} placeholder="Buscar…" className="input !py-1.5" />
          </Form>
          <p className="text-xs font-bold text-fg-muted">{queue.total} registros</p>
          <ul className="max-h-[60vh] overflow-y-auto -mx-1">
            {queue.items.map((it) => (
              <li key={it.id}>
                <Link
                  to={link({ id: it.id })}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-2 border-b border-line text-sm font-semibold hover:bg-yellow hover:text-ink",
                    record?.id === it.id && "bg-ink text-white"
                  )}
                >
                  <span className="truncate">{it.title}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {it.noteStatus === "pendiente" && <span title="Nota por revisar" className="w-2 h-2 bg-orange border border-ink" />}
                    <span className={cn("text-[10px] uppercase font-extrabold border px-1", STATUS_CLASS[it.status])}>{STATUS_LABEL[it.status]}</span>
                  </span>
                </Link>
              </li>
            ))}
            {queue.items.length === 0 && <li className="px-2 py-6 text-sm text-fg-muted">Nada por aquí.</li>}
          </ul>
          <div className="flex justify-between text-sm font-bold">
            {queue.page > 1 ? <Link to={link({ p: String(queue.page - 1), id: null })}>← Anterior</Link> : <span />}
            {queue.page * queue.perPage < queue.total ? <Link to={link({ p: String(queue.page + 1), id: null })}>Siguiente →</Link> : <span />}
          </div>
        </aside>

        {/* Record */}
        {record ? (
          <section className="card p-5 space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="display text-3xl">{record.title}</h3>
                <p className="text-sm font-semibold text-fg-muted mt-1">
                  <span className={cn("text-[11px] uppercase font-extrabold border px-1 mr-2", STATUS_CLASS[record.revision.status])}>{STATUS_LABEL[record.revision.status]}</span>
                  {record.revision.reviewedAt && `Revisado ${new Date(record.revision.reviewedAt).toLocaleDateString("es-MX")} por ${record.revision.reviewedBy}`}
                  {record.revision.lastEditedBy && ` · Última edición: ${record.revision.lastEditedBy}`}
                </p>
              </div>
              <a href={record.publicPath} target="_blank" rel="noreferrer" className="btn btn-ghost !py-1.5 !text-xs">
                <Icon name="externalLink" size={13} /> Ver en el sitio
              </a>
            </header>

            {record.context && (
              <div className="bg-sunken border-2 border-ink p-3 text-sm space-y-1">
                <div className="font-extrabold uppercase text-xs [font-stretch:80%]">Contexto (solo lectura)</div>
                {"terpenes" in record.context && <p><b>Terpenos:</b> {(record.context as any).terpenes.join(", ") || "sin datos"}</p>}
                {"effectsEs" in record.context && <p><b>Efectos (como se muestran):</b> {(record.context as any).effectsEs.join(", ") || "sin datos"}</p>}
                {"momento" in record.context && (record.context as any).momento && (
                  <p><b>Momento:</b> mañana {(record.context as any).momento.manana}% · tarde {(record.context as any).momento.tarde}% · noche {(record.context as any).momento.noche}%</p>
                )}
                {"sources" in record.context && (
                  <ul className="list-disc pl-5">
                    {((record.context as any).sources as any[]).map((s, i) => (
                      <li key={i}>{s.url ? <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : s.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <Form method="post" className="space-y-4" key={record.id}>
              <input type="hidden" name="collection" value={collection} />
              <input type="hidden" name="id" value={record.id} />
              {record.fields.map((f) => (
                <label key={f.path} className="block">
                  <span className="label">{f.label}</span>
                  {f.kind === "longtext" ? (
                    <textarea name={`f:${f.path}`} defaultValue={String(f.value ?? "")} rows={f.path === "body" ? 16 : 4} className="input" />
                  ) : f.kind === "list" ? (
                    <textarea name={`f:${f.path}`} defaultValue={(f.value as string[]).join("\n")} rows={Math.max(3, (f.value as string[]).length + 1)} className="input" />
                  ) : f.kind === "select" ? (
                    <select name={`f:${f.path}`} defaultValue={String(f.value ?? "")} className="input">
                      <option value="">—</option>
                      {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input name={`f:${f.path}`} type={f.kind === "number" ? "number" : "text"} step="any" defaultValue={String(f.value ?? "")} className="input" />
                  )}
                </label>
              ))}

              {collection === "cepas" && (
                <div className="border-2 border-ink p-3 space-y-2 bg-yellow/40">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-extrabold">
                      Nota de la redacción:{" "}
                      {record.editorialNote?.status ? STATUS_LABEL[record.editorialNote.status as RevisionStatus] : "sin nota"}
                      {record.editorialNote?.status === "aprobado" && " (pública)"}
                    </span>
                    <div className="flex gap-2">
                      <button name="intent" value="note-generate" disabled={busy} className="btn btn-ghost !py-1 !text-xs">
                        <Icon name="sparkle" size={13} /> {record.editorialNote?.text ? "Regenerar con IA" : "Generar con IA"}
                      </button>
                      {record.editorialNote?.text && (
                        <>
                          <button name="intent" value="note-approve" disabled={busy} className="btn btn-primary !py-1 !text-xs">Aprobar nota</button>
                          <button name="intent" value="note-reject" disabled={busy} className="btn btn-ghost !py-1 !text-xs">Rechazar nota</button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-semibold">Edita el texto en el campo "Nota de la redacción" de arriba. Solo se publica cuando la apruebas.</p>
                </div>
              )}

              <label className="block">
                <span className="label">Nota interna de revisión (opcional)</span>
                <input name="note" defaultValue={record.revision.note} className="input" placeholder="Ej. verificar THC con otra fuente" />
              </label>

              <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-ink">
                <button name="intent" value="save-approve" disabled={busy} className="btn btn-primary">
                  <Icon name="check" size={15} strokeWidth={3} /> Guardar y aprobar
                </button>
                <button name="intent" value="approve" disabled={busy} className="btn btn-ghost">Aprobar sin cambios</button>
                <button name="intent" value="save" disabled={busy} className="btn btn-ghost">Solo guardar</button>
                <button name="intent" value="reject" disabled={busy} className="btn btn-warm">Rechazar</button>
              </div>
            </Form>
          </section>
        ) : (
          <section className="card p-10 text-center font-semibold">No hay registros en esta vista.</section>
        )}
      </div>
    </div>
  );
}
