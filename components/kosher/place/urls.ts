// Rutas de la ficha. Sin "use client" ni servidor: las usan la página, la API y los componentes del cliente.

export const placePath = (slug: string) => `/kosher/lugar/${slug}`;

/** La imagen la sirve GET /api/kosher/photos/[id]. */
export const photoUrl = (id: string) => `/api/kosher/photos/${id}`;

/** La guía de la ciudad; si la ciudad no tiene comunidad, el mapa filtrado por su nombre. */
export const cityPath = (city: string, citySlug?: string | null) =>
  citySlug ? `/kosher/ciudad/${citySlug}` : `/kosher/mapa?q=${encodeURIComponent(city)}`;
// creado por pato dev y askforvini
