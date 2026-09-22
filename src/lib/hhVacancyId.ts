export function normalizeHHVacancyIdInput(raw: string): string {
  const fromUrl = raw.match(/vacancy\/(\d+)/);
  if (fromUrl) return fromUrl[1];
  return raw.trim();
}

export function isValidHHVacancyId(value: string): boolean {
  return /^\d+$/.test(value);
}
