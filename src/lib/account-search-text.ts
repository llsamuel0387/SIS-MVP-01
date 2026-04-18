import { normalizeLoginId } from "@/lib/login-id";

function normalizeFragment(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function compactFragments(fragments: Array<string | null | undefined>): string[] {
  return fragments
    .map((value) => normalizeFragment(value))
    .filter(Boolean);
}

export function normalizeAccountSearchQuery(value: string): string {
  return normalizeFragment(value);
}

export function buildAccountSearchText(input: {
  loginId: string;
  firstNameKo?: string | null;
  lastNameKo?: string | null;
  firstNameEn?: string | null;
  middleNameEn?: string | null;
  lastNameEn?: string | null;
}): string {
  const loginId = normalizeLoginId(input.loginId);
  const koreanParts = compactFragments([input.lastNameKo, input.firstNameKo]);
  const englishParts = compactFragments([input.firstNameEn, input.middleNameEn, input.lastNameEn]);
  const englishReverseParts = compactFragments([input.lastNameEn, input.firstNameEn, input.middleNameEn]);

  const variants = new Set<string>([
    loginId,
    koreanParts.join(""),
    koreanParts.join(" "),
    englishParts.join(" "),
    englishReverseParts.join(" ")
  ]);

  return Array.from(variants).filter(Boolean).join(" ").trim();
}
