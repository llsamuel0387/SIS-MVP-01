/** Join English legal name: given, optional middle, family. */
export function joinEnglishLegalName(
  firstNameEn?: string | null,
  middleNameEn?: string | null,
  lastNameEn?: string | null
): string {
  return [firstNameEn, middleNameEn, lastNameEn]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
}

/** Join Korean name parts (typically given name then family name). */
export function joinKoreanLegalName(firstNameKo?: string | null, lastNameKo?: string | null): string {
  return [firstNameKo, lastNameKo]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
}
