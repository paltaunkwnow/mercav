import { test } from "node:test";
import assert from "node:assert/strict";
import { EmployeeInputSchema, employeeUpdateData, toEmployeeView } from "../employees";
import { encryptField } from "../crypto";

process.env.NEXTAUTH_SECRET ||= "test-secret";

const valid = {
  firstName: "Ana",
  lastName: "Rojas",
  hireDate: "2020-03-15",
  contractType: "INDEFINIDO",
  baseSalary: "5000.456",
  ci: "9000001",
  bankAccount: "",
};

test("fechas que no existen o fuera de rango se rechazan", () => {
  assert.equal(EmployeeInputSchema.safeParse(valid).success, true);
  for (const hireDate of ["2026-02-30", "2026-13-01", "0001-01-01", "2999-01-01", "15/03/2020"]) {
    assert.equal(EmployeeInputSchema.safeParse({ ...valid, hireDate }).success, false, hireDate);
  }
  assert.equal(EmployeeInputSchema.safeParse({ ...valid, birthDate: "2999-01-01" }).success, false);
});

test("el haber básico se redondea a centavos", () => {
  const parsed = EmployeeInputSchema.parse(valid);
  assert.equal(parsed.baseSalary, 5000.46);
});

const row = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "e1",
    workspaceId: "w1",
    userId: null,
    firstName: "Ana",
    lastName: "Rojas",
    ciEnc: encryptField("9000001"),
    ciExt: "SC",
    birthDate: null,
    sex: "F",
    nationality: null,
    email: "ana@example.com",
    phone: null,
    position: "Cajera",
    hireDate: new Date("2020-03-15T00:00:00Z"),
    endDate: null,
    contractType: "INDEFINIDO",
    baseSalary: 5000,
    bankName: "Banco",
    bankAccountEnc: "v1:basura:basura:basura",
    nua: "123",
    cnsNumber: "456",
    status: "ACTIVE",
    notes: "nota interna",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as never;

test("la vista sin permiso no lleva datos personales ni notas", () => {
  const view = toEmployeeView(row(), false) as unknown as Record<string, unknown>;
  assert.equal(view.sensitive, null);
  for (const key of ["notes", "nua", "cnsNumber", "email", "phone", "birthDate", "bankName", "sex"]) assert.equal(key in view, false, key);
});

test("documento sin cambios o ilegible se conserva al guardar", () => {
  const before = row();
  const input = EmployeeInputSchema.parse({ ...valid, ci: "9000001", bankAccount: "" });
  const data = employeeUpdateData(before, input);
  assert.equal(data.ciEnc, (before as { ciEnc: string }).ciEnc, "mismo CI: mismo cifrado");
  assert.equal(data.bankAccountEnc, "v1:basura:basura:basura", "cuenta ilegible y campo vacío: se conserva");
  const changed = employeeUpdateData(before, EmployeeInputSchema.parse({ ...valid, ci: "9000002", bankAccount: "111" }));
  assert.notEqual(changed.ciEnc, (before as { ciEnc: string }).ciEnc);
  assert.ok(changed.bankAccountEnc?.startsWith("v1:"));
  const view = toEmployeeView(before, true);
  assert.equal(view.sensitive?.bankUnreadable, true);
  assert.equal(view.sensitive?.ciUnreadable, false);
});
// creado por pato dev y askforvini
