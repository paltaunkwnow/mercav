"use client";

import { useId, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AlertTriangle, ImagePlus, Lock, Plus, Trash2, X } from "@/components/icons";
import { LoyaltyIcon } from "@/components/business/loyalty/icons";
import { Field, Notice } from "@/components/business/ui";
import { BENEFITS, BENEFIT_KEYS, BUSINESS_TYPES, ICON_KEYS, PALETTES, contrastRatio, resolvePalette } from "@/lib/business/loyalty/templates";
import { pointsForPurchase } from "@/lib/business/loyalty/engine";
import type { BenefitKey, LoyaltyIconKey, LoyaltyTier, PaletteKey } from "@/lib/business/loyalty/types";
import { formatMoney } from "@/lib/geo/latam";
import { cn } from "@/lib/utils";
import { CharCount, NumberInput, Section, Segmented, Switch, optionCard } from "./controls";
import { EXPIRY_PRESETS, MAX_BENEFITS, MAX_REWARDS, MAX_TIERS, draftFromTemplate, newKey, setStampsGoal, switchType, type ProgramDraft, type RewardDraft } from "./editor-state";
import { processLogo } from "./images";

/*
 * Partes del editor de programas. Las usa el asistente (un paso por vez) y Ajustes (todas juntas).
 */

export type EditorProps = {
  draft: ProgramDraft;
  setDraft: Dispatch<SetStateAction<ProgramDraft>>;
  workspaceName: string;
  country: string;
  currency: string;
};

const ICON_LABELS: Record<LoyaltyIconKey, string> = {
  coffee: "Café",
  croissant: "Medialuna",
  utensils: "Cubiertos",
  pizza: "Pizza",
  icecream: "Helado",
  beer: "Cerveza",
  scissors: "Tijera",
  sparkles: "Brillos",
  dumbbell: "Pesa",
  car: "Auto",
  shirt: "Camisa",
  pill: "Pastilla",
  flower: "Flor",
  bag: "Bolsa",
  book: "Libro",
  paw: "Huella",
  "star-of-david": "Estrella de David",
  store: "Tienda",
};

const unit = (draft: ProgramDraft, n = 2) => (draft.type === "STAMPS" ? (n === 1 ? "sello" : "sellos") : n === 1 ? "punto" : "puntos");

