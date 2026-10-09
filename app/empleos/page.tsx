"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase, ArrowRight, EyeOff, ListChecks, FileText, X } from "@/components/icons";
import { Container, PageHero, ButtonLink, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { CardSkeletonGrid, EmptyState, EMPLOYMENT_LABEL, WORK_MODE_LABEL, labelFor } from "@/components/anuncios/market-ui";

const normalizeStr = (str: string) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const LATAM_LOCATIONS: Record<string, string[]> = {
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta"],
  "Bolivia": ["La Paz", "Santa Cruz de la Sierra", "Cochabamba", "Sucre", "Oruro", "Tarija", "Potosí", "El Alto"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "Viña del Mar", "Antofagasta", "Temuco", "La Serena", "Rancagua"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta", "Manizales"],
  "Costa Rica": ["San José", "Alajuela", "Cartago", "Heredia", "Puntarenas", "Limón"],
  "Ecuador": ["Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala", "Manta", "Portoviejo", "Loja"],
  "El Salvador": ["San Salvador", "Santa Ana", "San Miguel", "Soyapango", "Santa Tecla"],
  "Guatemala": ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla"],
  "Honduras": ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso"],
  "México": ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "Querétaro", "Mérida", "Cancún", "León", "San Luis Potosí"],
  "Nicaragua": ["Managua", "León", "Masaya", "Granada", "Chinandega", "Estelí"],
  "Panamá": ["Ciudad de Panamá", "Colón", "David", "Santiago", "La Chorrera"],
  "Paraguay": ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Lambaré", "Capiatá"],
  "Perú": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Huancayo", "Iquitos"],
  "República Dominicana": ["Santo Domingo", "Santiago de los Caballeros", "La Romana", "Punta Cana", "Puerto Plata", "San Pedro de Macorís", "San Francisco de Macorís"],
  "Uruguay": ["Montevideo", "Salto", "Paysandú", "Maldonado", "Las Piedras", "Rivera"],
  "Venezuela": ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "San Cristóbal", "Barcelona"]
};

const HOW = [
  { icon: EyeOff, title: "Salario visible u oculto", body: "Cada empresa decide si publica el rango salarial." },
  { icon: ListChecks, title: "Preguntas de filtro", body: "Algunas vacantes suman preguntas cortas para postular." },
  { icon: FileText, title: "Postulación en un paso", body: "Carta de presentación y respuestas desde tu cuenta." },
];

function salaryText(job: any) {
  if (!job.salaryVisible || (job.salaryMin == null && job.salaryMax == null)) return null;
  const cur = (job.salaryCurrency || "USD").toUpperCase();
  const sym = cur === "USD" ? "US$" : cur;
  const f = (n: number) => Number(n).toLocaleString("es");
  if (job.salaryMin != null && job.salaryMax != null) return `${sym} ${f(job.salaryMin)} – ${f(job.salaryMax)}`;
  return `${sym} ${f(job.salaryMin ?? job.salaryMax)}`;
}

