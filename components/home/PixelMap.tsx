/**
 * Los colores van por style (no por atributo) para aceptar variables CSS, como las del mundo Kosher.
 *
 * Latinoamérica en pixel art, en una grilla de 60 × 50 (mismo lenguaje que Mervi).
 * El contorno sale de coordenadas reales (latitud, longitud) proyectadas en forma equirectangular, así que las
 * capitales y los lugares del atlas caen donde corresponde. Una celda equivale a 1/0,56 grados.
 */

const GRID_W = 60;
const GRID_H = 50;
const SCALE = 0.56;
const LNG0 = -118;
const LAT0 = 33;
const X0 = 6;

/** Coordenada real a celda de la grilla (con decimales). */
export function project(lat: number, lng: number): [number, number] {
  return [(lng - LNG0) * SCALE + X0, (LAT0 - lat) * SCALE];
}

type LatLng = [number, number];

const OUTLINES: LatLng[][] = [
  // México y Centroamérica (sin Baja California)
  [
    [32.5, -114.8], [31.3, -111], [31.8, -106.5], [29.0, -103], [26.0, -97.2], [22.3, -97.8], [19.2, -96.1], [18.6, -94], [18.5, -91.5],
    [21.0, -90.3], [21.5, -87.1], [18.5, -87.8], [15.8, -88.5], [15.9, -85.0], [15.0, -83.2], [11.0, -83.7], [9.3, -79.9], [8.6, -77.4],
    [7.2, -80.6], [8.7, -83.6], [11.0, -85.7], [12.9, -87.5], [13.5, -89.8], [14.6, -92.2], [15.9, -95.5], [16.8, -99.9], [19.1, -104.3],
    [20.6, -105.3], [22.9, -106.4], [27.9, -110.9], [31.3, -113.5],
  ],
  // Baja California
  [[32.5, -117.1], [30.0, -115.8], [27.0, -114.2], [24.5, -111.8], [22.9, -109.9], [24.1, -110.3], [26.8, -112.0], [28.4, -112.8], [31.6, -114.8]],
  // Cuba, La Española y Puerto Rico
  [[22.9, -84.5], [23.2, -82.0], [22.7, -79.5], [21.5, -77.0], [20.7, -74.2], [19.9, -75.5], [20.4, -77.6], [21.5, -80.5], [22.0, -83.5]],
  [[19.9, -72.8], [19.7, -70.0], [19.0, -68.3], [18.3, -68.7], [18.2, -71.0], [18.4, -74.4], [19.2, -73.0]],
  [[18.6, -67.3], [18.5, -65.5], [17.9, -65.6], [17.9, -67.3]],
  // Sudamérica
  [
    [8.6, -77.4], [11.2, -74.2], [12.4, -71.7], [10.6, -66.9], [10.6, -61.5], [8.5, -60.0], [6.8, -58.1], [5.8, -55.2], [4.9, -52.3],
    [1.5, -50.0], [-1.4, -48.5], [-2.5, -44.3], [-3.7, -38.5], [-5.2, -35.2], [-8.1, -34.9], [-13.0, -38.5], [-20.3, -40.3], [-22.9, -43.2],
    [-23.9, -46.3], [-27.6, -48.5], [-32.0, -52.1], [-34.9, -54.9], [-34.6, -58.4], [-36.3, -57.0], [-38.0, -57.5], [-39.0, -62.0],
    [-41.0, -65.0], [-45.9, -67.5], [-50.0, -68.5], [-52.4, -68.4], [-54.8, -68.3], [-55.9, -67.3], [-53.0, -72.5], [-52.0, -74.5],
    [-47.0, -75.5], [-41.5, -73.8], [-36.8, -73.1], [-33.0, -71.6], [-27.0, -70.8], [-23.6, -70.4], [-18.5, -70.3], [-15.8, -75.0],
    [-12.1, -77.0], [-8.1, -79.0], [-4.6, -81.3], [-2.2, -80.9], [-1.0, -80.7], [1.2, -79.0], [3.9, -77.1], [7.0, -77.8],
  ],
];

const POLYS: [number, number][][] = OUTLINES.map((o) => o.map(([lat, lng]) => project(lat, lng)));

function inside(poly: [number, number][], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) c = !c;
  }
  return c;
}

const LAND = new Set<string>();
for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) if (POLYS.some((p) => inside(p, x + 0.5, y + 0.5))) LAND.add(`${x},${y}`);

/** Tramos de tierra por fila. */
const RUNS: { x: number; y: number; w: number }[] = (() => {
  const out: { x: number; y: number; w: number }[] = [];
  for (let y = 0; y < GRID_H; y++) {
    let start = -1;
    for (let x = 0; x <= GRID_W; x++) {
      const land = x < GRID_W && LAND.has(`${x},${y}`);
      if (land && start < 0) start = x;
      if (!land && start >= 0) {
        out.push({ x: start, y, w: x - start });
        start = -1;
      }
    }
  }
  return out;
})();

/** Celda de tierra más cercana a una coordenada (las ciudades costeras pueden caer en el agua por la escala). */
export function pinCell(lat: number, lng: number): [number, number] {
  const [fx, fy] = project(lat, lng);
  const x = Math.floor(fx);
  const y = Math.floor(fy);
  if (LAND.has(`${x},${y}`)) return [x, y];
  for (let r = 1; r <= 3; r++) {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (!LAND.has(`${x + dx},${y + dy}`)) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = [x + dx, y + dy];
        }
      }
    if (best) return best;
  }
  return [x, y];
}

