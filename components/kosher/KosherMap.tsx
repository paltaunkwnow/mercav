"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { KosherPlaceType } from "@prisma/client";
import { placeIconSvg } from "@/components/kosher/PlaceIcon";
import { TONE_HEX, placeTone } from "@/lib/kosher/labels";
import type { KosherStatus } from "@prisma/client";

export type MapPlace = {
  slug: string;
  name: string;
  type: KosherPlaceType;
  status: KosherStatus;
  lat: number;
  lng: number;
};

export type MapCommunity = { slug: string; name: string; lat: number; lng: number; population: number | null };

type Props = {
  places: MapPlace[];
  communities: MapCommunity[];
  showCommunities: boolean;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  onSelectCommunity?: (slug: string) => void;
  focus: { lat: number; lng: number; zoom: number; key: number } | null;
  fitKey: number;
  userLocation: { lat: number; lng: number } | null;
};

const STYLES = {
  light: [
    "https://tiles.openfreemap.org/styles/positron",
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  ],
  dark: [
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    "https://tiles.openfreemap.org/styles/dark",
  ],
} as const;

type Theme = keyof typeof STYLES;

function currentTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function toGeoJSON(places: MapPlace[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { slug: p.slug },
    })),
  };
}

export function KosherMap({
  places,
  communities,
  showCommunities,
  selectedSlug,
  onSelect,
  onSelectCommunity,
  focus,
  fitKey,
  userLocation,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, maplibregl.Marker>());
  const communityMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const latest = useRef({ places, selectedSlug, onSelect, onSelectCommunity });
  latest.current = { places, selectedSlug, onSelect, onSelectCommunity };
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let theme = currentTheme();
    let attempt = 0;
    let styleReady = false;

    const map = new maplibregl.Map({
      container,
      style: STYLES[theme][0],
      center: [-40, 5],
      zoom: 1.6,
      minZoom: 1,
      maxZoom: 18,
      attributionControl: { compact: true },
      cooperativeGestures: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.touchZoomRotate.disableRotation();

    const ensureSource = () => {
      if (map.getSource("places")) return;
      map.addSource("places", {
        type: "geojson",
        data: toGeoJSON(latest.current.places),
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 13,
      });
      // Invisible layer so the source's tiles load and querySourceFeatures can read clusters.
      map.addLayer({ id: "places-hit", type: "circle", source: "places", paint: { "circle-radius": 1, "circle-opacity": 0 } });
    };

    const renderMarkers = () => {
      const source = map.getSource("places") as GeoJSONSource | undefined;
      if (!source || !map.isSourceLoaded("places")) return;
      const bySlug = new Map(latest.current.places.map((p) => [p.slug, p]));
      const seen = new Set<string>();

      for (const feature of map.querySourceFeatures("places")) {
        const props = feature.properties as Record<string, unknown>;
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const clusterId = props.cluster ? (props.cluster_id as number) : null;
        const id = clusterId != null ? `c-${clusterId}` : `p-${props.slug as string}`;
        if (seen.has(id)) continue;
        seen.add(id);

        let marker = markersRef.current.get(id);
        if (!marker) {
          const el = document.createElement("button");
          el.type = "button";
          if (clusterId != null) {
            const count = props.point_count as number;
            el.className = "kosher-cluster";
            el.textContent = String(count);
            el.setAttribute("aria-label", `${count} lugares. Acercar`);
            el.style.setProperty("--size", `${Math.min(64, 38 + Math.log2(count) * 7)}px`);
            el.addEventListener("click", async (e) => {
              e.stopPropagation();
              const zoom = await source.getClusterExpansionZoom(clusterId);
              map.easeTo({ center: [lng, lat], zoom: Math.min(zoom + 0.4, 16), duration: 650 });
            });
          } else {
            const place = bySlug.get(props.slug as string);
            if (!place) continue;
            el.className = "kosher-pin";
            el.style.setProperty("--tone", TONE_HEX[placeTone(place.type, place.status)]);
            el.setAttribute("aria-label", place.name);
            el.dataset.slug = place.slug;
            el.innerHTML = `<span class="kosher-pin-body">${placeIconSvg(place.type, 15)}</span><span class="kosher-pin-label">${escapeHtml(place.name)}</span>`;
            el.addEventListener("click", (e) => {
              e.stopPropagation();
              latest.current.onSelect(place.slug);
            });
          }
          marker = new maplibregl.Marker({ element: el, anchor: clusterId != null ? "center" : "bottom" })
            .setLngLat([lng, lat])
            .addTo(map);
          markersRef.current.set(id, marker);
        }
        const el = marker.getElement();
        if (el.dataset.slug) el.classList.toggle("is-selected", el.dataset.slug === latest.current.selectedSlug);
      }

      for (const [id, marker] of markersRef.current) {
        if (!seen.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
    };

    const onStyleLoad = () => {
      styleReady = true;
      ensureSource();
      setState("ready");
    };

    map.on("style.load", onStyleLoad);
    map.on("error", (event) => {
      if (styleReady) return;
      const status = (event.error as { status?: number } | undefined)?.status;
      console.warn("Kosher map style failed", status ?? event.error?.message);
      attempt += 1;
      const next = STYLES[theme][attempt];
      if (next) map.setStyle(next);
      else setState("failed");
    });
    map.on("data", (e) => {
      if ((e as { sourceId?: string }).sourceId === "places") renderMarkers();
    });
    map.on("moveend", renderMarkers);
    map.on("render", () => {
      if (markersRef.current.size === 0 && latest.current.places.length > 0) renderMarkers();
    });

    const observer = new MutationObserver(() => {
      const next = currentTheme();
      if (next === theme) return;
      theme = next;
      attempt = 0;
      styleReady = false;
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.setStyle(STYLES[theme][0]);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      observer.disconnect();
      ro.disconnect();
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("places") as GeoJSONSource | undefined;
    if (!map || !source) return;
    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();
    source.setData(toGeoJSON(places));
  }, [places, state]);

  useEffect(() => {
    for (const marker of markersRef.current.values()) {
      const el = marker.getElement();
      if (el.dataset.slug) el.classList.toggle("is-selected", el.dataset.slug === selectedSlug);
    }
  }, [selectedSlug]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const mobile = !window.matchMedia("(min-width: 768px)").matches;
    const offset: [number, number] = mobile && selectedSlug ? [0, -map.getContainer().clientHeight * 0.19] : [0, 0];
    map.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom, offset, duration: 1100, essential: true });
  }, [focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready" || fitKey === 0 || places.length === 0) return;
    if (places.length === 1) {
      map.flyTo({ center: [places[0].lng, places[0].lat], zoom: 13, duration: 900 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    for (const p of places) bounds.extend([p.lng, p.lat]);
    const desktop = window.innerWidth >= 768;
    map.fitBounds(bounds, {
      padding: desktop ? { top: 120, bottom: 60, left: 420, right: 60 } : { top: 170, bottom: 120, left: 30, right: 30 },
      maxZoom: 13,
      duration: 900,
    });
    // Fit only when the filter changes, not whenever places update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, state]);

  useEffect(() => {
    const map = mapRef.current;
    for (const m of communityMarkersRef.current) m.remove();
    communityMarkersRef.current = [];
    if (!map || !showCommunities) return;
    for (const c of communities) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "kosher-community";
      el.setAttribute("aria-label", `Comunidad de ${c.name}`);
      el.innerHTML = `<span class="kosher-community-ring"></span><span class="kosher-community-label">${escapeHtml(c.name)}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        latest.current.onSelectCommunity?.(c.slug);
      });
      communityMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map));
    }
  }, [communities, showCommunities, state]);

  useEffect(() => {
    const map = mapRef.current;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (!map || !userLocation) return;
    const el = document.createElement("span");
    el.className = "kosher-me";
    el.setAttribute("aria-label", "Tu ubicación");
    userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
  }, [userLocation, state]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg-tertiary">
      <div ref={containerRef} className="kosher-map h-full w-full" />
      {state !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-bg-tertiary">
          {state === "loading" ? (
            <div className="flex flex-col items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/25 border-t-gold" />
              Cargando el mapa…
            </div>
          ) : (
            <p className="max-w-xs px-6 text-center text-sm text-[var(--text-secondary)]">
              No pudimos cargar el mapa. Revisá tu conexión y recargá la página. La lista de lugares sigue disponible.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
