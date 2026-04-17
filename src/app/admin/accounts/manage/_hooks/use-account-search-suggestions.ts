"use client";

import { useEffect, useState } from "react";
import { suggestAccounts, type AccountRoleFilter, type AccountSuggestion } from "@/lib/admin-accounts-client";

export function useAccountSearchSuggestions(roleFilter: AccountRoleFilter, searchInput: string) {
  const [suggestions, setSuggestions] = useState<AccountSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);

  useEffect(() => {
    const keyword = searchInput.trim();
    if (!keyword) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSuggestionIndex(-1);
      return;
    }

    const timer = window.setTimeout(async () => {
      const { ok, data } = await suggestAccounts(roleFilter, keyword);
      if (!ok) {
        setSuggestions([]);
        setSuggestionsOpen(false);
        setSuggestionIndex(-1);
        return;
      }
      setSuggestions(data);
      setSuggestionsOpen(data.length > 0);
      setSuggestionIndex(data.length > 0 ? 0 : -1);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [roleFilter, searchInput]);

  return {
    suggestions,
    suggestionsOpen,
    suggestionIndex,
    setSuggestionsOpen,
    setSuggestionIndex
  };
}
