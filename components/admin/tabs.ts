import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  MapPin,
  DollarSign,
  Handshake,
  Flag,
  ScanEye,
  Medal,
  Settings,
} from "lucide-react";

export type AdminTabId =
  | "overview"
  | "users"
  | "companies"
  | "services"
  | "spaces"
  | "finance"
  | "investors"
  | "reports"
  | "traffic"
  | "badges"
  | "settings";

export type AdminTab = {
  id: AdminTabId;
  label: string;
  title: string;
  lead: string;
  group: "General" | "Personas" | "Contenido" | "Operación" | "Sistema";
  icon: typeof Users;
};

export const ADMIN_TABS: AdminTab[] = [
  { id: "overview", label: "Resumen", title: "Resumen", lead: "Actividad, ingresos y altas de los últimos seis meses.", group: "General", icon: LayoutDashboard },
  { id: "users", label: "Usuarios", title: "Usuarios", lead: "Buscá cuentas, cambiá planes, verificá o sancioná.", group: "Personas", icon: Users },
  { id: "companies", label: "Empresas", title: "Solicitudes de empresa", lead: "Personas que piden vincularse a una empresa. Aprobá o rechazá cada solicitud.", group: "Personas", icon: Building2 },
  { id: "investors", label: "Inversores", title: "Contactos de inversores", lead: "Mensajes recibidos desde el formulario de inversores.", group: "Personas", icon: Handshake },
  { id: "services", label: "Servicios", title: "Servicios publicados", lead: "Revisá y eliminá servicios que no cumplen las reglas.", group: "Contenido", icon: Briefcase },
  { id: "spaces", label: "Espacios", title: "Espacios publicados", lead: "Revisá y eliminá espacios publicitarios que no cumplen las reglas.", group: "Contenido", icon: MapPin },
  { id: "badges", label: "Insignias", title: "Insignias", lead: "Creá distinciones y asignalas a perfiles.", group: "Contenido", icon: Medal },
  { id: "finance", label: "Finanzas", title: "Finanzas", lead: "Comisiones, disputas, fondos en custodia y reembolsos.", group: "Operación", icon: DollarSign },
  { id: "reports", label: "Reportes", title: "Reportes y soporte", lead: "Cola de reportes de contenido, tickets y contenido eliminado.", group: "Operación", icon: Flag },
  { id: "traffic", label: "Tráfico inusual", title: "Tráfico inusual", lead: "Registro de eventos de inspección detectados en el sitio.", group: "Operación", icon: ScanEye },
  { id: "settings", label: "Configuración", title: "Configuración", lead: "Anuncios, acceso, comisiones y auditoría de cambios.", group: "Sistema", icon: Settings },
];

export const ADMIN_GROUPS = ["General", "Personas", "Contenido", "Operación", "Sistema"] as const;
// creado por pato dev y askforvini
