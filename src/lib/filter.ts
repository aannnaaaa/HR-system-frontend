import type { Region } from "../types";

const regionCodeMap: Record<string, Region> = {
  "86": "hmao",
  "89": "ynao",
  "72": "tobl",
};

export interface ParsedLocality {
  region: Region;
  city: string;
}

export function parseLocality(raw: string): ParsedLocality | null {
  const [codeRaw, cityRaw] = raw.split(",").map((part) => part.trim());
  const region = regionCodeMap[codeRaw];
  if (!region) return null;

  const city = cityRaw || "";
  if (!city) return null; 

  return { region, city };
}


interface ParsedRegions {
  [regionName: string]: string[];
}

export function parseRegions(data: string): ParsedRegions {
  const lines = data
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1);

  const regionMap: Record<Region, Set<string>> = {} as Record<Region, Set<string>>;

  for (const line of lines) {
    const parsed = parseLocality(line);
    if (!parsed) continue; 

    if (!regionMap[parsed.region]) {
      regionMap[parsed.region] = new Set();
    }
    regionMap[parsed.region].add(parsed.city);
  }

  const result: ParsedRegions = {};
  for (const [region, cities] of Object.entries(regionMap)) {
    result[region] = Array.from(cities);
  }

  return result;
}