import countries from "world-countries";

type WorldCountry = {
  cca2: string;
  name?: {
    official?: string;
  };
};

export const COUNTRY_OPTIONS: string[] = Array.from(
  new Set(
    (countries as WorldCountry[])
      .filter((country) => country.cca2 !== "KP")
      .map((country) => country.name?.official?.trim() ?? "")
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b, "en"));
