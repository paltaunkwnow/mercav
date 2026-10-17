/** Roles y permisos de Mercav Business. Sin dependencias: se usa en servidor, cliente y tests. */

export type BusinessRoleKey = "OWNER" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE" | "ACCOUNTANT";

export type BusinessPermission =
  | "publicPage.edit"
  | "publicPage.publish"
  | "workspace.edit"
  | "members.manage"
  | "invites.manage"
  | "employees.view"
  | "employees.viewSensitive"
  | "employees.edit"
  | "payroll.view"
  | "payroll.edit"
  | "payroll.close"
  | "payroll.reopen"
  | "payroll.export"
  | "loyalty.manage"
  | "loyalty.view"
  | "loyalty.stamp"
  | "pos.sell"
  | "pos.void"
  | "pos.inventory"
  | "pos.reports"
  | "pos.configure";

const MATRIX: Record<BusinessPermission, BusinessRoleKey[]> = {
  "publicPage.edit": ["OWNER", "MANAGER"],
  "publicPage.publish": ["OWNER"],
  "workspace.edit": ["OWNER", "HR_ADMIN"],
  "members.manage": ["OWNER"],
  "invites.manage": ["OWNER", "HR_ADMIN"],
  "employees.view": ["OWNER", "HR_ADMIN", "MANAGER", "ACCOUNTANT"],
  // Salario, CI y cuenta bancaria.
  "employees.viewSensitive": ["OWNER", "HR_ADMIN", "ACCOUNTANT"],
  "employees.edit": ["OWNER", "HR_ADMIN"],
  "payroll.view": ["OWNER", "HR_ADMIN", "ACCOUNTANT"],
  "payroll.edit": ["OWNER", "HR_ADMIN"],
  "payroll.close": ["OWNER", "HR_ADMIN"],
  "payroll.reopen": ["OWNER"],
  "payroll.export": ["OWNER", "HR_ADMIN", "ACCOUNTANT"],
  // Fidelización: crear y editar programas, campañas y saldos.
  "loyalty.manage": ["OWNER", "HR_ADMIN"],
  // Ver clientes y estadísticas (datos personales de clientes: no el contador).
  "loyalty.view": ["OWNER", "HR_ADMIN", "MANAGER"],
  // Sellar y canjear en el mostrador.
  "loyalty.stamp": ["OWNER", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  // Caja: vender, abrir y cerrar la caja. Quien entra por invitación como trabajador ya puede vender.
  "pos.sell": ["OWNER", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  // Anular ventas (devuelve el stock).
  "pos.void": ["OWNER", "MANAGER"],
  // Productos, precios, stock y categorías.
  "pos.inventory": ["OWNER", "MANAGER"],
  // Ventas, costos y ganancia.
  "pos.reports": ["OWNER", "MANAGER", "ACCOUNTANT"],
  // Datos de la tienda, impuestos, medios de pago y PIN de la caja.
  "pos.configure": ["OWNER", "HR_ADMIN"],
};

export function can(role: BusinessRoleKey | null | undefined, permission: BusinessPermission) {
  return !!role && MATRIX[permission].includes(role);
}

export const ROLE_LABELS: Record<BusinessRoleKey, string> = {
  OWNER: "Dueño",
  HR_ADMIN: "RR.HH.",
  MANAGER: "Encargado",
  EMPLOYEE: "Trabajador",
  ACCOUNTANT: "Contador",
};

export const ROLE_HINTS: Record<BusinessRoleKey, string> = {
  OWNER: "Todo, incluidos roles y reapertura de planillas",
  HR_ADMIN: "Trabajadores, planillas e invitaciones",
  MANAGER: "Ve el directorio sin salarios; maneja la caja, el inventario y los reportes",
  EMPLOYEE: "Su legajo, sus boletas y vender en la caja",
  ACCOUNTANT: "Ve y exporta planillas, legajos y reportes de ventas, sin editar",
};

/** Lo mismo, dicho a quien recibe la invitación ("Vas a entrar como Trabajador: …"). */
export const ROLE_HINTS_FOR_INVITEE: Record<BusinessRoleKey, string> = {
  OWNER: "todo, incluidos roles y reapertura de planillas",
  HR_ADMIN: "trabajadores, planillas e invitaciones",
  MANAGER: "el directorio sin salarios, la caja, el inventario y los reportes",
  EMPLOYEE: "tu legajo, tus boletas y vender en la caja",
  ACCOUNTANT: "ver y exportar planillas, legajos y reportes de ventas, sin editar",
};

/** Roles que se pueden asignar por invitación o cambio de rol (OWNER no se regala). */
export const ASSIGNABLE_ROLES: BusinessRoleKey[] = ["HR_ADMIN", "MANAGER", "EMPLOYEE", "ACCOUNTANT"];
// creado por pato dev y askforvini
