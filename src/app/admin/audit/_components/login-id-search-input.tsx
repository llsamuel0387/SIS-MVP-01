"use client";

import { useEffect, useState } from "react";
import { useAccountSearchSuggestions } from "@/app/admin/accounts/manage/_hooks/use-account-search-suggestions";
import type { AccountSuggestion } from "@/lib/admin-accounts-client";

type Props = {
  value: string;
  onSelect: (loginId: string) => void;
};

const INPUT_STYLE: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: "0.875rem",
  borderRadius: "4px",
  border: "1px solid var(--color-border, #d1d5db)",
  minWidth: "14rem",
  width: "14rem"
};

export default function LoginIdSearchInput({ value, onSelect }: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [searchQuery, setSearchQuery] = useState(value);
  const { suggestions, suggestionsOpen, suggestionIndex, setSuggestionsOpen, setSuggestionIndex } =
    useAccountSearchSuggestions("ALL", searchQuery);

  // Sync when parent clears the value
  useEffect(() => {
    if (!value) { setInputValue(""); setSearchQuery(""); }
  }, [value]);

  function selectSuggestion(item: AccountSuggestion) {
    setInputValue(item.loginId);
    setSearchQuery(""); // prevents hook from re-fetching with the new inputValue
    onSelect(item.loginId);
    setSuggestionsOpen(false);
    setSuggestionIndex(-1);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={inputValue}
        placeholder="Login ID or name..."
        style={INPUT_STYLE}
        onChange={(e) => {
          setInputValue(e.target.value);
          setSearchQuery(e.target.value);
          if (!e.target.value.trim()) onSelect("");
        }}
        onFocus={() => setSuggestionsOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
        onKeyDown={(e) => {
          if (!suggestionsOpen || suggestions.length === 0) {
            if (e.key === "Escape") setSuggestionsOpen(false);
            if (e.key === "Enter") { setSearchQuery(""); onSelect(inputValue.trim()); }
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            const pick = suggestions[suggestionIndex] ?? suggestions[0];
            if (pick) selectSuggestion(pick);
            return;
          }
          if (e.key === "Escape") setSuggestionsOpen(false);
        }}
      />
      {suggestionsOpen ? (
        <ul className="suggestion-list" style={{ position: "absolute", zIndex: 50, minWidth: "100%", top: "calc(100% + 4px)", left: 0 }}>
          {suggestions.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={`suggestion-item${index === suggestionIndex ? " active" : ""}`}
                onMouseEnter={() => setSuggestionIndex(index)}
                onClick={() => selectSuggestion(item)}
              >
                <span>{item.name}</span>
                <span className="muted">{item.loginId}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
