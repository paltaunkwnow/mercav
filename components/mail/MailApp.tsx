"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, ArrowLeft, Download, Edit3, FileText, Inbox, Loader2, LogOut, Mail, Menu, Paperclip, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, X } from "@/components/icons";
import { addressLabel, fileSize, mailboxLabel, mailRequest, MailRequestError, type Mailbox, type MailMessage, type MailMessageSummary, type MailUser } from "./client";
import { MailBrand, MailLogin } from "./MailLogin";
import { MailComposer, type ComposeIntent } from "./MailComposer";
import { SplashScreen } from "@/components/splash/SplashScreen";

function dateLabel(value: string, full = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-BO", full ? { dateStyle: "medium", timeStyle: "short" } : { month: "short", day: "numeric" }).format(date);
}

function FolderIcon({ role }: { role: string | null }) {
  const Icon = ({ inbox: Inbox, sent: Send, drafts: FileText, trash: Trash2, junk: ShieldCheck, archive: Archive } as Record<string, typeof Inbox>)[role ?? ""] ?? Archive;
  return <Icon aria-hidden />;
}

export function MailApp() {
  const [user, setUser] = useState<MailUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [mailboxId, setMailboxId] = useState("");
  const [messages, setMessages] = useState<MailMessageSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [compose, setCompose] = useState<ComposeIntent | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [settings, setSettings] = useState(false);
  const [signature, setSignature] = useState("");
  const selectionVersion = useRef(0);
  const listVersion = useRef(0);
  const currentMailbox = mailboxes.find((item) => item.id === mailboxId);
  const title = query ? "Resultados de búsqueda" : currentMailbox ? mailboxLabel(currentMailbox) : "Tu correo";

  const fail = useCallback((failure: unknown) => {
    if (failure instanceof DOMException && failure.name === "AbortError") return;
    if (failure instanceof MailRequestError && failure.status === 401) {
      setUser(null); setMessages([]); setSelected(null); setMailboxes([]); setCompose(null);
      setSessionError("Tu sesión terminó. Ingresá de nuevo para continuar.");
    } else setError(failure instanceof Error ? failure.message : "No pudimos completar la solicitud.");
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const session = await mailRequest<{ user: MailUser }>("/session");
      setUser(session.user); setSessionError("");
    } catch (failure) {
      setUser(null);
      if (!(failure instanceof MailRequestError && failure.status === 401)) setSessionError(failure instanceof Error ? failure.message : "No pudimos conectar con el correo.");
    } finally { setChecking(false); }
  }, []);

  useEffect(() => { void loadSession(); }, [loadSession]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    mailRequest<{ mailboxes: Mailbox[] }>("/mailboxes", { signal: controller.signal }).then((data) => {
      const order = ["inbox", "sent", "drafts", "archive", "junk", "trash"];
      setMailboxes([...data.mailboxes].sort((a, b) => { const rank = (role: string | null) => order.includes(role ?? "") ? order.indexOf(role!) : 99; return rank(a.role) - rank(b.role); }));
      setMailboxId((current) => data.mailboxes.some((item) => item.id === current) ? current : (data.mailboxes.find((item) => item.role === "inbox") ?? data.mailboxes[0])?.id ?? "");
    }).catch(fail);
    return () => controller.abort();
  }, [user, refresh, fail]);

  useEffect(() => {
    if (!user || !mailboxId) return;
    const controller = new AbortController();
    const version = ++listVersion.current;
    setLoadingList(true); setError(""); setMessages([]); setHasMore(false);
    const params = new URLSearchParams({ mailboxId, q: query, position: "0" });
    mailRequest<{ messages: MailMessageSummary[]; hasMore: boolean }>(`/messages?${params}`, { signal: controller.signal }).then((data) => {
      if (version === listVersion.current) { setMessages(data.messages); setHasMore(data.hasMore); }
    }).catch(fail).finally(() => { if (version === listVersion.current) setLoadingList(false); });
    return () => controller.abort();
  }, [user, mailboxId, query, refresh, fail]);

  async function openMessage(message: MailMessageSummary) {
    const version = ++selectionVersion.current;
    setSelectedId(message.id); setSelected(null); setLoadingMessage(true); setError("");
    try {
      const data = await mailRequest<{ message: MailMessage }>(`/messages/${encodeURIComponent(message.id)}`);
      if (version !== selectionVersion.current) return;
      setSelected(data.message);
      if (!message.keywords?.["$seen"]) {
        await mailRequest(`/messages/${encodeURIComponent(message.id)}`, { method: "PATCH", body: JSON.stringify({ action: "read" }) });
        setMessages((current) => current.map((item) => item.id === message.id ? { ...item, keywords: { ...item.keywords, "$seen": true } } : item));
        setMailboxes((current) => current.map((item) => item.id === mailboxId ? { ...item, unreadEmails: Math.max(0, item.unreadEmails - 1) } : item));
      }
    } catch (failure) { if (version === selectionVersion.current) fail(failure); }
    finally { if (version === selectionVersion.current) setLoadingMessage(false); }
  }

  async function loadMore() {
    const version = listVersion.current;
    setBusy(true);
    try {
      const params = new URLSearchParams({ mailboxId, q: query, position: String(messages.length) });
      const data = await mailRequest<{ messages: MailMessageSummary[]; hasMore: boolean }>(`/messages?${params}`);
      if (version === listVersion.current) { setMessages((current) => [...current, ...data.messages.filter((item) => !current.some((old) => old.id === item.id))]); setHasMore(data.hasMore); }
    } catch (failure) { fail(failure); }
    finally { setBusy(false); }
  }

  function clearSelection() { selectionVersion.current++; setSelected(null); setSelectedId(""); setLoadingMessage(false); }

  async function action(value: "star" | "unstar" | "unread" | "move", destination?: string) {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      await mailRequest(`/messages/${encodeURIComponent(selected.id)}`, { method: "PATCH", body: JSON.stringify({ action: value, ...(destination ? { mailboxId: destination } : {}) }) });
      if (value === "star" || value === "unstar") setSelected((current) => current ? { ...current, keywords: { ...current.keywords, "$flagged": value === "star" } } : null);
      else clearSelection();
      setRefresh((value) => value + 1);
    } catch (failure) { fail(failure); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try { await mailRequest("/logout", { method: "POST", body: "{}" }); setUser(null); setMessages([]); clearSelection(); setMailboxes([]); setCompose(null); setSettings(false); }
    catch (failure) { fail(failure); }
    finally { setBusy(false); }
  }

  async function openSettings() {
    setError(""); setBusy(true);
    try { const data = await mailRequest<{ signature: string }>("/settings"); setSignature(data.signature); setSettings(true); }
    catch (failure) { fail(failure); }
    finally { setBusy(false); }
  }

  if (checking) return <SplashScreen variant="mail" fullscreen />;
  if (!user) return <MailLogin onLogin={loadSession} serviceError={sessionError} />;

  return <div className={`mail-workspace${menu ? " menu-open" : ""}`}>
    <button type="button" className="mail-menu-backdrop" aria-label="Cerrar menú" onClick={() => setMenu(false)} />
    <aside className="mail-sidebar" aria-label="Carpetas y cuenta"><MailBrand /><button className="mail-button mail-button-primary mail-compose-launch" onClick={() => { setCompose({ mode: "new" }); setMenu(false); }}><Edit3 aria-hidden /> Redactar mensaje</button>
      <div className="mail-sidebar-section-label">TU ESPACIO</div>
      <nav aria-label="Carpetas de correo">{mailboxes.map((mailbox) => <button key={mailbox.id} className="mail-folder" aria-current={mailbox.id === mailboxId ? "page" : undefined} onClick={() => { clearSelection(); setMailboxId(mailbox.id); setQuery(""); setQueryInput(""); setMenu(false); }}><FolderIcon role={mailbox.role} /><span>{mailboxLabel(mailbox)}</span>{mailbox.unreadEmails > 0 && <span className="mail-folder-count" aria-label={`${mailbox.unreadEmails} sin leer`}>{mailbox.unreadEmails}</span>}</button>)}</nav>
      <div className="mail-sidebar-bottom"><div className="mail-account"><span className="mail-account-avatar" aria-hidden>{(user.name || user.email).slice(0, 1).toUpperCase()}</span><div className="mail-account-copy"><p className="mail-user">{user.name || "Equipo Mercav"}</p><p className="mail-user-email" title={user.email}>{user.email}</p></div></div><button className="mail-folder" onClick={() => void openSettings()} disabled={busy}><Edit3 aria-hidden /><span>Mi firma</span></button><button className="mail-folder" onClick={() => void logout()} disabled={busy}><LogOut aria-hidden /><span>Cerrar sesión</span></button></div>
    </aside>
    <section className="mail-main" aria-label="Correo"><header className="mail-topbar"><button className="mail-icon-button mail-menu-button" onClick={() => setMenu(!menu)} aria-label="Abrir carpetas" aria-expanded={menu}><Menu aria-hidden /></button><div className="mail-page-title"><span>{query ? "BÚSQUEDA" : "BUZÓN DE CORREO"}</span><h1>{title}</h1></div><form role="search" onSubmit={(event) => { event.preventDefault(); clearSelection(); setQuery(queryInput.trim()); }}><Search aria-hidden /><label htmlFor="mail-search" className="sr-only">Buscar en esta carpeta</label><input className="mail-input" id="mail-search" placeholder="Buscar mensajes" value={queryInput} maxLength={200} onChange={(event) => setQueryInput(event.target.value)} type="search" /></form><button className="mail-icon-button mail-refresh-button" aria-label="Actualizar correo" disabled={loadingList} onClick={() => setRefresh((value) => value + 1)}><RefreshCw className={loadingList ? "mail-spin" : ""} aria-hidden /></button></header>
      <div className="mail-banner">{error && <p className="mail-alert" role="alert">{error}</p>}{notice && <p className="mail-status" role="status">{notice}<button className="mail-icon-button" aria-label="Cerrar aviso" onClick={() => setNotice("")}><X aria-hidden /></button></p>}</div>
      <div className={`mail-body${selectedId ? " has-selection" : ""}`}>
        <section className="mail-list" aria-label={title} aria-busy={loadingList}><div className="mail-list-heading"><div><strong>{title}</strong><span>{messages.length}{hasMore ? "+" : ""} {messages.length === 1 ? "mensaje" : "mensajes"}</span></div><span className="mail-list-indicator"><span /> Actualizado</span></div>
          {loadingList ? <div className="mail-empty" role="status"><Loader2 className="mail-spin" aria-hidden /><p>Buscando tus mensajes…</p></div> : messages.length === 0 ? <div className="mail-empty"><Inbox aria-hidden /><h2>{query ? "No encontramos mensajes" : "Todo al día"}</h2><p>{query ? "Probá con otro nombre, asunto o palabra." : "Los mensajes de esta carpeta van a aparecer acá."}</p>{query && <button className="mail-button" onClick={() => { setQuery(""); setQueryInput(""); }}>Limpiar búsqueda</button>}</div> : messages.map((message) => { const sender = addressLabel(currentMailbox?.role === "sent" || currentMailbox?.role === "drafts" ? message.to : message.from); return <button className={`mail-message-item${!message.keywords?.["$seen"] ? " unread" : ""}`} key={message.id} onClick={() => void openMessage(message)} aria-current={selectedId === message.id ? "true" : undefined}><span className="mail-message-avatar" aria-hidden>{sender.trim().slice(0, 1).toUpperCase()}</span><div className="mail-message-copy"><div className="mail-message-meta"><span>{sender}</span><time dateTime={message.receivedAt}>{dateLabel(message.receivedAt)}</time></div><div className="mail-message-subject">{message.keywords?.["$flagged"] ? <Star aria-hidden /> : null}{message.subject || "(Sin asunto)"}</div><p className="mail-message-preview">{message.hasAttachment ? "📎 " : ""}{message.preview || "Sin vista previa"}</p></div></button>; })}
          {hasMore && <div style={{ padding: 18 }}><button className="mail-button" disabled={busy} onClick={() => void loadMore()}>{busy ? "Cargando…" : "Cargar más mensajes"}</button></div>}
        </section>
        <section className="mail-reader" aria-label="Lectura de mensaje" aria-busy={loadingMessage}>
          {selectedId && <div className="mail-reader-toolbar"><button className="mail-icon-button mail-mobile-only" onClick={clearSelection} aria-label="Volver a los mensajes"><ArrowLeft aria-hidden /></button>{selected && <><button className="mail-icon-button" aria-label={selected.keywords?.["$flagged"] ? "Quitar destacado" : "Destacar mensaje"} aria-pressed={Boolean(selected.keywords?.["$flagged"])} disabled={busy} onClick={() => void action(selected.keywords?.["$flagged"] ? "unstar" : "star")}><Star aria-hidden style={{ color: selected.keywords?.["$flagged"] ? "var(--mail-accent)" : undefined }} /></button><button className="mail-icon-button" aria-label="Marcar como no leído" disabled={busy} onClick={() => void action("unread")}><Mail aria-hidden /></button>{["archive", "trash"].map((role) => { const destination = mailboxes.find((item) => item.role === role); return destination && destination.id !== mailboxId ? <button key={role} className="mail-icon-button" aria-label={role === "trash" ? "Mover a la papelera" : "Archivar mensaje"} disabled={busy} onClick={() => void action("move", destination.id)}>{role === "trash" ? <Trash2 aria-hidden /> : <Archive aria-hidden />}</button> : null; })}</>}</div>}
          {loadingMessage ? <div className="mail-empty" role="status"><Loader2 className="mail-spin" aria-hidden /><p>Abriendo mensaje…</p></div> : selected ? <article className="mail-reader-content"><div className="mail-reader-kicker">MENSAJE</div><h2>{selected.subject || "(Sin asunto)"}</h2><div className="mail-sender"><span className="mail-avatar" aria-hidden>{addressLabel(selected.from).slice(0, 1).toUpperCase()}</span><div><strong>{addressLabel(selected.from)}</strong><p>{selected.from?.map((item) => item.email).join(", ")}</p><p>Para: {selected.to?.map((item) => item.email).join(", ") || "—"}</p>{Boolean(selected.cc?.length) && <p>CC: {selected.cc!.map((item) => item.email).join(", ")}</p>}</div><time dateTime={selected.receivedAt}>{dateLabel(selected.receivedAt, true)}</time></div>{selected.from?.some((item) => !item.email.toLowerCase().endsWith("@mercav.lat")) && <div className="mail-external"><ShieldCheck aria-hidden /> Remitente externo · verificá antes de compartir información</div>}<div className="mail-message-text">{selected.textBody || "Este mensaje no tiene una versión de texto disponible."}</div>{Boolean(selected.attachments?.length) && <div className="mail-attachments">{selected.attachments.map((attachment) => <a key={attachment.blobId} className="mail-attachment" href={`/api/mail/attachments?${new URLSearchParams({ messageId: selected.id, blobId: attachment.blobId })}`} download rel="noreferrer"><Paperclip aria-hidden /><span>{attachment.name}</span><small>{fileSize(attachment.size)}</small><Download aria-hidden /></a>)}</div>}<p className="mail-muted" style={{ marginBottom: 24 }}>Vista de texto: no se cargan imágenes ni contenido remoto del remitente.</p><button className="mail-button" onClick={() => setCompose({ mode: currentMailbox?.role === "drafts" ? "draft" : "reply", message: selected })}><Edit3 aria-hidden />{currentMailbox?.role === "drafts" ? "Continuar borrador" : "Responder"}</button></article> : <div className="mail-reader-welcome"><div className="mail-reader-art"><span className="mail-reader-art-orbit" aria-hidden /><img src="/mervi/pentester.png" alt="Mervi listo para ayudarte con tu correo" /></div><span className="mail-reader-kicker">TU ESPACIO DE TRABAJO</span><h2>Todo en orden.<br />Todo en equipo.</h2><p>Seleccioná un mensaje para leerlo o redactá uno nuevo cuando estés listo.</p><button className="mail-button mail-button-primary" onClick={() => setCompose({ mode: "new" })}><Edit3 aria-hidden /> Redactar un mensaje</button></div>}
        </section>
      </div>
    </section>
    {compose && <MailComposer intent={compose} onClose={() => setCompose(null)} onSaved={(message) => { setNotice(message); clearSelection(); setRefresh((value) => value + 1); }} />}
    {settings && <SignatureDialog signature={signature} onClose={() => setSettings(false)} onSave={(value) => { setSignature(value); setNotice("Firma guardada. Se agregará a los nuevos mensajes."); setSettings(false); }} />}
  </div>;
}

