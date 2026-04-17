"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountRoleFilter, AccountSuggestion } from "@/lib/admin-accounts-client";
import { useAccountSearchSuggestions } from "@/app/admin/accounts/manage/_hooks/use-account-search-suggestions";

type AccountSearchBoxProps = {
  roleFilter: AccountRoleFilter;
  onApplySearch: (value: string) => void;
};

export default function AccountSearchBox({ roleFilter, onApplySearch }: AccountSearchBoxProps) {
  const [searchInput, setSearchInput] = useState("");
  const { suggestions, suggestionsOpen, suggestionIndex, setSuggestionsOpen, setSuggestionIndex } =
    useAccountSearchSuggestions(roleFilter, searchInput);

  function selectSuggestion(item: AccountSuggestion) {
    const text = item.name === "-" ? item.loginId : `${item.name} (${item.loginId})`;
    setSearchInput(text);
    onApplySearch(item.loginId);
    setSuggestionsOpen(false);
    setSuggestionIndex(-1);
  }

  return (
    <Card className="search-panel">
      <CardContent className="stack-sm">
        <Label className="stack-xs">
          <span className="eyebrow">Search by Name or Login ID</span>
          <Input
            value={searchInput}
            placeholder="Type name or login ID..."
            onFocus={() => setSuggestionsOpen(suggestions.length > 0)}
            onChange={(event) => {
              const next = event.target.value;
              setSearchInput(next);
              onApplySearch(next.trim());
            }}
            onBlur={() => {
              window.setTimeout(() => setSuggestionsOpen(false), 120);
            }}
            onKeyDown={(event) => {
              if (!suggestionsOpen || suggestions.length === 0) {
                if (event.key === "Escape") {
                  setSuggestionsOpen(false);
                }
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                return;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const pick = suggestions[suggestionIndex] ?? suggestions[0];
                if (pick) {
                  selectSuggestion(pick);
                }
                return;
              }
              if (event.key === "Escape") {
                setSuggestionsOpen(false);
              }
            }}
          />
        </Label>
        {suggestionsOpen ? (
          <ul className="suggestion-list">
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
      </CardContent>
    </Card>
  );
}
