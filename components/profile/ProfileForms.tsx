"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

const labelClass = "mb-2 block text-sm font-medium text-[var(--text-primary)]";
const itemClass = "relative rounded-[1.25rem] border border-[var(--mv-hairline)] bg-[var(--mv-panel)] p-4 sm:p-5";
const addClass =
  "mv-focus flex h-12 w-full items-center justify-center gap-2 rounded-[0.875rem] border border-dashed border-[var(--mv-hairline-strong)] text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--color-border-gold)] hover:text-[var(--text-primary)] active:scale-[0.99]";

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="mv-focus grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[var(--text-tertiary)] transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}

// --- Experiencia ---
export function ExperienceForm({ items, onChange }: { items: any[], onChange: (val: any[]) => void }) {
  const addItem = () => {
    onChange([...items, { id: crypto.randomUUID(), company: "", position: "", startDate: "", endDate: "", currentJob: false, description: "" }]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-[var(--text-secondary)]">Todavía no agregaste experiencia.</p>}
      {items.map((item, index) => (
        <div key={item.id} className={itemClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{item.position || item.company || `Experiencia ${index + 1}`}</p>
            <RemoveButton onClick={() => removeItem(item.id)} label="Quitar esta experiencia" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={`exp-company-${item.id}`} className={labelClass}>Empresa</label>
              <input id={`exp-company-${item.id}`} autoComplete="organization" value={item.company} onChange={e => updateItem(item.id, 'company', e.target.value)} className="mv-input" placeholder="Ej. Estudio Andino" />
            </div>
            <div>
              <label htmlFor={`exp-position-${item.id}`} className={labelClass}>Cargo</label>
              <input id={`exp-position-${item.id}`} autoComplete="organization-title" value={item.position} onChange={e => updateItem(item.id, 'position', e.target.value)} className="mv-input" placeholder="Ej. Desarrollador senior" />
            </div>
            <div>
              <label htmlFor={`exp-start-${item.id}`} className={labelClass}>Fecha de inicio</label>
              <input id={`exp-start-${item.id}`} type="date" value={item.startDate?.split('T')[0] || ''} onChange={e => updateItem(item.id, 'startDate', e.target.value)} className="mv-input mv-data" />
            </div>
            <div>
              <label htmlFor={`exp-end-${item.id}`} className={labelClass}>Fecha de fin</label>
              {item.currentJob ? (
                <div id={`exp-end-${item.id}`} className="flex h-12 items-center rounded-[0.875rem] border border-dashed border-[var(--mv-hairline-strong)] px-4 text-sm text-[var(--text-tertiary)]">
                  Trabajo actual
                </div>
              ) : (
                <input id={`exp-end-${item.id}`} type="date" value={item.endDate?.split('T')[0] || ''} onChange={e => updateItem(item.id, 'endDate', e.target.value)} className="mv-input mv-data" />
              )}
            </div>
            <div className="md:col-span-2">
              <div className="flex w-fit items-center gap-3">
                <Checkbox
                  id={`current-${item.id}`}
                  checked={item.currentJob}
                  onCheckedChange={checked => updateItem(item.id, 'currentJob', !!checked)}
                />
                <label htmlFor={`current-${item.id}`} className="cursor-pointer select-none text-sm text-[var(--text-secondary)]">Es mi trabajo actual</label>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className={addClass}>
        <Plus className="h-4 w-4" aria-hidden /> Agregar experiencia
      </button>
    </div>
  );
}

// --- Educación ---
export function EducationForm({ items, onChange }: { items: any[], onChange: (val: any[]) => void }) {
  const addItem = () => {
    onChange([...items, { id: crypto.randomUUID(), institution: "", degree: "", field: "", startYear: new Date().getFullYear(), endYear: null, currentlyStudying: false }]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-[var(--text-secondary)]">Todavía no agregaste formación.</p>}
      {items.map((item, index) => (
        <div key={item.id} className={itemClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{item.degree || item.institution || `Formación ${index + 1}`}</p>
            <RemoveButton onClick={() => removeItem(item.id)} label="Quitar esta formación" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor={`edu-inst-${item.id}`} className={labelClass}>Institución</label>
              <input id={`edu-inst-${item.id}`} value={item.institution} onChange={e => updateItem(item.id, 'institution', e.target.value)} className="mv-input" placeholder="Ej. Universidad Mayor de San Andrés" />
            </div>
            <div>
              <label htmlFor={`edu-degree-${item.id}`} className={labelClass}>Título</label>
              <input id={`edu-degree-${item.id}`} value={item.degree} onChange={e => updateItem(item.id, 'degree', e.target.value)} className="mv-input" placeholder="Ej. Licenciatura en Diseño" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`edu-start-${item.id}`} className={labelClass}>Inicio</label>
                <input id={`edu-start-${item.id}`} type="number" inputMode="numeric" value={item.startYear} onChange={e => updateItem(item.id, 'startYear', parseInt(e.target.value))} className="mv-input mv-data" />
              </div>
              <div>
                <label htmlFor={`edu-end-${item.id}`} className={labelClass}>Fin</label>
                <input id={`edu-end-${item.id}`} type="number" inputMode="numeric" disabled={item.currentlyStudying} value={item.endYear || ''} onChange={e => updateItem(item.id, 'endYear', parseInt(e.target.value))} className="mv-input mv-data disabled:opacity-40" />
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex w-fit items-center gap-3">
                <Checkbox
                  id={`study-${item.id}`}
                  checked={item.currentlyStudying}
                  onCheckedChange={checked => updateItem(item.id, 'currentlyStudying', !!checked)}
                />
                <label htmlFor={`study-${item.id}`} className="cursor-pointer select-none text-sm text-[var(--text-secondary)]">Estoy estudiando acá actualmente</label>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className={addClass}>
        <Plus className="h-4 w-4" aria-hidden /> Agregar formación
      </button>
    </div>
  );
}

const LEVEL_LABEL: Record<string, string> = { BASICO: "Básico", INTERMEDIO: "Medio", AVANZADO: "Experto" };

// --- Habilidades (Skills) ---
export function SkillsForm({ items, onChange }: { items: any[], onChange: (val: any[]) => void }) {
  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState("INTERMEDIO");

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (items.some(s => s.name.toLowerCase() === newSkill.toLowerCase())) return;
    onChange([...items, { id: crypto.randomUUID(), name: newSkill, level: newLevel }]);
    setNewSkill("");
  };

  const removeSkill = (id: string) => {
    onChange(items.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="skill-new" className="sr-only">Nueva habilidad</label>
        <input
          id="skill-new"
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          className="mv-input flex-1"
          placeholder="Ej. React, Python, Ventas"
        />
        <div className="flex gap-2">
          <Select value={newLevel} onValueChange={setNewLevel}>
            <SelectTrigger className="h-12 flex-1 rounded-[0.875rem] sm:w-36" aria-label="Nivel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASICO">Básico</SelectItem>
              <SelectItem value="INTERMEDIO">Medio</SelectItem>
              <SelectItem value="AVANZADO">Experto</SelectItem>
            </SelectContent>
          </Select>
          <button type="button" onClick={addSkill} aria-label="Agregar habilidad" className="mv-btn mv-btn-primary h-12 w-12 shrink-0 px-0">
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      {items.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {items.map(skill => (
            <li key={skill.id} className="mv-chip mv-chip-gold h-9 gap-2 pl-3 pr-1 text-[13px]">
              {skill.name}
              <span className="font-medium opacity-70">{LEVEL_LABEL[skill.level] || skill.level}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                aria-label={`Quitar ${skill.name}`}
                className="mv-focus grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-black/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Todavía no agregaste habilidades.</p>
      )}
    </div>
  );
}
// creado por pato dev y askforvini
