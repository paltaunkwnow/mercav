"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, User2, Briefcase, Zap, MapPin, Building2, Loader2, ArrowRight } from "lucide-react";

type TabKey = "all" | "users" | "jobs" | "services" | "spaces";

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchPageClient() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [tab, setTab] = useState<TabKey>("all");
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setData({});
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: debouncedQuery, tipo: tab === "all" ? "all" : tab });
        const res = await fetch(`/api/search?${params.toString()}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debouncedQuery, tab]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-3xl border border-border bg-bg-secondary p-5">
        <div className="mb-4 text-sm font-semibold text-white">Filtros</div>
        <div className="space-y-2">
          {[
            ["all", "Todo"],
            ["users", "Usuarios y Empresas"],
            ["jobs", "Vacantes"],
            ["services", "Servicios"],
            ["spaces", "Espacios Publicitarios"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as TabKey)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${tab === key ? "border-gold bg-gold/10 text-gold" : "border-border bg-bg-primary text-gray-300 hover:text-white"}`}>
              <span>{label}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="rounded-3xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-primary px-4 py-3">
            <Search className="h-5 w-5 text-gold" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar usuarios, empresas, vacantes, servicios o espacios" className="w-full bg-transparent text-white outline-none placeholder:text-gray-500" autoFocus />
          </div>
          <div className="mt-3 text-xs text-gray-500">Búsqueda en tiempo real con debounce de 300ms.</div>
        </div>

        {!debouncedQuery.trim() ? (
          <div className="rounded-3xl border border-border bg-bg-secondary p-10 text-center text-gray-400">Escribí algo para comenzar la búsqueda.</div>
        ) : loading ? (
          <div className="rounded-3xl border border-border bg-bg-secondary p-10 text-center text-gray-400"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-gold" />Buscando...</div>
        ) : tab === "all" ? (
          <div className="space-y-6">
            <ResultsGroup title="Usuarios y Empresas" items={data.users || []} kind="user" />
            <ResultsGroup title="Vacantes" items={data.jobs || []} kind="job" />
            <ResultsGroup title="Servicios" items={data.services || []} kind="service" />
            <ResultsGroup title="Espacios Publicitarios" items={data.spaces || []} kind="space" />
          </div>
        ) : (
          <ResultsGroup title="Resultados" items={data[tab] || []} kind={tab.slice(0, -1) as any} />
        )}
      </section>
    </div>
  );
}

function ResultsGroup({ title, items, kind }: { title: string; items: any[]; kind: string }) {
  return (
    <div className="rounded-3xl border border-border bg-bg-secondary p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-xs text-gray-500">{items.length} resultados</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-gray-500">No se encontraron resultados. Probá con otro término.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <ResultCard key={item.id} item={item} kind={kind} />)}
        </div>
      )}
    </div>
  );
}

function ResultCard({ item, kind }: { item: any; kind: string }) {
  if (kind === "user") {
    return (
      <Link href={`/perfil/${item.username}`} className="rounded-2xl border border-border bg-bg-primary p-4 transition-colors hover:border-gold/40">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-bg-tertiary">{item.avatar ? <img src={item.avatar} className="h-full w-full object-cover" /> : null}</div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-white">{item.name}</div>
            <div className="truncate text-xs text-gray-500">@{item.username}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-300">{item.profile?.headline || item.location || "Perfil de Mercav"}</div>
      </Link>
    );
  }

  if (kind === "job") {
    return (
      <Link href={`/empleos/${item.id}`} className="rounded-2xl border border-border bg-bg-primary p-4 transition-colors hover:border-gold/40">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-xl bg-bg-tertiary">{item.company?.avatar ? <img src={item.company.avatar} className="h-full w-full object-cover" /> : <Briefcase className="m-3 h-6 w-6 text-gold" />}</div>
          <div>
            <div className="font-semibold text-white">{item.title}</div>
            <div className="text-xs text-gray-500">{item.company?.name} · {item.city}</div>
          </div>
        </div>
      </Link>
    );
  }

  if (kind === "service") {
    return (
      <Link href={`/servicios/${item.id}`} className="rounded-2xl border border-border bg-bg-primary p-4 transition-colors hover:border-gold/40">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-xl bg-bg-tertiary">{item.provider?.avatar ? <img src={item.provider.avatar} className="h-full w-full object-cover" /> : <Zap className="m-3 h-6 w-6 text-gold" />}</div>
          <div>
            <div className="font-semibold text-white">{item.title}</div>
            <div className="text-xs text-gray-500">{item.provider?.name}</div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/anuncios/${item.id}`} className="rounded-2xl border border-border bg-bg-primary p-4 transition-colors hover:border-gold/40">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-xl bg-bg-tertiary">{item.images?.[0]?.url ? <img src={item.images[0].url} className="h-full w-full object-cover" /> : <MapPin className="m-3 h-6 w-6 text-gold" />}</div>
        <div>
          <div className="font-semibold text-white">{item.title}</div>
          <div className="text-xs text-gray-500">{item.city} · {item.country}</div>
        </div>
      </div>
    </Link>
  );
}
// creado por Patodev y Invertilo
