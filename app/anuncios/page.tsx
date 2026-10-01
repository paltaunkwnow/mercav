"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Lightbulb, Megaphone, CalendarRange, CreditCard, BadgePercent, SlidersHorizontal, X, Eye } from "lucide-react";
import { Container, PageHero, ButtonLink, buttonClass } from "@/components/site/primitives";
import { ChoiceMenu } from "@/components/anuncios/ChoiceMenu";
import { CardSkeletonGrid, EmptyState, MediaFrame, SPACE_TYPE_LABEL, formatMoney, labelFor } from "@/components/anuncios/market-ui";
import { cn } from "@/lib/utils";

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

const CATEGORIES = [
  { value: "VALLA", label: "Valla" },
  { value: "PANTALLA", label: "Pantalla digital" },
  { value: "LETRERO", label: "Letrero" },
  { value: "VIDRIERA", label: "Vidriera / local" },
  { value: "AUTO", label: "Transporte" },
];

const SORTS = [
  { value: "Recomendados", label: "Recomendados" },
  { value: "Precio: Menor a Mayor", label: "Precio: menor a mayor" },
  { value: "Precio: Mayor a Menor", label: "Precio: mayor a menor" },
  { value: "Más Vistos", label: "Más tránsito estimado" },
];

const HOW = [
  { icon: Search, title: "Elegí el espacio", body: "Filtrá por ciudad, tipo de soporte y presupuesto." },
  { icon: CalendarRange, title: "Reservá fechas libres", body: "Cada espacio muestra su calendario de ocupación." },
  { icon: CreditCard, title: "Pagá con Stripe", body: "Tu primer alquiler no paga comisión de plataforma." },
];

