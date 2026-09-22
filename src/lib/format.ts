export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function newResponsesLabel(n: number): string {
  return `${n} ${pluralRu(n, "новый", "новых", "новых")}`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  if (diffH < 48) return "вчера";
  return formatShortDate(iso);
}

export function formatExperienceMonths(months: number | null): string {
  if (months === null) return "Стаж —";
  const years = Math.round(months / 12);
  return `Стаж ${years} ${pluralRu(years, "год", "года", "лет")}`;
}
