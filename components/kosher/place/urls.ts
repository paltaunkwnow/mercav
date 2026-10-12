// Rutas de la ficha. Sin "use client" ni servidor: las usan la página, la API y los componentes del cliente.

export const placePath = (slug: string) => `/kosher/lugar/${slug}`;

/** La imagen la sirve GET /api/kosher/photos/[id]. */
export const photoUrl = (id: string) => `/api/kosher/photos/${id}`;

/** El mapa filtrado por la ciudad: hace de página de la ciudad mientras no haya una propia. */
export const cityPath = (city: string) => `/kosher/mapa?q=${encodeURIComponent(city)}`;
// creado por pato dev y askforvini
