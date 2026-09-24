"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Briefcase, DollarSign, Clock, Building, ArrowRight, Sparkles, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TiltCard } from "@/components/motion/TiltCard";

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

export default function EmpleosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  
  // Custom dropdown states & refs
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
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

  return (
    <div className="w-full min-h-screen bg-bg-primary pb-20 section-transition">
      <section className="relative bg-bg-secondary pt-28 md:pt-32 pb-16 md:pb-20 border-b border-border overflow-visible z-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold/[0.03] blur-[180px] rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mercav Jobs
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 tracking-tight"
            >
              Descubre tu próximo <span className="gradient-text-gold">gran desafío</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Miles de oportunidades en las empresas tecnológicas y tradicionales más innovadoras de Latinoamérica.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="liquid-glass-lens max-w-5xl mx-auto relative flex flex-col md:flex-row items-stretch p-2 rounded-2xl md:rounded-3xl glassmorphism gap-2 md:gap-0 z-30"
            >
              {/* Search Cargo */}
              <div className="flex-[1.2] min-w-0 flex items-center px-4 border-b md:border-b-0 md:border-r border-white/5 py-2 md:py-0">
                <Search className="h-5 w-5 text-gold/60 mr-2 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Cargo, habilidad o empresa..." 
                  className="w-full bg-transparent border-none text-white focus:ring-0 focus:outline-none h-12 placeholder:text-gray-600 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>

              {/* Selector País */}
              <div className="flex-[0.9] min-w-0 flex items-center px-4 border-b md:border-b-0 md:border-r border-white/5 py-2 md:py-0 relative group" ref={countryRef}>
                <MapPin className="h-5 w-5 text-gold/60 mr-2 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setCountryDropdownOpen(!countryDropdownOpen);
                    setCityDropdownOpen(false);
                  }}
                  className="w-full bg-transparent border-none text-white focus:ring-0 focus:outline-none h-12 cursor-pointer text-sm font-medium text-left flex items-center justify-between pr-4 select-none"
                >
                  <span className="truncate">{selectedCountry || "Todos los Países"}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 group-hover:text-gold transition-colors transition-transform duration-300 ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {countryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 8, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 right-0 top-full z-[999] max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#1A1A1A] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl mt-1.5 scrollbar-thin scrollbar-thumb-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCountry("");
                          setSelectedCity("");
                          setCountryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-all duration-200 ${
                          !selectedCountry ? "bg-gold text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>Todos los Países</span>
                        {!selectedCountry && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {uniqueCountries.map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setSelectedCity("");
                            setCountryDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-all duration-200 ${
                            selectedCountry === country ? "bg-gold text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{country}</span>
                          {selectedCountry === country && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selector Ciudad */}
              <div className="flex-[0.9] min-w-0 flex items-center px-4 py-2 md:py-0 relative group" ref={cityRef}>
                <MapPin className="h-5 w-5 text-gold/60 mr-2 flex-shrink-0" />
                <button
                  type="button"
                  disabled={!selectedCountry}
                  onClick={() => {
                    setCityDropdownOpen(!cityDropdownOpen);
                    setCountryDropdownOpen(false);
                  }}
                  className="w-full bg-transparent border-none text-white focus:ring-0 focus:outline-none h-12 cursor-pointer text-sm font-medium text-left flex items-center justify-between pr-4 disabled:opacity-50 disabled:cursor-not-allowed select-none"
                >
                  <span className="truncate">
                    {!selectedCountry 
                      ? "Selecciona un país primero" 
                      : (selectedCity || "Todas las Ciudades")
                    }
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 group-hover:text-gold transition-colors transition-transform duration-300 ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {cityDropdownOpen && selectedCountry && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 8, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 right-0 top-full z-[999] max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#1A1A1A] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl mt-1.5 scrollbar-thin scrollbar-thumb-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCity("");
                          setCityDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-all duration-200 ${
                          !selectedCity ? "bg-gold text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>Todas las Ciudades</span>
                        {!selectedCity && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {uniqueCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSelectedCity(city);
                            setCityDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-all duration-200 ${
                            selectedCity === city ? "bg-gold text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{city}</span>
                          {selectedCity === city && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCity("Remoto");
                          setCityDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-all duration-200 ${
                          selectedCity === "Remoto" ? "bg-gold text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>Remoto</span>
                        {selectedCity === "Remoto" && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button 
                onClick={handleSearch}
                className="bg-gold text-black hover:bg-gold-light rounded-xl px-6 md:px-8 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] h-12"
              >
                Buscar Empleos
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white">Empleos Disponibles</h2>
          <span className="text-sm text-gray-400">Mostrando {filteredJobs.length} roles</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-gold/10"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin"></div>
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Cargando empleos...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-bg-secondary/50 rounded-3xl border border-white/5 glassmorphism">
            <div className="h-16 w-16 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-4 float-gentle">
              <Briefcase className="h-7 w-7 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-2">No se encontraron empleos.</p>
            <p className="text-gray-600 text-sm">Intenta con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredJobs.map((job, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                key={job.id}
              >
              <TiltCard className="bg-bg-secondary/60 border border-white/5 p-5 md:p-6 rounded-2xl hover:border-gold/30 hover:bg-white/[0.03] transition-colors duration-500 group flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center cursor-pointer glassmorphism">
                <img src={job.company?.avatar || "https://ui-avatars.com/api/?name=Company&background=random"} alt={job.company?.name || "Empresa"} className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-white/5 group-hover:border-gold/20 transition-all duration-300" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-gold transition-colors duration-300 mb-2 truncate">
                    <Link href={`/empleos/${job.id}`}>{job.title}</Link>
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gold/40" /> {job.company?.name || "Empresa Confidencial"}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold/40" /> {job.city}, {job.country}</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-gold/40" /> {job.employmentType}</span>
                    {job.salaryVisible && (
                      <span className="flex items-center gap-1.5 text-green-400"><DollarSign className="w-3.5 h-3.5" /> {job.salaryMin} - {job.salaryMax} {job.salaryCurrency}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 mt-2 md:mt-0">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" /> Activo
                  </span>
                  <Button asChild className="bg-transparent border border-white/10 hover:bg-gold hover:text-black hover:border-gold transition-all duration-300 rounded-xl group-hover:bg-gold group-hover:text-black group-hover:border-gold hover:shadow-lg hover:shadow-gold/20 text-sm px-5">
                    <Link href={`/empleos/${job.id}`}>
                      Postularse <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </TiltCard>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
