export type Founder = {
  name: string;
  /** Cargo como se muestra en el sitio. */
  role: string;
  initials: string;
  /** El fundador principal y cara de Mercav. */
  lead?: boolean;
  /** Solo quienes tienen perfil público en /nosotros. */
  profile?: string;
  /** Aclaración corta bajo el nombre. */
  note?: string;
};

/**
 * El equipo de Mercav. Vinicius Salazar es el fundador principal, la cara de la empresa y el encargado de ciberseguridad. Marco Sánchez vive en
 * Costa Rica, es la imagen de Mercav allá y lleva la plataforma a ese país; responde a Vinicius. José Alberto Vargas Aguilera es Chief Revenue Officer.
 */
export const FOUNDERS: Founder[] = [
  { name: "Vinicius Salazar", role: "Fundador, CEO y encargado de Ciberseguridad", initials: "VS", lead: true, profile: "/nosotros#vinicius" },
  { name: "Jaider Alejandro Pinto Ribera", role: "CSO, Cofundador y Director de Seguridad", initials: "JP", profile: "/nosotros#jaider" },
  { name: "Sebastian Rojas Cespedes", role: "Cofundador", initials: "SR", profile: "/nosotros#sebastian" },
  { name: "Alejandro Ismael Mendoza Diaz", role: "CTO", initials: "AM", profile: "/nosotros#alejandro" },
  { name: "José Alberto Vargas Aguilera", role: "Chief Revenue Officer", initials: "JA", profile: "/nosotros#jose-alberto" },
  { name: "Marco Sánchez", role: "Representante de Mercav en Costa Rica", initials: "MS", profile: "/nosotros#marco", note: "Lleva Mercav a Costa Rica y está a cargo de su imagen y su marketing en el país." },
];
