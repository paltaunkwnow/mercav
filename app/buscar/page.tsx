"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  Search, 
  Users, 
  Briefcase, 
  MonitorPlay, 
  Megaphone, 
  Loader2, 
  ArrowRight,
  Filter,
  MapPin,
  Star,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SeekField } from "@/components/motion/SeekField";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&tipo=all`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "all", label: "Todo", icon: Search },
    { id: "users", label: "Personas", icon: Users },
    { id: "jobs", label: "Empleos", icon: Briefcase },
    { id: "services", label: "Servicios", icon: MonitorPlay },
    { id: "spaces", label: "Anuncios", icon: Megaphone },
  ];

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-8">
        <Search className="w-10 h-10 text-gray-700" />
      </div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">No encontramos resultados</h2>
      <p className="text-gray-500 max-w-sm">Intenta buscar con otras palabras clave o explora nuestras categorías.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Search Header */}
      <div className="mb-12 flex justify-center">
        <SeekField
          defaultOpen
          value={query}
          onValueChange={setQuery}
          onSubmit={(next) => router.push(`/buscar?q=${encodeURIComponent(next)}`)}
          placeholder="¿Qué estás buscando en Mercav?"
          shut={64}
          openWidth={640}
          persistent
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${
              activeTab === tab.id 
                ? 'bg-gold text-primary-foreground border-gold shadow-lg shadow-gold/20' 
                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Buscando lo mejor para ti...</p>
          </div>
        ) : results ? (
          <div className="grid gap-16">
            {/* Users Section */}
            {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Users className="text-gold" size={24} /> Personas y Profesionales
                  </h3>
                  <Link href="#" className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gold transition-colors">Ver todos</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {results.users.map((u: any) => (
                    <div 
                      key={u.id} 
                      className="bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] hover:border-gold/20 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                    >
                      {/* Full card link for profile */}
                      <Link 
                        href={`/perfil/${u.username || u.id}`} 
                        className="absolute inset-0 z-10"
                      />

                      <div className="flex items-center gap-4 mb-4 relative z-0">
                        <img 
                          src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} 
                          className="w-16 h-16 rounded-2xl object-cover border border-white/5 group-hover:scale-105 transition-transform" 
                          alt={u.name}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white group-hover:text-gold transition-colors truncate">{u.name}</h4>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest truncate">{u.profile?.headline || 'Usuario de Mercav'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between relative z-20">
                        <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest gap-2">
                          <MapPin size={12} className="text-gold" /> {u.location || 'Bolivia'}
                        </div>
                        <Button asChild size="sm" className="bg-gold/10 text-gold hover:bg-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest h-8 px-4">
                          <Link href={`/mensajes?to=${u.id}`}>Escribir</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Jobs Section */}
            {(activeTab === 'all' || activeTab === 'jobs') && results.jobs?.length > 0 && (
              <section>
                 <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Briefcase className="text-gold" size={24} /> Oportunidades Laborales
                  </h3>
                  <Link href="/empleos" className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gold transition-colors">Ver cartelera</Link>
                </div>
                <div className="grid gap-4">
                  {results.jobs.map((j: any) => (
                    <Link href={`/empleos/${j.id}`} key={j.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] hover:border-gold/20 hover:bg-white/[0.04] transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Briefcase className="text-gold w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-gold transition-colors text-lg">{j.title}</h4>
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                            <span>{j.company?.name}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                            <span className="flex items-center"><MapPin size={12} className="mr-1" /> {j.city}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-xs font-black uppercase tracking-widest text-gold bg-gold/10 px-4 py-2 rounded-xl">Postular Ahora</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Services Section */}
            {(activeTab === 'all' || activeTab === 'services') && results.services?.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <MonitorPlay className="text-gold" size={24} /> Servicios Freelance
                  </h3>
                  <Link href="/servicios" className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gold transition-colors">Explorar servicios</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {results.services.map((s: any) => (
                    <Link href={`/servicios/${s.id}`} key={s.id} className="bg-bg-secondary border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-gold/20 hover:bg-white/[0.04] transition-all group">
                      <div className="h-48 bg-bg-tertiary relative overflow-hidden">
                        <img src={`https://source.unsplash.com/featured/?professional,service,${s.title.split(' ')[0]}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 text-white font-mono font-bold text-xs">
                          ${s.packages?.[0]?.price || 0}
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold text-white group-hover:text-gold transition-colors mb-2 line-clamp-1">{s.title}</h4>
                        <div className="flex items-center gap-3">
                          <img src={s.provider?.avatar || `https://ui-avatars.com/api/?name=${s.provider?.name}`} className="w-6 h-6 rounded-lg object-cover" />
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s.provider?.name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Spaces Section */}
             {(activeTab === 'all' || activeTab === 'spaces') && results.spaces?.length > 0 && (
              <section>
                 <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Megaphone className="text-gold" size={24} /> Espacios Publicitarios
                  </h3>
                  <Link href="/anuncios" className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gold transition-colors">Ver ecosistema</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.spaces.map((sp: any) => (
                    <Link href={`/anuncios/${sp.id}`} key={sp.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[3rem] hover:border-gold/20 hover:bg-white/[0.04] transition-all group flex gap-6">
                      <div className="w-40 h-40 bg-bg-tertiary rounded-[2rem] overflow-hidden flex-shrink-0 border border-white/5">
                        <img src={sp.images?.[0]?.url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-[10px] text-gold font-black uppercase tracking-widest mb-2">{sp.type}</div>
                        <h4 className="text-xl font-bold text-white group-hover:text-gold transition-colors mb-3 leading-tight">{sp.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
                          <span className="flex items-center"><MapPin size={12} className="mr-1 text-gold" /> {sp.city}</span>
                          <span className="flex items-center text-white"><Star size={12} className="mr-1 text-gold fill-gold" /> 4.9</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* If no results in the active tab */}
            {activeTab !== 'all' && results[activeTab]?.length === 0 && renderEmpty()}
            {activeTab === 'all' && 
              Object.values(results).every((arr: any) => arr.length === 0) && 
              renderEmpty()
            }
          </div>
        ) : !initialQuery && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Search size={64} className="text-gray-800 mb-6" />
            <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Escribe algo arriba para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="w-full min-h-screen bg-bg-primary pt-24 pb-32 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center text-gray-500 hover:text-gold transition-colors mb-12 text-xs font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Panel
        </Link>
        
        <Suspense fallback={
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
          </div>
        }>
          <SearchContent />
        </Suspense>
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
