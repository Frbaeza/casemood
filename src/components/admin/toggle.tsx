"use client";

/** Interruptor grande con texto (checkbox accesible con estilo de switch). */
export function Toggle({
  checked,
  onChange,
  label,
  descripcion,
  name,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  descripcion?: string;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex min-h-12 cursor-pointer items-center justify-between gap-4 ${disabled ? "opacity-50" : ""}`}>
      <span className="min-w-0">
        <span className="block text-base font-semibold">{label}</span>
        {descripcion && <span className="block text-sm text-ink-soft">{descripcion}</span>}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-8 w-14 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand" />
        <span className="absolute left-1 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-6" />
        <span className="ml-2 w-6 text-sm font-semibold text-ink-soft" aria-hidden>
          {checked ? "Sí" : "No"}
        </span>
      </span>
    </label>
  );
}
