"use client";

type SegmentationOptionInputProps = {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function SegmentationOptionInput({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false
}: SegmentationOptionInputProps) {
  const safeValue = value === "" || options.includes(value) ? value : "";

  return (
    <label className="stack segmentation-picker">
      <span className="eyebrow">{label}</span>
      <select
        value={safeValue}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder ?? "Select…"}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
