"use client";

import { useMemo, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFiltering, setIsFiltering] = useState(false);

  const filteredOptions = useMemo(() => {
    if (!isFiltering) {
      return options.slice(0, 12);
    }
    const keyword = value.trim().toLowerCase();
    const base = keyword.length === 0 ? options : options.filter((item) => item.toLowerCase().includes(keyword));
    return base.slice(0, 12);
  }, [isFiltering, options, value]);

  function selectOption(option: string) {
    onChange(option);
    setIsFiltering(false);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <label className="stack segmentation-picker">
      <span className="eyebrow">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setIsFiltering(false);
          setOpen(options.length > 0);
        }}
        onBlur={() =>
          window.setTimeout(() => {
            setOpen(false);
            setIsFiltering(false);
          }, 120)
        }
        onChange={(event) => {
          onChange(event.target.value);
          setIsFiltering(true);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={(event) => {
          if (!open || filteredOptions.length === 0) {
            if (event.key === "Escape") {
              setOpen(false);
            }
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const pick = filteredOptions[activeIndex] ?? filteredOptions[0];
            if (pick) {
              selectOption(pick);
            }
            return;
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open ? (
        <ul className="segmentation-suggestion-list">
          {filteredOptions.map((item, index) => (
            <li key={`${label}-${item}`}>
              <button
                type="button"
                className={`suggestion-item${index === activeIndex ? " active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(item)}
              >
                <span>{item}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
