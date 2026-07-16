import type { Candidate } from "../types";

/**
 * Мок-данные кандидатов — только для проверки вёрстки/логики поиска,
 * пока бэкенд не реализовал реальный /api/candidates/search.
 * Состав полей строго соответствует реальному Candidate (без name/email/phone —
 * этих данных сейчас нет и с бэка).
 */
export const mockCandidates: Candidate[] = [
  {
    id: "mock-candidate-1",
    platform: "hh.ru",
    region: "Тюмень",
    relocationReady: true,
    experience: 8,
    educationLevel: "Высшее",
    educationProfile: "Инженер-геолог",
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-01T10:00:00.000Z",
  },
  {
    id: "mock-candidate-2",
    platform: "hh.ru",
    region: "Сургут",
    relocationReady: false,
    experience: 3,
    educationLevel: "Среднее профессиональное",
    educationProfile: "Геология и разведка полезных ископаемых",
    createdAt: "2026-05-02T10:00:00.000Z",
    updatedAt: "2026-05-02T10:00:00.000Z",
  },
  {
    id: "mock-candidate-3",
    platform: "superjob",
    region: "Ноябрьск",
    relocationReady: true,
    experience: 12,
    educationLevel: "Высшее",
    educationProfile: "Нефтегазовое дело",
    createdAt: "2026-05-03T10:00:00.000Z",
    updatedAt: "2026-05-03T10:00:00.000Z",
  },
  {
    id: "mock-candidate-4",
    platform: "hh.ru",
    region: "Тобольск",
    relocationReady: false,
    experience: 1,
    educationLevel: null,
    educationProfile: "Руководитель группы",
    createdAt: "2026-05-04T10:00:00.000Z",
    updatedAt: "2026-05-04T10:00:00.000Z",
  },
  {
    id: "mock-candidate-5",
    platform: "habr career",
    region: "Ханты-Мансийск",
    relocationReady: true,
    experience: 6,
    educationLevel: "Высшее",
    educationProfile: "Инженер по диагностике оборудования",
    createdAt: "2026-05-05T10:00:00.000Z",
    updatedAt: "2026-05-05T10:00:00.000Z",
  },
];

/** Простая фильтрация мока по тем же полям, что и реальный поиск, — только для теста. */
export function filterMockCandidates(filters: {
  profession: string;
  region: string;
  experienceFrom: number;
}): Candidate[] {
  const professionQuery = filters.profession.trim().toLowerCase();

  return mockCandidates.filter((c) => {
    const matchesProfession =
      !professionQuery ||
      c.educationProfile?.toLowerCase().includes(professionQuery);
    const matchesExperience = c.experience >= (filters.experienceFrom || 0);
    return matchesProfession && matchesExperience;
  });
}