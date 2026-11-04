import { z } from "zod";
import type { BusinessShift } from "@prisma/client";
import { isoDay } from "./format";

/** HH:mm format validation */
function validTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

const timeSchema = z.string().refine(validTime, "Hora inválida (formato HH:mm)");

const dateSchema = z.string().refine((v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Fecha inválida");

export const ShiftInputSchema = z.object({
  employeeId: z.string().min(1, "ID de empleado requerido"),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  shiftType: z.enum(["MATUTINO", "VESPERTINO", "NOCTURNO", "COMPLETO", "OTRO"]).default("OTRO"),
  notes: z.string().max(500).optional().nullable(),
}).refine((data) => {
  // Validate that endTime is after startTime
  const [startH, startM] = data.startTime.split(":").map(Number);
  const [endH, endM] = data.endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
}, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["endTime"],
});

export type ShiftInput = z.infer<typeof ShiftInputSchema>;

export const CreateShiftSchema = ShiftInputSchema;
export const UpdateShiftSchema = ShiftInputSchema.partial().extend({
  id: z.string().min(1),
});

/** Convert shift input to Prisma format */
export function shiftData(input: ShiftInput) {
  return {
    date: new Date(`${input.date}T00:00:00.000Z`),
    startTime: input.startTime,
    endTime: input.endTime,
    shiftType: input.shiftType,
    notes: input.notes || null,
  };
}

/**
 * Shift view with all information. Permission check happens at API level.
 */
export type ShiftView = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toShiftView(shift: BusinessShift & { employee: { firstName: string; lastName: string } }): ShiftView {
  return {
    id: shift.id,
    employeeId: shift.employeeId,
    employeeName: `${shift.employee.lastName} ${shift.employee.firstName}`.trim(),
    date: isoDay(shift.date),
    startTime: shift.startTime,
    endTime: shift.endTime,
    shiftType: shift.shiftType,
    notes: shift.notes,
    createdAt: shift.createdAt.toISOString(),
    updatedAt: shift.updatedAt.toISOString(),
  };
}

/** Check if two shifts overlap */
export function shiftsOverlap(
  shift1: { startTime: string; endTime: string },
  shift2: { startTime: string; endTime: string }
): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const shift1Start = toMinutes(shift1.startTime);
  const shift1End = toMinutes(shift1.endTime);
  const shift2Start = toMinutes(shift2.startTime);
  const shift2End = toMinutes(shift2.endTime);

  return shift1Start < shift2End && shift2Start < shift1End;
}
// creado por pato dev y askforvini
