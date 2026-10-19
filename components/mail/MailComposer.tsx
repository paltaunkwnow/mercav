"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Send, X } from "@/components/icons";
import { fileSize, mailRequest, type MailAttachment, type MailMessage } from "./client";

export type ComposeIntent = { mode: "new" | "reply" | "draft"; message?: MailMessage };

function recipientList(value: string): string[] { return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean); }

export function MailComposer({ intent, onClose, onSaved }: { intent: ComposeIntent; onClose: () => void; onSaved: (notice: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const isDraft = intent.mode === "draft";
  const original = intent.message;
  const [to, setTo] = useState((intent.mode === "reply" ? original?.from : isDraft ? original?.to : [])?.map((item) => item.email).join(", ") ?? "");
  const [cc, setCc] = useState(isDraft ? original?.cc?.map((item) => item.email).join(", ") ?? "" : "");
  const [bcc, setBcc] = useState(isDraft ? original?.bcc?.map((item) => item.email).join(", ") ?? "" : "");
  const [subject, setSubject] = useState(intent.mode === "reply" ? (/^re:/i.test(original?.subject ?? "") ? original!.subject : `Re: ${original?.subject ?? ""}`) : isDraft ? original?.subject ?? "" : "");
  const [text, setText] = useState(isDraft ? original?.textBody ?? "" : "");
  const [attachments, setAttachments] = useState<MailAttachment[]>(isDraft ? original?.attachments ?? [] : []);
  const [extra, setExtra] = useState(Boolean(cc || bcc));
  const [busy, setBusy] = useState<"send" | "draft" | "upload" | null>(null);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const signatureLoaded = useRef(false);

  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => {
    if (isDraft || signatureLoaded.current) return;
    signatureLoaded.current = true;
    mailRequest<{ signature: string }>("/settings").then(({ signature }) => {
      if (signature) setText((current) => current ? current : `\n\n${signature}`);
    }).catch(() => { /* La redacción sigue disponible si no se puede obtener la firma. */ });
  }, [isDraft]);
  useEffect(() => {
    function preventLoss(event: BeforeUnloadEvent) { if (dirty) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [dirty]);

  function close() {
    if (busy) return;
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés descartar este mensaje?")) return;
    onClose();
  }

  async function save(draft: boolean) {
    setError("");
    const recipients = { to: recipientList(to), cc: recipientList(cc), bcc: recipientList(bcc) };
    if (!draft && !recipients.to.length) return setError("Agregá al menos un destinatario.");
    if (Object.values(recipients).flat().some((address) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))) return setError("Revisá las direcciones. Separá cada correo con una coma.");
    if (!draft && !subject.trim() && !window.confirm("El mensaje no tiene asunto. ¿Enviar igual?")) return;
    const external = Object.values(recipients).flat().some((address) => !address.toLowerCase().endsWith("@mercav.lat"));
    if (!draft && external && !window.confirm("Vas a enviar este mensaje fuera de Mercav. Revisá los destinatarios y adjuntos. ¿Continuar?")) return;
    setBusy(draft ? "draft" : "send");
    try {
      await mailRequest("/messages", { method: "POST", body: JSON.stringify({ ...recipients, subject, text, draft, attachments, confirmExternal: !draft && external, ...(isDraft && original ? { draftId: original.id } : {}) }) });
      setDirty(false); onSaved(draft ? "Borrador guardado en tu correo." : "Mensaje enviado."); onClose();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo guardar el mensaje."); }
    finally { setBusy(null); }
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy("upload"); setError("");
    try {
      const selectedFiles = Array.from(files);
      if (attachments.length + selectedFiles.length > 10) throw new Error("Podés agregar hasta 10 archivos por mensaje.");
      if (attachments.reduce((sum, attachment) => sum + attachment.size, 0) + selectedFiles.reduce((sum, file) => sum + file.size, 0) > 20 * 1024 * 1024) throw new Error("El total de adjuntos puede tener hasta 20 MB.");
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) throw new Error(`El archivo ${file.name} supera los 10 MB. Elegí uno más pequeño.`);
        const data = new FormData(); data.append("file", file);
        const attachment = await mailRequest<MailAttachment>("/attachments", { method: "POST", body: data });
        setAttachments((current) => [...current, attachment]); setDirty(true);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo adjuntar el archivo."); }
    finally { setBusy(null); if (fileInput.current) fileInput.current.value = ""; }
  }

  return <dialog ref={dialog} className="mail-compose" aria-labelledby="mail-compose-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    <div className="mail-compose-header"><h2 id="mail-compose-title">{intent.mode === "reply" ? "Responder mensaje" : isDraft ? "Continuar borrador" : "Nuevo mensaje"}</h2><button type="button" onClick={close} disabled={Boolean(busy)} aria-label="Cerrar redacción" className="mail-icon-button"><X aria-hidden /></button></div>
    <form onSubmit={(event) => { event.preventDefault(); void save(false); }} onChange={() => setDirty(true)}>
      <label className="mail-field" htmlFor="compose-to">Para<input autoFocus id="compose-to" className="mail-input" value={to} onChange={(event) => setTo(event.target.value)} placeholder="nombre@ejemplo.com" autoComplete="off" disabled={Boolean(busy)} /></label>
      <button className="mail-icon-button" type="button" onClick={() => setExtra(!extra)} aria-expanded={extra}>CC / CCO</button>
      {extra && <div className="mail-composer-extra"><label className="mail-field" htmlFor="compose-cc">Con copia<input id="compose-cc" className="mail-input" value={cc} onChange={(event) => setCc(event.target.value)} disabled={Boolean(busy)} /></label><label className="mail-field" htmlFor="compose-bcc">Con copia oculta<input id="compose-bcc" className="mail-input" value={bcc} onChange={(event) => setBcc(event.target.value)} disabled={Boolean(busy)} /></label></div>}
      <label className="mail-field" htmlFor="compose-subject">Asunto<input id="compose-subject" className="mail-input" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={500} disabled={Boolean(busy)} /></label>
      <label className="mail-field" htmlFor="compose-text"><span className="sr-only">Mensaje</span><textarea id="compose-text" className="mail-input" placeholder="Escribí tu mensaje…" value={text} onChange={(event) => setText(event.target.value)} maxLength={500000} disabled={Boolean(busy)} /></label>
      {attachments.length > 0 && <div className="mail-attachments">{attachments.map((attachment, index) => <div className="mail-attachment" key={`${attachment.blobId}-${index}`}><Paperclip aria-hidden /><span>{attachment.name}</span><small>{fileSize(attachment.size)}</small><button type="button" className="mail-icon-button" aria-label={`Quitar ${attachment.name}`} disabled={Boolean(busy)} onClick={() => { setAttachments((current) => current.filter((_, position) => position !== index)); setDirty(true); }}><X aria-hidden /></button></div>)}</div>}
      {error && <p className="mail-alert" role="alert">{error}</p>}
      <p className="mail-compose-note">Separá los destinatarios con comas. Adjuntos: hasta 10 MB por archivo y 20 MB en total. Guardá el borrador antes de salir.</p>
      <div className="mail-compose-footer"><input ref={fileInput} type="file" multiple className="sr-only" tabIndex={-1} aria-label="Seleccionar archivos adjuntos" onChange={(event) => void upload(event.target.files)} /><button type="button" className="mail-icon-button" disabled={Boolean(busy)} onClick={() => fileInput.current?.click()} aria-label="Adjuntar archivos">{busy === "upload" ? <Loader2 className="mail-spin" aria-hidden /> : <Paperclip aria-hidden />}</button><button type="button" className="mail-button" disabled={Boolean(busy)} onClick={() => void save(true)}><FileText aria-hidden />{busy === "draft" ? "Guardando…" : "Guardar borrador"}</button><button type="submit" className="mail-button mail-button-primary" disabled={Boolean(busy)}>{busy === "send" ? <Loader2 className="mail-spin" aria-hidden /> : <Send aria-hidden />}{busy === "send" ? "Enviando…" : "Enviar"}</button></div>
    </form>
  </dialog>;
}