/** Capitales de los 20 países (sede de gobierno), como celdas. */
const CAPITAL_COORDS: Record<string, LatLng> = {
  MX: [19.43, -99.13], GT: [14.63, -90.51], SV: [13.69, -89.22], HN: [14.07, -87.19], NI: [12.11, -86.24], CR: [9.93, -84.08], PA: [8.98, -79.52],
  CU: [23.11, -82.37], DO: [18.49, -69.93], PR: [18.47, -66.11], VE: [10.49, -66.88], CO: [4.71, -74.07], EC: [-0.18, -78.47], PE: [-12.05, -77.04],
  BO: [-16.5, -68.15], BR: [-15.79, -47.88], PY: [-25.26, -57.58], CL: [-33.45, -70.67], AR: [-34.6, -58.38], UY: [-34.9, -56.16],
};
export const CAPITALS: Record<string, [number, number]> = Object.fromEntries(Object.entries(CAPITAL_COORDS).map(([c, [lat, lng]]) => [c, pinCell(lat, lng)]));

/** Ciudades de la región que pueden tener lugares en el atlas Kosher. */
export const CITY_COORDS: Record<string, LatLng> = {
  "São Paulo": [-23.55, -46.63], "Sao Paulo": [-23.55, -46.63], "Río de Janeiro": [-22.91, -43.17], "Rio de Janeiro": [-22.91, -43.17],
  "Buenos Aires": [-34.6, -58.38], Montevideo: [-34.9, -56.16], "La Paz": [-16.5, -68.15], "Santa Cruz": [-17.78, -63.18],
  "Santa Cruz de la Sierra": [-17.78, -63.18], Cochabamba: [-17.39, -66.16], Santiago: [-33.45, -70.67], Lima: [-12.05, -77.04],
  "Bogotá": [4.71, -74.07], "Medellín": [6.25, -75.56], "Ciudad de México": [19.43, -99.13], "CDMX": [19.43, -99.13], Guadalajara: [20.66, -103.35],
  Monterrey: [25.69, -100.32], Cancún: [21.16, -86.85], Caracas: [10.49, -66.88], "Panamá": [8.98, -79.52], "Ciudad de Panamá": [8.98, -79.52],
  "San José": [9.93, -84.08], Quito: [-0.18, -78.47], Guayaquil: [-2.19, -79.89], "Asunción": [-25.26, -57.58], Córdoba: [-31.42, -64.18],
  Rosario: [-32.95, -60.65], "Punta del Este": [-34.96, -54.95], "Porto Alegre": [-30.03, -51.23], Curitiba: [-25.43, -49.27],
  "Belo Horizonte": [-19.92, -43.94], Recife: [-8.05, -34.88], Salvador: [-12.97, -38.5], "Santo Domingo": [18.49, -69.93], "La Habana": [23.11, -82.37],
  "San Juan": [18.47, -66.11], "Guatemala": [14.63, -90.51], "San Salvador": [13.69, -89.22], Tegucigalpa: [14.07, -87.19], Managua: [12.11, -86.24],
};

export function cityCell(city: string): [number, number] | null {
  const c = CITY_COORDS[city];
  return c ? pinCell(c[0], c[1]) : null;
}

export type MapPin = { x: number; y: number; active?: boolean; color?: string };

export function PixelMap({
  pins = [],
  land = "currentColor",
  shade,
  ocean,
  pinColor = "#e6bd55",
  className,
  title,
}: {
  pins?: MapPin[];
  land?: string;
  /** Tono de la costa sur/este (sombra de una celda). */
  shade?: string;
  ocean?: string;
  pinColor?: string;
  className?: string;
  title?: string;
}) {
  return (
    <svg viewBox={`0 0 ${GRID_W} ${GRID_H}`} className={`c-pixel ${className ?? ""}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      {ocean ? (
        <g style={{ fill: ocean }}>
          {Array.from({ length: Math.floor(GRID_H / 4) }, (_, j) =>
            Array.from({ length: Math.floor(GRID_W / 4) }, (_, i) => <rect key={`${i}-${j}`} x={i * 4 + 1} y={j * 4 + 1} width={1} height={1} />),
          )}
        </g>
      ) : null}
      {shade ? (
        <g style={{ fill: shade }}>
          {RUNS.map((r, i) => (
            <rect key={i} x={r.x + 1} y={r.y + 1} width={r.w} height={1} />
          ))}
        </g>
      ) : null}
      <g style={{ fill: land }}>
        {RUNS.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </g>
      {pins.map((p, i) => (
        <g key={i} className={p.active ? "c-pin-active" : undefined}>
          {p.active ? <rect x={p.x - 2} y={p.y - 2} width={5} height={5} fill={p.color ?? pinColor} opacity={0.35} className="c-pin-halo" /> : null}
          <rect x={p.x - 1} y={p.y - 1} width={3} height={3} fill="#0b0a09" />
          <rect x={p.x} y={p.y} width={1} height={1} fill={p.color ?? pinColor} />
        </g>
      ))}
    </svg>
  );
}

export const MAP_SIZE = { w: GRID_W, h: GRID_H };
// creado por pato dev y askforvini