function SignatureDialog({ signature, onClose, onSave }: { signature: string; onClose: () => void; onSave: (value: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(signature);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); try { await mailRequest("/settings", { method: "PATCH", body: JSON.stringify({ signature: value }) }); onSave(value); } catch (failure) { setError(failure instanceof Error ? failure.message : "No pudimos guardar la firma."); } finally { setBusy(false); } }
  return <dialog ref={dialog} className="mail-compose" aria-labelledby="signature-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}><div className="mail-compose-header"><h2 id="signature-title">Tu firma de correo</h2><button className="mail-icon-button" onClick={onClose} disabled={busy} aria-label="Cerrar firma"><X aria-hidden /></button></div><form onSubmit={save}><label className="mail-field" htmlFor="mail-signature">Nombre, cargo y datos de contacto<textarea id="mail-signature" className="mail-input" autoFocus value={value} onChange={(event) => setValue(event.target.value)} maxLength={2000} disabled={busy} placeholder={"Tu nombre\nEquipo Mercav\nmercav.lat"} /></label><p className="mail-compose-note">Se añade al final de los mensajes que envíes. Usá texto simple para que se vea bien en cualquier correo.</p>{error && <p role="alert" className="mail-alert">{error}</p>}<div className="mail-compose-footer"><button className="mail-button mail-button-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar firma"}</button></div></form></dialog>;
}
