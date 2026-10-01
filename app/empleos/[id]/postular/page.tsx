"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, Loader2, Building2, MapPin, Briefcase, Check } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { Container, buttonClass } from "@/components/site/primitives";
import { BackLink, EmptyState, Field, FormSection, PageLoading, EMPLOYMENT_LABEL, labelFor, textareaClass } from "@/components/anuncios/market-ui";
import { cn } from "@/lib/utils";

export default function PostularPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" as any });

  useEffect(() => {
    fetch(`/api/jobs/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJob(data.data);
        } else {
          setToast({ visible: true, message: data.error || "Error al cargar la vacante", type: "error" });
        }
      })
      .catch(() => {
        setToast({ visible: true, message: "Error de conexión", type: "error" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare answers for the API
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const res = await fetch(`/api/jobs/${params.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetter,
          answers: formattedAnswers
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToast({ visible: true, message: "¡Postulación enviada con éxito!", type: "success" });
        setTimeout(() => router.push("/empleos"), 2000);
      } else {
        setToast({ visible: true, message: data.error || "Error al enviar", type: "error" });
      }
    } catch (err) {
      setToast({ visible: true, message: "Error de conexión", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoading label="Cargando la vacante…" />;
  }

  if (!job) {
    return (
      <div className="w-full bg-bg-primary px-4 pb-14 pt-28 md:pt-36">
        <Container width="narrow">
          <EmptyState
            icon={Briefcase}
            title="No pudimos cargar esta vacante"
            body="Puede que ya no esté disponible o que tengas que iniciar sesión para postularte."
            action={
              <Link href="/empleos" className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
                Ver vacantes abiertas
              </Link>
            }
          />
        </Container>
      </div>
    );
  }

  const company = job.company?.name || "la empresa";

  return (
    <div className="relative w-full bg-bg-primary pb-14 pt-24 md:pb-24 md:pt-32">
      <div className="mv-aura" aria-hidden />
      <Container width="narrow" className="relative">
        <BackLink href={`/empleos/${params.id}`}>Volver a la vacante</BackLink>

        <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          {job.company?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company.avatar} alt="" className="h-16 w-16 shrink-0 rounded-2xl border border-[var(--mv-hairline)] object-cover" />
          ) : (
            <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] font-display text-xl font-semibold text-[var(--text-secondary)]">
              {company.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <p className="mv-kicker">Postulación</p>
            <h1 className="mv-h2">{job.title}</h1>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]"><Building2 className="h-4 w-4 text-gold" aria-hidden /> {company}</span>
              {job.city ? <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gold" aria-hidden /> {job.city}</span> : null}
              {job.employmentType ? <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" aria-hidden /> {labelFor(EMPLOYMENT_LABEL, job.employmentType)}</span> : null}
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
          <FormSection
            id="apply-letter"
            step={1}
            title="Carta de presentación"
            description={`Contale a ${company} por qué sos una buena persona para este puesto: logros concretos y qué te motiva.`}
          >
            <Field label="Tu carta" htmlFor="apply-cover" required hint={`${coverLetter.length} caracteres. Con 3 o 4 párrafos cortos alcanza.`}>
              <textarea
                id="apply-cover"
                required
                rows={10}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Escribí acá tu carta de presentación…"
                aria-describedby="apply-cover-hint"
                className={cn(textareaClass, "min-h-[14rem]")}
              />
            </Field>
          </FormSection>

          {job.questions?.length > 0 && (
            <FormSection id="apply-questions" step={2} title="Preguntas de la empresa" description="Las marcadas con * son obligatorias.">
              {job.questions.map((q: any) => {
                const qid = `q-${q.id}`;
                return q.type === "TEXTO" ? (
                  <Field key={q.id} label={q.question} htmlFor={qid} required={q.isRequired}>
                    <input
                      id={qid}
                      required={q.isRequired}
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="mv-input"
                    />
                  </Field>
                ) : (
                  <div key={q.id} className="flex flex-col gap-2">
                    <p id={qid} className="text-sm font-semibold text-[var(--text-primary)]">
                      {q.question}
                      {q.isRequired ? <span className="ml-0.5 text-gold" aria-hidden>*</span> : null}
                    </p>
                    <div role="radiogroup" aria-labelledby={qid} aria-required={q.isRequired || undefined} className={q.type === "SI_NO" ? "grid grid-cols-2 gap-3" : "grid gap-3 sm:grid-cols-2"}>
                      {(q.type === "SI_NO" ? ["Sí", "No"] : q.options || []).map((opt: string) => {
                        const on = answers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                            className={cn(
                              "mv-focus flex min-h-[3rem] items-center justify-between gap-3 rounded-[0.875rem] border px-4 text-left text-sm font-medium transition-colors duration-200",
                              on
                                ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                                : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                            )}
                          >
                            {opt}
                            {on ? <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </FormSection>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link href={`/empleos/${params.id}`} className={buttonClass("ghost", "md", "w-full sm:w-auto")}>
              Cancelar
            </Link>
            <button type="submit" disabled={submitting} aria-busy={submitting} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {submitting ? "Enviando…" : "Enviar postulación"}
            </button>
          </div>
        </form>
      </Container>

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
}
// creado por pato dev y askforvini