export default function AnunciosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Applied filters states (triggered only on clicking search/filtering)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedCountry, setAppliedCountry] = useState("");
  const [appliedCity, setAppliedCity] = useState("");

  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState("Recomendados");

  useEffect(() => {
    fetch('/api/spaces')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSpaces(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const uniqueCountries = useMemo(() => {
    const predefined = Object.keys(LATAM_LOCATIONS);
    const fromDb = spaces.map(space => space.country).filter(Boolean);
    const merged = new Set<string>(predefined);
    fromDb.forEach(c => {
      const exists = predefined.some(p => normalizeStr(p) === normalizeStr(c));
      if (!exists) {
        merged.add(c);
      }
    });
    return Array.from(merged).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [spaces]);

  const uniqueCities = useMemo(() => {
    if (!selectedCountry) return [];
    
    const matchedKey = Object.keys(LATAM_LOCATIONS).find(
      key => normalizeStr(key) === normalizeStr(selectedCountry)
    );
    const predefined = matchedKey ? LATAM_LOCATIONS[matchedKey] : [];
    
    const fromDb = spaces
      .filter(space => normalizeStr(space.country) === normalizeStr(selectedCountry))
      .map(space => space.city)
      .filter(Boolean);
      
    const merged = new Set<string>(predefined);
    fromDb.forEach(c => {
      const exists = predefined.some(p => normalizeStr(p) === normalizeStr(c));
      if (!exists) {
        merged.add(c);
      }
    });
    
    return Array.from(merged).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [spaces, selectedCountry]);

  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery);
    setAppliedCountry(selectedCountry);
    setAppliedCity(selectedCity);
  };

  const filteredAndSortedSpaces = useMemo(() => {
    let result = spaces.filter(space => {
      const matchesSearch = !appliedSearchQuery ||
                           space.title.toLowerCase().includes(appliedSearchQuery.toLowerCase()) || 
                           space.description?.toLowerCase().includes(appliedSearchQuery.toLowerCase());
      const matchesCountry = !appliedCountry || normalizeStr(space.country) === normalizeStr(appliedCountry);
      const matchesCity = !appliedCity || normalizeStr(space.city) === normalizeStr(appliedCity);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(space.type);
      
      const price = parseFloat(space.pricePerMonth || 0);
      const matchesMinPrice = minPrice === "" || price >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === "" || price <= parseFloat(maxPrice);

      return matchesSearch && matchesCountry && matchesCity && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });

    // Sorting Logic
    if (sortBy === "Precio: Menor a Mayor") {
      result.sort((a, b) => parseFloat(a.pricePerMonth) - parseFloat(b.pricePerMonth));
    } else if (sortBy === "Precio: Mayor a Menor") {
      result.sort((a, b) => parseFloat(b.pricePerMonth) - parseFloat(a.pricePerMonth));
    } else if (sortBy === "Más Vistos") {
      result.sort((a, b) => (b.trafficEstimate || 0) - (a.trafficEstimate || 0));
    }

    return result;
  }, [spaces, appliedSearchQuery, appliedCountry, appliedCity, selectedCategories, minPrice, maxPrice, sortBy]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
    setSelectedCountry("");
    setSelectedCity("");
    setAppliedSearchQuery("");
    setAppliedCountry("");
    setAppliedCity("");
  };

  const hasFilters =
    selectedCategories.length > 0 || !!minPrice || !!maxPrice || !!appliedSearchQuery || !!appliedCountry || !!appliedCity;
  const count = filteredAndSortedSpaces.length;

  return (
    <div className="w-full bg-bg-primary">
      <PageHero
        kicker="Mercav Ads"
        title={
          <>
            Publicidad física, <span className="mv-gold-text">con fechas a la vista.</span>
          </>
        }
        lead="Vallas, pantallas, letreros y vidrieras en Latinoamérica. Mirá el calendario de cada espacio, reservá las fechas libres y pagá con Stripe."
        actions={
          <>
            <ButtonLink href="/anuncios/publicar" size="lg" className="w-full sm:w-auto">
              Publicar un espacio
            </ButtonLink>
            <ButtonLink href="/anuncios/mis-espacios" tone="secondary" size="lg" className="w-full sm:w-auto">
              Mis espacios
            </ButtonLink>
          </>
        }
        aside={
          <ol className="mv-panel flex flex-col gap-5 p-6 md:p-7" aria-label="Cómo funciona">
            {HOW.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--mv-hairline)] text-gold">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    <span className="mv-data mr-2 text-[var(--text-tertiary)]">0{i + 1}</span>
                    {title}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        }
      />

      <section aria-labelledby="ads-results" className="pb-14 md:pb-24">
        <Container>
          {/* Search bar: floats while you browse the results */}
          <form
            role="search"
            aria-label="Buscar espacios"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="mv-menu relative z-30 grid gap-1 rounded-[1.5rem] p-2 md:sticky md:top-[5.5rem] md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:rounded-full"
          >
            <label className="flex h-12 min-w-0 items-center gap-3 rounded-full px-4 focus-within:bg-[var(--mv-panel-hover)]">
              <Search className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span className="sr-only">Qué buscás</span>
              <input
                type="search"
                placeholder="Pantalla LED, valla en avenida…"
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
                options={uniqueCities}
                disabled={!selectedCountry}
                disabledText="Elegí un país"
                onChange={setSelectedCity}
              />
            </div>
            <button type="submit" className={buttonClass("primary", "md", "w-full md:w-auto")}>
              Buscar
            </button>
          </form>

          {/* Refine */}
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <fieldset className="min-w-0">
              <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Tipo de soporte</legend>
              <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                {CATEGORIES.map((cat) => {
                  const on = selectedCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleCategory(cat.value)}
                      className={cn(
                        "mv-focus h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                        on
                          ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
                          : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
              <div className="flex flex-col gap-2">
                <label htmlFor="ads-min" className="text-sm font-semibold text-[var(--text-primary)]">
                  Precio mín. / mes
                </label>
                <input
                  id="ads-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="US$ 0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="mv-input mv-data sm:w-36"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="ads-max" className="text-sm font-semibold text-[var(--text-primary)]">
                  Precio máx. / mes
                </label>
                <input
                  id="ads-max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Sin tope"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="mv-input mv-data sm:w-36"
                />
              </div>
              <ChoiceMenu label="Ordenar" value={sortBy} options={SORTS} onChange={setSortBy} className="col-span-2 sm:w-60" />
            </div>
          </div>

          <div className="mv-divider mt-8" aria-hidden />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 id="ads-results" className="text-sm text-[var(--text-secondary)]" aria-live="polite">
              {loading ? (
                "Buscando espacios…"
              ) : (
                <>
                  <span className="mv-data font-semibold text-[var(--text-primary)]">{count}</span>{" "}
                  {count === 1 ? "espacio disponible" : "espacios disponibles"}
                </>
              )}
            </h2>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className={buttonClass("ghost", "sm")}>
                <X className="h-4 w-4" aria-hidden />
                Limpiar filtros
              </button>
            ) : null}
          </div>

          <div className="mt-6">
            {loading ? (
              <CardSkeletonGrid />
            ) : spaces.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Todavía no hay espacios publicados"
                body="Si tenés una valla, una pantalla o una vidriera, publicala primero: las marcas te encuentran acá y tu primer alquiler no paga comisión de plataforma."
                action={
                  <ButtonLink href="/anuncios/publicar" className="w-full sm:w-auto">
                    Publicar el primer espacio
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
                icon={SlidersHorizontal}
                title="Ningún espacio coincide con estos filtros"
                body="Probá con otra ciudad, sumá tipos de soporte o ampliá el rango de precio."
                action={
                  <button type="button" onClick={clearFilters} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
                    Limpiar filtros
                  </button>
                }
              />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAndSortedSpaces.map((space) => {
                  const price = formatMoney(space.pricePerMonth, space.currency);
                  return (
                    <li key={space.id} className="mv-panel mv-panel-interactive group relative flex flex-col overflow-hidden">
                      <MediaFrame src={space.images?.[0]?.url} alt="" icon={Megaphone}>
                        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                          <span className="mv-chip border-white/15 bg-black/55 text-white backdrop-blur-md">
                            {labelFor(SPACE_TYPE_LABEL, space.type)}
                          </span>
                          {space.hasLighting ? (
                            <span className="mv-chip border-white/15 bg-black/55 text-white backdrop-blur-md">
                              <Lightbulb className="h-3.5 w-3.5 text-gold" aria-hidden />
                              Iluminado
                            </span>
                          ) : null}
                        </div>
                      </MediaFrame>
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <div className="flex flex-col gap-1.5">
                          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)]">
                            <Link href={`/anuncios/${space.id}`} className="outline-none after:absolute after:inset-0 after:rounded-[1.5rem] focus-visible:after:ring-2 focus-visible:after:ring-gold">
                              {space.title}
                            </Link>
                          </h3>
                          <p className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                            <span className="truncate">
                              {[space.city, space.country].filter(Boolean).join(", ")}
                            </span>
                          </p>
                        </div>
                        {space.isFirstRentalFree ? (
                          <span className="mv-chip mv-chip-gold w-fit">
                            <BadgePercent className="h-3.5 w-3.5" aria-hidden />
                            Primer alquiler sin comisión
                          </span>
                        ) : null}
                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--mv-hairline)] pt-4">
                          <p className="flex flex-col">
                            <span className="text-xs text-[var(--text-tertiary)]">Por mes</span>
                            <span className="mv-data text-lg font-semibold text-[var(--text-primary)]">{price ?? "A consultar"}</span>
                          </p>
                          {space.trafficEstimate ? (
                            <p className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                              <span className="mv-data">{Number(space.trafficEstimate).toLocaleString("es")}</span> vistas/mes
                            </p>
                          ) : null}
                        </div>
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
// creado por pato dev y askforvini
