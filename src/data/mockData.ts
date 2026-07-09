import type { Application } from "../types";
import type { Candidate } from "../types";
import type { Vacancy } from "../types";

export const mockVacancies: Vacancy[] = [
  {
    id: "v1",
    userId: "u1",
    label: "Инженер-геолог",
    description: "Геологоразведка месторождений газа",
    employmentTypes: ["full_time"],
    city: "Тюмень",
    region: "Тюменская область",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "v2",
    userId: "u1",
    label: "Инженер-геолог",
    description: "Геологоразведка месторождений газа",
    employmentTypes: ["full_time"],
    city: "Тюмень",
    region: "Тюменская область",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: "c1",
    name: "Алексей Смирнов",
    email: "smirnov@example.com",
    phone: "+7 916 100-10-01",
    platform: "hh.ru",
    region: "Тюмень",
    relocationReady: true,
    experience: 10,
    educationLevel: "Бакалавриат",
    educationProfile: "Геология",
    employmentTypes: ["full_time"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockApplications: Application[] = [
  {
    id: "a1",
    candidateId: "c1",
    vacancyId: "v1",
    vacancyLabel: "Инженер-геолог",
    status: "new",
    candidate: mockCandidates[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];