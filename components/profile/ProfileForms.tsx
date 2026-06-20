"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar, Briefcase, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

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
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-4 rounded-2xl border border-border bg-bg-primary/50 relative group">
          <button onClick={() => removeItem(item.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Empresa</label>
              <input value={item.company} onChange={e => updateItem(item.id, 'company', e.target.value)} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white" placeholder="Ej. Google" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cargo</label>
              <input value={item.position} onChange={e => updateItem(item.id, 'position', e.target.value)} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white" placeholder="Ej. Senior Developer" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fecha de Inicio</label>
              <input type="date" value={item.startDate?.split('T')[0] || ''} onChange={e => updateItem(item.id, 'startDate', e.target.value)} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fecha de Fin</label>
              {item.currentJob ? (
                <div className="w-full bg-bg-secondary/40 border border-dashed border-border rounded-xl px-3 py-2 text-sm text-gray-600 italic">
                  Trabajo actual
                </div>
              ) : (
                <input type="date" value={item.endDate?.split('T')[0] || ''} onChange={e => updateItem(item.id, 'endDate', e.target.value)} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white" />
              )}
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 w-fit">
                <Checkbox 
                  id={`current-${item.id}`}
                  checked={item.currentJob} 
                  onCheckedChange={checked => updateItem(item.id, 'currentJob', !!checked)} 
                />
                <label htmlFor={`current-${item.id}`} className="text-sm text-gray-300 cursor-pointer select-none">Este es mi trabajo actual</label>
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" onClick={addItem} variant="outline" className="w-full border-dashed border-border py-6 hover:border-gold/50 hover:bg-gold/5">
        <Plus className="h-4 w-4 mr-2" /> Añadir Experiencia
      </Button>
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
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-4 rounded-2xl border border-border bg-bg-primary/50 relative group">
          <button onClick={() => removeItem(item.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Institución</label>
              <input value={item.institution} onChange={e => updateItem(item.id, 'institution', e.target.value)} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white" placeholder="Ej. Universidad Central" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Título</label>
              <input value={item.degree} onChange={e => updateItem(item.id, 'degree', e.target.value)} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white" placeholder="Ej. Licenciatura en Diseño" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Año Inicio</label>
                <input type="number" value={item.startYear} onChange={e => updateItem(item.id, 'startYear', parseInt(e.target.value))} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Año Fin</label>
                <input type="number" disabled={item.currentlyStudying} value={item.endYear || ''} onChange={e => updateItem(item.id, 'endYear', parseInt(e.target.value))} className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-white disabled:opacity-30" />
              </div>
            </div>
            <div className="md:col-span-2 mt-2">
              <div className="flex items-center gap-3 w-fit">
                <Checkbox 
                  id={`study-${item.id}`}
                  checked={item.currentlyStudying} 
                  onCheckedChange={checked => updateItem(item.id, 'currentlyStudying', !!checked)} 
                />
                <label htmlFor={`study-${item.id}`} className="text-sm text-gray-300 cursor-pointer select-none">Actualmente estudiando aquí</label>
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" onClick={addItem} variant="outline" className="w-full border-dashed border-border py-6">
        <Plus className="h-4 w-4 mr-2" /> Añadir Educación
      </Button>
    </div>
  );
}

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
      <div className="flex gap-2">
        <input 
          value={newSkill} 
          onChange={e => setNewSkill(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          className="flex-1 bg-bg-primary border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-gold outline-none" 
          placeholder="Escribe una habilidad... (Ej. React, Python)" 
        />
        <Select value={newLevel} onValueChange={setNewLevel}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASICO">Básico</SelectItem>
            <SelectItem value="INTERMEDIO">Medio</SelectItem>
            <SelectItem value="AVANZADO">Experto</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" onClick={addSkill} className="bg-gold text-black hover:bg-gold-light">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(skill => (
          <Badge key={skill.id} variant="gold" className="py-1.5 px-3 flex items-center gap-2">
            {skill.name} • <span className="text-[10px] opacity-70">{skill.level}</span>
            <button onClick={() => removeSkill(skill.id)} className="hover:text-white transition-colors">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
