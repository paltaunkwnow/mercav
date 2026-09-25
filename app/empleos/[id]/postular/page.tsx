"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  Building, 
  MapPin, 
  Briefcase 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

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
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-gold animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Cargando vacante...</p>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href={`/empleos/${params.id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 text-xs font-bold uppercase tracking-widest group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al detalle
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-white/5">
              <img src={job.company?.avatar || `https://ui-avatars.com/api/?name=${job.company?.name || 'C'}`} className="w-full h-full object-cover" alt="Company" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Postular a {job.title}</h1>
              <div className="flex gap-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-gold"><Building size={14} /> {job.company?.name}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.city}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job.employmentType}</span>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="p-8 rounded-[2.5rem] bg-bg-secondary border border-white/5 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="h-5 w-5 text-gold" /> Carta de Presentación
            </h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Contale a {job.company?.name} por qué sos el candidato ideal para este puesto. Destacá tus logros y motivación.
            </p>
            <textarea
              required
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Escribí aquí tu carta de presentación..."
              className="w-full rounded-2xl border border-white/5 bg-bg-primary p-6 text-white outline-none focus:border-gold/30 transition-all min-h-[250px] resize-none"
            />
          </section>

          {job.questions?.length > 0 && (
            <section className="p-8 rounded-[2.5rem] bg-bg-secondary border border-white/5 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Preguntas Adicionales</h3>
              <div className="space-y-8">
                {job.questions.map((q: any) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-gray-300 mb-4">{q.question}{q.isRequired && '*'}</label>
                    {q.type === "TEXTO" ? (
                      <input
                        required={q.isRequired}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-full rounded-xl border border-white/5 bg-bg-primary px-5 py-4 text-white outline-none focus:border-gold/30 transition-all"
                      />
                    ) : q.type === "SI_NO" ? (
                      <div className="flex gap-4">
                        {["Sí", "No"].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                            className={`flex-1 py-4 rounded-xl border font-bold uppercase tracking-widest text-xs transition-all ${
                              answers[q.id] === opt ? "bg-gold border-gold text-black" : "bg-bg-primary border-white/5 text-gray-500 hover:border-gray-700"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options?.map((opt: string) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                            className={`px-5 py-4 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between ${
                              answers[q.id] === opt ? "bg-gold/10 border-gold text-gold" : "bg-bg-primary border-white/5 text-gray-500 hover:border-gray-700"
                            }`}
                          >
                            {opt}
                            {answers[q.id] === opt && <CheckCircle2 size={16} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-end gap-4 pt-8">
            <Button asChild variant="ghost" className="text-gray-500 hover:text-white uppercase tracking-widest font-black text-xs">
              <Link href={`/empleos/${params.id}`}>Cancelar</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-gold text-black hover:bg-gold-light rounded-2xl h-16 px-12 font-black uppercase tracking-widest shadow-xl shadow-gold/10 transition-all hover:scale-[1.02]"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
              Enviar Postulación
            </Button>
          </div>
        </form>

        <Toast 
          isVisible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, visible: false })} 
        />
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
