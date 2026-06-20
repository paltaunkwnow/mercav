"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, MonitorPlay, Maximize, Filter, ArrowRight, Star, X, Check, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
  { value: "VALLA", label: "Valla Estática" },
  { value: "PANTALLA", label: "Pantalla Digital" },
  { value: "LETRERO", label: "Letrero" },
  { value: "VIDRIERA", label: "Vidriera / Local" },
  { value: "AUTO", label: "Transporte" },
];

export default function AnunciosPage() {
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

  return (
    <div className="w-full min-h-screen bg-bg-primary pb-20 section-transition">
      {/* Hero Section */}
      <section className="relative w-full pt-28 md:pt-32 pb-20 md:pb-24 overflow-visible border-b border-white/5 z-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gold/[0.04] blur-[200px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-bg-primary to-bg-primary z-0" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mercav Ads
            </motion.span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
              Encuentra el <span className="gradient-text-gold">espacio ideal</span><br className="hidden sm:block" /> para tu marca.
            </h1>
            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed">
              Vallas, pantallas y espacios estratégicos en toda la región. Filtra y reserva en segundos.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-5xl mx-auto relative flex flex-col md:flex-row items-stretch bg-bg-secondary/70 backdrop-blur-2xl p-2 rounded-2xl md:rounded-3xl border border-white/[0.08] shadow-2xl glassmorphism gap-2 md:gap-0 z-30"
          >
            {/* Search Input */}
            <div className="flex-[1.2] min-w-0 flex items-center px-4 md:px-6 border-b md:border-b-0 md:border-r border-white/5">
              <Search className="h-5 w-5 text-gold mr-3 md:mr-4 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="¿Qué buscas? (Ej. Pantalla LED)" 
                className="w-full bg-transparent border-none text-white focus:outline-none focus:ring-0 placeholder-gray-600 h-12 md:h-14 text-sm"
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
            <div className="flex-[0.9] min-w-0 flex items-center px-4 md:px-6 border-b md:border-b-0 md:border-r border-white/5 relative group" ref={countryRef}>
              <MapPin className="h-5 w-5 text-gold mr-3 md:mr-4 flex-shrink-0" />
              <button
                type="button"
                onClick={() => {
                  setCountryDropdownOpen(!countryDropdownOpen);
                  setCityDropdownOpen(false);
                }}
                className="w-full bg-transparent border-none text-white focus:outline-none focus:ring-0 h-12 md:h-14 cursor-pointer text-sm font-medium text-left flex items-center justify-between pr-4 select-none"
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
            <div className="flex-[0.9] min-w-0 flex items-center px-4 md:px-6 relative group" ref={cityRef}>
              <MapPin className="h-5 w-5 text-gold mr-3 md:mr-4 flex-shrink-0" />
              <button
                type="button"
                disabled={!selectedCountry}
                onClick={() => {
                  setCityDropdownOpen(!cityDropdownOpen);
                  setCountryDropdownOpen(false);
                }}
                className="w-full bg-transparent border-none text-white focus:outline-none focus:ring-0 h-12 md:h-14 cursor-pointer text-sm font-medium text-left flex items-center justify-between pr-4 disabled:opacity-50 disabled:cursor-not-allowed select-none"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button 
              onClick={handleSearch}
              className="h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl bg-gold text-black font-black uppercase tracking-widest text-[11px] hover:bg-gold-light transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Explorar
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col xl:flex-row gap-8 md:gap-10">
          {/* Filters Sidebar */}
          <aside className="w-full xl:w-80 flex-shrink-0">
            <div className="bg-bg-secondary/50 border border-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 sticky top-24 shadow-xl glassmorphism">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gold" />
                  <h3 className="font-black uppercase tracking-widest text-xs md:text-sm text-white">Filtros</h3>
                </div>
                {(selectedCategories.length > 0 || minPrice || maxPrice) && (
                  <button onClick={clearFilters} className="text-[10px] text-gold uppercase tracking-widest font-bold hover:underline">Limpiar</button>
                )}
              </div>
              
              <div className="space-y-8 md:space-y-10">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-5">Categoría</h4>
                  <div className="space-y-2 md:space-y-3">
                    {CATEGORIES.map(cat => {
                      const isSelected = selectedCategories.includes(cat.value);
                      return (
                        <button 
                          key={cat.value} 
                          onClick={() => toggleCategory(cat.value)}
                          className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-300 text-left group ${
                            isSelected ? "bg-gold/10 border-gold/40 text-white" : "bg-bg-primary/50 border-white/5 text-gray-400 hover:border-white/10"
                          }`}
                        >
                          <span className="text-sm font-medium">{cat.label}</span>
                          <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                            isSelected ? "bg-gold border-gold text-black" : "border-gray-700 group-hover:border-gray-500"
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 md:mb-5">Rango de Precio</h4>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="relative">
                      <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gold font-bold text-xs">$</span>
                      <input 
                        type="number" 
                        placeholder="Mín" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full bg-bg-primary/50 border border-white/5 rounded-xl h-11 md:h-12 pl-7 md:pl-8 pr-3 md:pr-4 text-white text-xs outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/10 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gold font-bold text-xs">$</span>
                      <input 
                        type="number" 
                        placeholder="Máx" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full bg-bg-primary/50 border border-white/5 rounded-xl h-11 md:h-12 pl-7 md:pl-8 pr-3 md:pr-4 text-white text-xs outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/10 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
              <p className="text-gray-400 text-sm">
                Encontramos <span className="text-white font-bold">{filteredAndSortedSpaces.length}</span> espacios que coinciden con tu búsqueda
              </p>
              <div className="w-full sm:w-72">
                <CustomSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  options={[
                    { value: "Recomendados", label: "Recomendados" },
                    { value: "Precio: Menor a Mayor", label: "Precio: Menor a Mayor" },
                    { value: "Precio: Mayor a Menor", label: "Precio: Mayor a Menor" },
                    { value: "Más Vistos", label: "Más Vistos" },
                  ]}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-2 border-gold/10"></div>
                  <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin"></div>
                </div>
                <p className="text-gray-500 text-xs uppercase tracking-[0.3em] font-black">Cargando ecosistema...</p>
              </div>
            ) : filteredAndSortedSpaces.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 md:py-32 bg-bg-secondary/50 rounded-3xl border border-dashed border-white/10 glassmorphism"
              >
                <div className="bg-bg-tertiary h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 float-gentle">
                  <Search className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No encontramos resultados</h3>
                <p className="text-gray-500 text-sm">Intenta ajustar los filtros para encontrar lo que buscas.</p>
                <Button onClick={clearFilters} variant="link" className="mt-4 text-gold font-bold uppercase tracking-widest text-xs">Ver todo</Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedSpaces.map((space, i) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      key={space.id} 
                      className="group relative"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/0 via-gold/15 to-gold/0 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>
                      <div className="relative bg-bg-secondary/60 border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:border-gold/30 hover:-translate-y-1 h-full flex flex-col shadow-xl glassmorphism card-hover-premium">
                        {/* Image Header */}
                        <div className="relative h-52 md:h-64 w-full overflow-hidden bg-bg-tertiary">
                          <img 
                            src={space.images?.[0]?.url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000"} 
                            alt={space.title} 
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent opacity-70"></div>
                          
                          <div className="absolute top-4 md:top-5 left-4 md:left-5 bg-black/60 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 md:px-4 py-1.5 md:py-2 rounded-xl">
                            {CATEGORIES.find(c => c.value === space.type)?.label || space.type}
                          </div>
                          
                          {space.hasLighting && (
                            <div className="absolute top-4 md:top-5 right-4 md:right-5 bg-gold/90 text-black p-2 rounded-xl shadow-xl shadow-gold/20">
                              <Zap size={14} className="fill-current" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg md:text-xl text-white leading-tight group-hover:text-gold transition-colors duration-300 line-clamp-1">{space.title}</h3>
                              <div className="flex items-center gap-2 text-gray-500 text-xs mt-2 uppercase tracking-widest font-semibold">
                                <MapPin className="h-3 w-3 text-gold/60" />
                                {space.city}, {space.country}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 md:px-3 py-1 md:py-1.5 rounded-xl flex-shrink-0">
                              <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                              <span className="text-white font-bold text-xs">4.9</span>
                            </div>
                          </div>

                          <p className="text-gray-400 text-sm line-clamp-2 mb-6 md:mb-8 leading-relaxed">
                            {space.description}
                          </p>
                          
                          <div className="mt-auto pt-5 md:pt-6 border-t border-white/5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Inversión Mensual</p>
                                <p className="text-xl md:text-2xl font-mono font-bold text-white">
                                  <span className="text-gold">$</span>{space.pricePerMonth}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Impacto Bruto</p>
                                <p className="text-sm font-bold text-gray-300">
                                  {space.trafficEstimate ? `${(space.trafficEstimate / 1000).toFixed(0)}K` : "120K"} <span className="text-[10px] opacity-50 uppercase">vistas</span>
                                </p>
                              </div>
                            </div>

                            <Button asChild className="w-full mt-6 md:mt-8 bg-white/[0.03] hover:bg-gold hover:text-black text-white border border-white/10 hover:border-gold rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[10px] transition-all duration-300 hover:shadow-lg hover:shadow-gold/20">
                              <Link href={`/anuncios/${space.id}`}>Gestionar / Ver Detalles</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Zap({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