export default function EmpleosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Applied filters states (triggered only on clicking search/filtering)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedCountry, setAppliedCountry] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJobs(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const uniqueCountries = useMemo(() => {
    const predefined = Object.keys(LATAM_LOCATIONS);
    const fromDb = jobs.map(job => job.country).filter(Boolean);
    const merged = new Set<string>(predefined);
    fromDb.forEach(c => {
      const exists = predefined.some(p => normalizeStr(p) === normalizeStr(c));
      if (!exists) {
        merged.add(c);
      }
    });
    return Array.from(merged).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [jobs]);

  const uniqueCities = useMemo(() => {
    if (!selectedCountry) return [];
    
    const matchedKey = Object.keys(LATAM_LOCATIONS).find(
      key => normalizeStr(key) === normalizeStr(selectedCountry)
    );
    const predefined = matchedKey ? LATAM_LOCATIONS[matchedKey] : [];
    
    const fromDb = jobs
      .filter(job => normalizeStr(job.country) === normalizeStr(selectedCountry))
      .map(job => job.city)
      .filter(Boolean);
      
    const merged = new Set<string>(predefined);
    fromDb.forEach(c => {
      const exists = predefined.some(p => normalizeStr(p) === normalizeStr(c));
      if (!exists) {
        merged.add(c);
      }
    });
    
    return Array.from(merged).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [jobs, selectedCountry]);

  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery);
    setAppliedCountry(selectedCountry);
    setAppliedCity(selectedCity);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !appliedSearchQuery || 
                            job.title.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
                            job.company?.name?.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
                            job.description?.toLowerCase().includes(appliedSearchQuery.toLowerCase());
      const matchesCountry = !appliedCountry || normalizeStr(job.country) === normalizeStr(appliedCountry);
      const matchesCity = !appliedCity || normalizeStr(job.city) === normalizeStr(appliedCity);
      return matchesSearch && matchesCountry && matchesCity;
    });
  }, [jobs, appliedSearchQuery, appliedCountry, appliedCity]);

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCountry("");
    setSelectedCity("");
    setAppliedSearchQuery("");
    setAppliedCountry("");
    setAppliedCity("");
  };

  const hasFilters = !!appliedSearchQuery || !!appliedCountry || !!appliedCity;
  const count = filteredJobs.length;

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Empleos"
        title={
          <>
            Vacantes claras, <span className="mv-gold-text">postulación directa.</span>
          </>
        }
        lead="Empresas de Latinoamérica publican sus puestos con modalidad, nivel y, cuando lo deciden, el rango salarial. Postulá con tu perfil de Mercav."
        actions={
          <>
            <ButtonLink href="/empleos/publicar" size="lg" className="w-full sm:w-auto">
              Publicar una vacante
            </ButtonLink>
            <ButtonLink href="/empleos/mis-empleos" tone="secondary" size="lg" className="w-full sm:w-auto">
              Mis vacantes
            </ButtonLink>
          </>
        }
        aside={
          <ul className="mv-panel flex flex-col gap-5 p-6 md:p-7" aria-label="Cómo funciona">
            {HOW.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-gold">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        }
      />

      <section aria-labelledby="jobs-results" className="pb-14 md:pb-24">
        <Container>
          <form
            role="search"
            aria-label="Buscar vacantes"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="mv-menu relative z-30 grid gap-1 rounded-[1.5rem] p-2 md:sticky md:top-[5.5rem] md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:rounded-full"
          >
            <label className="flex h-12 min-w-0 items-center gap-3 rounded-full px-4 focus-within:bg-[var(--mv-panel-hover)]">
              <Search className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span className="sr-only">Cargo, habilidad o empresa</span>
              <input
                type="search"
                placeholder="Cargo, habilidad o empresa…"
                className="h-full w-full min-w-0 bg-transparent text-[0.9375rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                enterKeyHint="search"
              />
            </label>
            <div className="grid grid-cols-2 gap-1 md:contents">
              <ChoiceMenu
                label="País"
                hideLabel
                variant="bare"
                icon={MapPin}
                value={selectedCountry}
                allLabel="Todos los países"
                options={uniqueCountries}
                onChange={(v) => {
                  setSelectedCountry(v);
                  setSelectedCity("");
                }}
              />
              <ChoiceMenu
                label="Ciudad"
                hideLabel
                variant="bare"
                icon={MapPin}
                value={selectedCity}
                allLabel="Todas las ciudades"
                options={[...uniqueCities, "Remoto"]}
                disabled={!selectedCountry}
                disabledText="Elegí un país"
                onChange={setSelectedCity}
              />
            </div>
            <button type="submit" className={buttonClass("primary", "md", "w-full md:w-auto")}>
              Buscar
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 id="jobs-results" className="text-sm text-[var(--text-secondary)]" aria-live="polite">
              {loading ? (
                "Buscando vacantes…"
              ) : (
                <>
                  <span className="mv-data font-semibold text-[var(--text-primary)]">{count}</span>{" "}
                  {count === 1 ? "vacante abierta" : "vacantes abiertas"}
                </>
              )}
            </h2>
            {hasFilters ? (
              <button type="button" onClick={clearSearch} className={buttonClass("ghost", "sm")}>
                <X className="h-4 w-4" aria-hidden />
                Limpiar búsqueda
              </button>
            ) : null}
          </div>

          <div className="mt-6">
            {loading ? (
              <CardSkeletonGrid count={4} variant="row" />
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Todavía no hay vacantes publicadas"
                body="Si estás contratando, publicá la primera: definís modalidad, nivel y si mostrás el salario, y recibís las postulaciones en tu cuenta."
                action={
                  <ButtonLink href="/empleos/publicar" className="w-full sm:w-auto">
                    Publicar la primera vacante
                  </ButtonLink>
                }
                secondary={
                  <ButtonLink href="/servicios" tone="ghost" className="w-full sm:w-auto">
                    Ver Services
                  </ButtonLink>
                }
              />
            ) : count === 0 ? (
              <EmptyState
                icon={Search}
                title="Ninguna vacante coincide con tu búsqueda"
                body="Probá con otro cargo, otra ciudad o elegí Remoto."
                action={
                  <button type="button" onClick={clearSearch} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
                    Ver todas las vacantes
                  </button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {filteredJobs.map((job) => {
                  const salary = salaryText(job);
                  const company = job.company?.name || "Empresa confidencial";
                  return (
                    <li
                      key={job.id}
                      className="mv-panel mv-panel-interactive group relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 md:p-6"
                    >
                      {job.company?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={job.company.avatar} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-2xl border border-[var(--mv-hairline)] object-cover" />
                      ) : (
                        <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] font-display text-lg font-semibold text-[var(--text-secondary)]">
                          {company.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)] md:text-xl">
                          <Link href={`/empleos/${job.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                            {job.title}
                          </Link>
                        </h3>
                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">{company}</span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
                            {[job.city, job.country].filter(Boolean).join(", ")}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.employmentType ? <span className="mv-chip">{labelFor(EMPLOYMENT_LABEL, job.employmentType)}</span> : null}
                          {job.workMode ? <span className="mv-chip">{labelFor(WORK_MODE_LABEL, job.workMode)}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-[var(--mv-hairline)] pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                        <span className={salary ? "mv-data text-sm font-semibold text-[var(--text-primary)]" : "text-sm text-[var(--text-tertiary)]"}>
                          {salary ?? "Salario a convenir"}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-gold">
                          Ver vacante
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
// Sistema Mercav Empleos - creado por pato dev y askforvini