function currencySymbol(country: string, currency: string) {
  try {
    return new Intl.NumberFormat(`es-${country}`, { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

/* ───────────────────────────── Rubro ───────────────────────────── */

export function RubroSection({ draft, setDraft, workspaceName, mode }: EditorProps & { mode: "create" | "edit" }) {
  const name = useId();
  return (
    <Section
      id="rubro"
      title={mode === "create" ? "¿Qué tipo de negocio tenés?" : "Rubro"}
      description={
        mode === "create"
          ? "Elegí el más parecido. Te sugerimos premio, reglas y diseño, y después podés cambiar todo."
          : "Cambiar el rubro solo cambia el ícono sugerido. Tus reglas, premios y diseño quedan como están."
      }
    >
      <fieldset>
        <legend className="sr-only">Rubro</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {BUSINESS_TYPES.map((t) => {
            const hint = t.type === "STAMPS" ? `${t.goal} sellos · ${t.rewardName}` : `Puntos · ${t.rewardName}`;
            return (
              <label key={t.key} className="relative">
                <input
                  type="radio"
                  name={name}
                  value={t.key}
                  checked={draft.businessType === t.key}
                  onChange={() =>
                    setDraft((d) => (mode === "create" ? draftFromTemplate(t.key, workspaceName, d) : { ...d, businessType: t.key, design: { ...d.design, icon: t.icon } }))
                  }
                  className="peer sr-only"
                />
                <span className={cn(optionCard, "flex-col gap-2 p-3")}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/10 text-gold">
                    <LoyaltyIcon name={t.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold leading-tight text-[var(--text-primary)]">{t.label}</span>
                  {mode === "create" ? <span className="text-xs leading-snug text-[var(--text-secondary)]">{hint}</span> : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Section>
  );
}

/* ───────────────────────────── Programa ───────────────────────────── */

function RewardRow({
  reward,
  index,
  draft,
  canRemove,
  showActive,
  onChange,
  onRemove,
}: {
  reward: RewardDraft;
  index: number;
  draft: ProgramDraft;
  canRemove: boolean;
  showActive: boolean;
  onChange: (patch: Partial<RewardDraft>) => void;
  onRemove: () => void;
}) {
  const base = `reward-${index}`;
  return (
    <li className={cn("flex flex-col gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4", !reward.active && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("mv-chip", index === 0 && "mv-chip-gold")}>{index === 0 ? "Premio principal" : `Premio ${index + 1}`}</span>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="mv-focus inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Quitar<span className="sr-only"> {reward.name || `premio ${index + 1}`}</span>
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Field label="Premio" htmlFor={`${base}-name`}>
          <input
            id={`${base}-name`}
            value={reward.name}
            maxLength={60}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Café gratis"
            className="mv-input h-11"
            autoComplete="off"
          />
        </Field>
        <Field label={`Cuesta (${unit(draft)})`} htmlFor={`${base}-cost`}>
          <NumberInput id={`${base}-cost`} value={reward.cost} min={1} max={1_000_000} onChange={(cost) => onChange({ cost })} />
        </Field>
      </div>
      <Field label="Detalle (opcional)" htmlFor={`${base}-desc`}>
        <input
          id={`${base}-desc`}
          value={reward.description}
          maxLength={140}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Cualquier café de la carta, tamaño mediano"
          className="mv-input h-11"
          autoComplete="off"
        />
      </Field>
      {showActive ? (
        <Switch
          id={`${base}-active`}
          checked={reward.active}
          onChange={(active) => onChange({ active })}
          label="Disponible para canjear"
          hint={reward.active ? "Tus clientes lo ven en su tarjeta." : "Queda guardado pero nadie lo puede canjear."}
        />
      ) : null}
    </li>
  );
}

export function ProgramSection({ draft, setDraft, country, currency, mode, lockType }: EditorProps & { mode: "create" | "edit"; lockType?: boolean }) {
  const symbol = currencySymbol(country, currency);
  const sample = draft.rules.unitAmount * 8 + Math.round(draft.rules.unitAmount / 2);
  const updateReward = (key: string, patch: Partial<RewardDraft>) => setDraft((d) => ({ ...d, rewards: d.rewards.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const removeReward = (key: string) => setDraft((d) => ({ ...d, rewards: d.rewards.filter((r) => r.key !== key) }));
  const addReward = () =>
    setDraft((d) => {
      const top = Math.max(...d.rewards.map((r) => r.cost), d.type === "STAMPS" ? d.rules.stampsGoal : 100);
      return { ...d, rewards: [...d.rewards, { key: newKey(), name: "", cost: d.type === "STAMPS" ? top : top * 2, description: "", active: true }] };
    });

  return (
    <Section id="programa" title="Programa" description="Cómo suman tus clientes y qué se pueden llevar.">
      <Field label="Nombre del programa" htmlFor="program-name" hint="Lo ven tus clientes al sumarse. Por ejemplo: Club del café.">
        <input
          id="program-name"
          value={draft.name}
          maxLength={60}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          className="mv-input h-11"
          autoComplete="off"
        />
      </Field>

      <Segmented
        name="program-type"
        legend="¿Cómo suman?"
        value={draft.type}
        disabled={lockType}
        onChange={(type) => setDraft((d) => switchType(d, type))}
        options={[
          { value: "STAMPS", label: "Sellos por visita" },
          { value: "POINTS", label: "Puntos por compra" },
        ]}
        hint={
          lockType ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" aria-hidden />
              Ya hay clientes con saldo, así que no se puede cambiar entre sellos y puntos. Si querés otro tipo, creá un programa nuevo.
            </span>
          ) : draft.type === "STAMPS" ? (
            "Ideal si tus clientes compran seguido algo parecido: café, corte, lavado."
          ) : (
            "Ideal si los montos varían mucho: más compra, más puntos."
          )
        }
      />

      {draft.type === "STAMPS" ? (
        <Field label="Sellos para el premio principal" htmlFor="stamps-goal" hint="Entre 2 y 30. Lo más común es entre 6 y 10.">
          <NumberInput id="stamps-goal" value={draft.rules.stampsGoal} min={2} max={30} onChange={(goal) => setDraft((d) => setStampsGoal(d, goal))} className="max-w-[10rem]" />
        </Field>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">Puntos por compra</legend>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <NumberInput
              id="points-per-unit"
              label="Puntos"
              value={draft.rules.pointsPerUnit}
              min={1}
              max={1000}
              onChange={(pointsPerUnit) => setDraft((d) => ({ ...d, rules: { ...d.rules, pointsPerUnit } }))}
              className="w-24"
            />
            <span>{draft.rules.pointsPerUnit === 1 ? "punto" : "puntos"} por cada</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold text-[var(--text-primary)]">{symbol}</span>
              <NumberInput
                id="unit-amount"
                label={`Monto de compra en ${currency}`}
                value={draft.rules.unitAmount}
                min={1}
                max={1_000_000}
                onChange={(unitAmount) => setDraft((d) => ({ ...d, rules: { ...d.rules, unitAmount } }))}
                className="w-32"
              />
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Ejemplo: una compra de {formatMoney(sample, country, currency)} suma {pointsForPurchase(sample, draft.rules)} puntos.
          </p>
        </fieldset>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Premios</h3>
          <span className="text-xs text-[var(--text-tertiary)]">
            {draft.rewards.length}/{MAX_REWARDS}
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {draft.rewards.map((r, i) => (
            <RewardRow
              key={r.key}
              reward={r}
              index={i}
              draft={draft}
              canRemove={draft.rewards.length > 1}
              showActive={mode === "edit" && !!r.id}
              onChange={(patch) => updateReward(r.key, patch)}
              onRemove={() => removeReward(r.key)}
            />
          ))}
        </ul>
        {draft.rewards.length < MAX_REWARDS ? (
          <button type="button" onClick={addReward} className="mv-btn mv-btn-ghost mv-btn-sm w-fit">
            <Plus className="h-4 w-4" aria-hidden />
            Agregar otro premio
          </button>
        ) : null}
        {mode === "edit" ? <p className="text-xs text-[var(--text-secondary)]">Si quitás un premio que alguien ya canjeó, no se borra: queda desactivado para no perder el historial.</p> : null}
      </div>
    </Section>
  );
}

/* ───────────────────────────── Diseño ───────────────────────────── */

const PALETTE_OPTIONS = (Object.keys(PALETTES) as Exclude<PaletteKey, "custom">[]).map((key) => ({ key, ...PALETTES[key] }));

function ColorInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(value);
  }
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (selector)`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mv-focus h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-[var(--mv-hairline-strong)] bg-transparent p-1"
        />
        <input
          id={id}
          value={text}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.trim();
            setText(v);
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toLowerCase());
          }}
          className="mv-input h-11 font-mono text-sm uppercase"
          autoComplete="off"
        />
      </div>
    </Field>
  );
}

export function DesignSection({ draft, setDraft, workspaceName }: EditorProps) {
  const paletteName = useId();
  const iconName = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const d = draft.design;
  const custom = d.palette === "custom";
  const base = d.base ?? PALETTES.noche.base;
  const accent = d.accent ?? PALETTES.noche.accent;
  const ratio = custom ? contrastRatio(accent, base) : null;
  const setDesign = (patch: Partial<ProgramDraft["design"]>) => setDraft((x) => ({ ...x, design: { ...x.design, ...patch } }));
  const toggleBenefit = (key: BenefitKey) =>
    setDraft((x) => {
      const has = x.design.benefits.includes(key);
      if (!has && x.design.benefits.length >= MAX_BENEFITS) return x;
      return { ...x, design: { ...x.design, benefits: has ? x.design.benefits.filter((b) => b !== key) : [...x.design.benefits, key] } };
    });

  async function onLogo(file: File | undefined) {
    if (!file) return;
    setLogoBusy(true);
    setLogoError(null);
    const result = await processLogo(file);
    setLogoBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!result.ok) return setLogoError(result.error);
    setDesign({ logoDataUrl: result.dataUrl });
  }

  return (
    <Section id="diseno" title="Diseño de la tarjeta" description="Así la ven tus clientes en el celular. Probá colores y mirá la vista previa.">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Colores</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PALETTE_OPTIONS.map((p) => (
            <label key={p.key} className="relative">
              <input type="radio" name={paletteName} checked={d.palette === p.key} onChange={() => setDesign({ palette: p.key })} className="peer sr-only" />
              <span className={cn(optionCard, "items-center gap-2.5 p-2.5")}>
                <span aria-hidden className="relative h-8 w-8 shrink-0 rounded-full border border-black/10" style={{ background: p.base }}>
                  <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full" style={{ background: p.accent }} />
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{p.label}</span>
              </span>
            </label>
          ))}
          <label className="relative">
            <input
              type="radio"
              name={paletteName}
              checked={custom}
              onChange={() => setDesign({ palette: "custom", base: d.base ?? PALETTES.noche.base, accent: d.accent ?? PALETTES.noche.accent })}
              className="peer sr-only"
            />
            <span className={cn(optionCard, "items-center gap-2.5 p-2.5")}>
              <span
                aria-hidden
                className="h-8 w-8 shrink-0 rounded-full border border-black/10"
                style={{ background: "conic-gradient(#d4af37, #e3b3a2, #a9c8e8, #cdb67a, #d4af37)" }}
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Personalizado</span>
            </span>
          </label>
        </div>
      </fieldset>

      {custom ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorInput id="color-base" label="Fondo" value={base} onChange={(v) => setDesign({ base: v })} />
            <ColorInput id="color-accent" label="Detalles" value={accent} onChange={(v) => setDesign({ accent: v })} />
          </div>
          {ratio !== null && ratio < 3 ? (
            <Notice tone="warn">
              Los detalles casi no se distinguen del fondo (contraste {ratio.toFixed(1)}:1). Probá un color más claro o más oscuro para que se lea bien.
            </Notice>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--text-primary)]">Logo</span>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--mv-hairline)]"
            style={{ background: resolvePalette(d).base }}
          >
            {d.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.logoDataUrl} alt="Logo actual" className="h-full w-full object-contain p-1.5" />
            ) : (
              <LoyaltyIcon name={d.icon} className="h-7 w-7 text-gold" />
            )}
          </span>
          <input
            ref={fileRef}
            id="logo-file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => void onLogo(e.target.files?.[0])}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={logoBusy} className="mv-btn mv-btn-secondary mv-btn-sm">
            <ImagePlus className="h-4 w-4" aria-hidden />
            {logoBusy ? "Procesando…" : d.logoDataUrl ? "Cambiar logo" : "Subir logo"}
          </button>
          {d.logoDataUrl ? (
            <button type="button" onClick={() => setDesign({ logoDataUrl: null })} className="mv-btn mv-btn-ghost mv-btn-sm">
              <X className="h-4 w-4" aria-hidden />
              Quitar
            </button>
          ) : null}
        </div>
        <p className="text-xs text-[var(--text-secondary)]">PNG con fondo transparente queda mejor. Lo achicamos solo. Sin logo, va el ícono del rubro.</p>
        {logoError ? (
          <p role="alert" className="text-xs text-red-500">
            {logoError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre en la tarjeta" htmlFor="design-name" hint={<CharCount value={d.displayName} max={40} />}>
          <input
            id="design-name"
            value={d.displayName}
            maxLength={40}
            placeholder={workspaceName}
            onChange={(e) => setDesign({ displayName: e.target.value })}
            className="mv-input h-11"
            autoComplete="off"
          />
        </Field>
        <Field label="Subtítulo" htmlFor="design-subtitle" hint={<CharCount value={d.subtitle} max={40} />}>
          <input
            id="design-subtitle"
            value={d.subtitle}
            maxLength={40}
            placeholder="Tarjeta de fidelización"
            onChange={(e) => setDesign({ subtitle: e.target.value })}
            className="mv-input h-11"
            autoComplete="off"
          />
        </Field>
        <Field label="Título del reverso" htmlFor="design-back" hint={<CharCount value={d.backTitle} max={40} />} className="sm:col-span-2">
          <input
            id="design-back"
            value={d.backTitle}
            maxLength={40}
            placeholder="Acumulá más beneficios"
            onChange={(e) => setDesign({ backTitle: e.target.value })}
            className="mv-input h-11"
            autoComplete="off"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Beneficios del reverso</legend>
        <p className="mb-2 text-xs text-[var(--text-secondary)]" aria-live="polite">
          Elegí hasta {MAX_BENEFITS}. Llevás {d.benefits.length}.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {BENEFIT_KEYS.map((key) => {
            const checked = d.benefits.includes(key);
            return (
              <label key={key} className="relative">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && d.benefits.length >= MAX_BENEFITS}
                  onChange={() => toggleBenefit(key)}
                  className="peer sr-only"
                />
                <span className={cn(optionCard, "items-center gap-2 p-2.5")}>
                  <LoyaltyIcon name={key} className="h-4 w-4 shrink-0 text-gold" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{BENEFITS[key].label}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Ícono de los sellos</legend>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
          {ICON_KEYS.map((key) => (
            <label key={key} className="relative" title={ICON_LABELS[key]}>
              <input type="radio" name={iconName} checked={d.icon === key} onChange={() => setDesign({ icon: key })} className="peer sr-only" />
              <span className={cn(optionCard, "aspect-square items-center justify-center")}>
                <LoyaltyIcon name={key} className="h-5 w-5 text-[var(--text-primary)]" />
                <span className="sr-only">{ICON_LABELS[key]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </Section>
  );
}

/* ───────────────────────────── Extras ───────────────────────────── */

export function ExtrasSection({ draft, setDraft }: EditorProps) {
  const r = draft.rules;
  const u = unit(draft);
  const [customExpiry, setCustomExpiry] = useState(r.expiresDays !== null && !EXPIRY_PRESETS.includes(r.expiresDays as (typeof EXPIRY_PRESETS)[number]));
  const setRules = (patch: Partial<ProgramDraft["rules"]>) => setDraft((x) => ({ ...x, rules: { ...x.rules, ...patch } }));
  const setTier = (i: number, patch: Partial<LoyaltyTier>) => setRules({ tiers: r.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const expiryValue = r.expiresDays === null ? "none" : customExpiry ? "custom" : String(r.expiresDays);
  const lastTier = r.tiers[r.tiers.length - 1];

  return (
    <Section id="extras" title="Extras" description="Regalos, vencimiento, niveles y cuidados contra el mal uso. Todo es opcional.">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Regalos automáticos</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={`Bienvenida (${u})`} htmlFor="bonus-welcome" hint="Al sumarse.">
            <NumberInput id="bonus-welcome" value={r.welcomeBonus} min={0} max={10_000} onChange={(welcomeBonus) => setRules({ welcomeBonus })} />
          </Field>
          <Field label={`Cumpleaños (${u})`} htmlFor="bonus-birthday" hint="Una vez por año, si dejó su fecha.">
            <NumberInput id="bonus-birthday" value={r.birthdayBonus} min={0} max={10_000} onChange={(birthdayBonus) => setRules({ birthdayBonus })} />
          </Field>
          <Field label={`Invitar a un amigo (${u})`} htmlFor="bonus-referral" hint="Cuando el amigo suma por primera vez.">
            <NumberInput id="bonus-referral" value={r.referralBonus} min={0} max={10_000} onChange={(referralBonus) => setRules({ referralBonus })} />
          </Field>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Vencimiento del saldo" htmlFor="expiry" hint="El saldo se pierde si el cliente no viene en ese tiempo.">
          <select
            id="expiry"
            value={expiryValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "none") {
                setCustomExpiry(false);
                setRules({ expiresDays: null });
              } else if (v === "custom") {
                setCustomExpiry(true);
                setRules({ expiresDays: r.expiresDays ?? 120 });
              } else {
                setCustomExpiry(false);
                setRules({ expiresDays: Number(v) });
              }
            }}
            className="mv-input h-11"
          >
            <option value="none">No vence</option>
            {EXPIRY_PRESETS.map((days) => (
              <option key={days} value={String(days)}>
                {days === 365 ? "1 año sin visitas" : `${days} días sin visitas`}
              </option>
            ))}
            <option value="custom">Otro plazo</option>
          </select>
        </Field>
        {customExpiry && r.expiresDays !== null ? (
          <Field label="Días sin visitas" htmlFor="expiry-days" hint="Entre 7 y 3650.">
            <NumberInput id="expiry-days" value={r.expiresDays} min={7} max={3650} onChange={(expiresDays) => setRules({ expiresDays })} />
          </Field>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Niveles</h3>
          <p className="text-xs text-[var(--text-secondary)]">Por {u} acumulados en total (no bajan al canjear). Por ejemplo: Plata desde 20, Oro desde 50.</p>
        </div>
        {r.tiers.length ? (
          <ul className="flex flex-col gap-2">
            {r.tiers.map((t, i) => (
              <li key={i} className="grid gap-2 rounded-2xl border border-[var(--mv-hairline)] p-3 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1.4fr)_auto] sm:items-end">
                <Field label="Nivel" htmlFor={`tier-${i}-name`}>
                  <input id={`tier-${i}-name`} value={t.name} maxLength={30} onChange={(e) => setTier(i, { name: e.target.value })} placeholder="Oro" className="mv-input h-11" autoComplete="off" />
                </Field>
                <Field label={`Desde (${u})`} htmlFor={`tier-${i}-min`}>
                  <NumberInput id={`tier-${i}-min`} value={t.minLifetime} min={1} max={1_000_000} onChange={(minLifetime) => setTier(i, { minLifetime })} />
                </Field>
                <Field label="Beneficio" htmlFor={`tier-${i}-perk`}>
                  <input id={`tier-${i}-perk`} value={t.perk} maxLength={80} onChange={(e) => setTier(i, { perk: e.target.value })} placeholder="10 % en tu cumpleaños" className="mv-input h-11" autoComplete="off" />
                </Field>
                <button
                  type="button"
                  onClick={() => setRules({ tiers: r.tiers.filter((_, j) => j !== i) })}
                  className="mv-focus inline-flex h-11 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  <span className="sm:sr-only">Quitar nivel {t.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {r.tiers.length < MAX_TIERS ? (
          <button
            type="button"
            onClick={() => setRules({ tiers: [...r.tiers, { name: "", minLifetime: lastTier ? lastTier.minLifetime * 2 : draft.type === "STAMPS" ? 20 : 500, perk: "" }] })}
            className="mv-btn mv-btn-ghost mv-btn-sm w-fit"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar nivel
          </button>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Cuidados contra el mal uso</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={`Máximo por vez (${u})`} htmlFor="max-action" hint="Lo más que un cajero suma de una.">
            <NumberInput id="max-action" value={r.maxPerAction} min={1} max={100_000} onChange={(maxPerAction) => setRules({ maxPerAction })} />
          </Field>
          <Field label={`Máximo por día (${u})`} htmlFor="max-day" hint="Por tarjeta, contando todo el día.">
            <NumberInput id="max-day" value={r.maxPerDay} min={1} max={1_000_000} onChange={(maxPerDay) => setRules({ maxPerDay })} />
          </Field>
          <Field label="Espera entre sumas (min)" htmlFor="cooldown" hint="0 = sin espera.">
            <NumberInput id="cooldown" value={r.cooldownMinutes} min={0} max={1440} onChange={(cooldownMinutes) => setRules({ cooldownMinutes })} />
          </Field>
        </div>
        {r.maxPerDay < r.maxPerAction ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            El máximo por día tiene que ser igual o mayor que el máximo por vez.
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--mv-hairline)] p-4">
        <Switch
          id="self-service"
          checked={r.selfService && draft.type === "STAMPS"}
          disabled={draft.type !== "STAMPS"}
          onChange={(selfService) => setRules({ selfService })}
          label="Autoservicio en el mostrador"
          hint={
            draft.type === "STAMPS"
              ? "Una tablet muestra un QR que cambia cada 30 segundos. El cliente lo escanea y suma su sello solo."
              : "Solo para programas de sellos."
          }
        />
        {r.selfService && draft.type === "STAMPS" ? (
          <Field label="Sellos por autoservicio por día" htmlFor="self-max" hint="Por tarjeta. Entre 1 y 10.">
            <NumberInput id="self-max" value={r.selfServiceMaxPerDay} min={1} max={10} onChange={(selfServiceMaxPerDay) => setRules({ selfServiceMaxPerDay })} className="max-w-[10rem]" />
          </Field>
        ) : null}
      </div>
    </Section>
  );
}
// creado por pato dev y askforvini
