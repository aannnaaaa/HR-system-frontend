import type { Region } from "../types";

// Коды местности, которые реально встречаются в выгрузке вакансий.
// 23 (Краснодарский край, напр. Геленджик) сюда намеренно не включён —
// такие вакансии пока пропускаем (см. parseLocality).
const regionCodeMap: Record<string, Region> = {
  "86": "hmao",
  "89": "ynao",
  "72": "tobl",
};

export interface ParsedLocality {
  region: Region;
  city: string;
}

/**
 * Разбирает поле "Местность" вида "86,Сургут" -> { region: "hmao", city: "Сургут" }.
 * Если код региона не из числа поддерживаемых (86/89/72) — возвращает null,
 * и такую строку нужно пропустить (skip) на уровне вызывающего кода.
 */
export function parseLocality(raw: string): ParsedLocality | null {
  const [codeRaw, cityRaw] = raw.split(",").map((part) => part.trim());
  const region = regionCodeMap[codeRaw];
  if (!region) return null; // неизвестный/неподдерживаемый регион — скип

  const city = cityRaw || "";
  if (!city) return null; // без города строка бесполезна — скип

  return { region, city };
}

// ===== Группировка город->регион (для отчётов/дебага) =====

interface ParsedRegions {
  [regionName: string]: string[];
}

/**
 * Группирует строки CSV-подобных данных "код,город" по региону.
 * Строки с неизвестным кодом региона пропускаются целиком.
 */
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
    if (!parsed) continue; // скип неизвестного региона / пустого города

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