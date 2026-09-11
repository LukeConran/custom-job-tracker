export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="block min-w-[14rem] flex-1">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-paper placeholder:text-paper-dim/55 focus:border-brass focus:outline-none"
      />
    </label>
  );
}
