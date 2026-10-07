export type Founder = {
  name: string;
  role: "CEO" | "CTO";
  initials: string;
  /** Only founders with a public profile on /nosotros. */
  profile?: string;
};

export const FOUNDERS: Founder[] = [
  { name: "Vinicius Salazar", role: "CEO", initials: "VS", profile: "/nosotros#vinicius" },
  { name: "Sebastian Rojas Cespedes", role: "CTO", initials: "SR" },
  { name: "Alejandro Ismael Mendoza Diaz", role: "CTO", initials: "AM" },
];
// creado por pato dev y askforvini
