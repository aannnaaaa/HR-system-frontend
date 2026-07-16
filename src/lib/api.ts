import axios from "axios"
import type { SearchFilters, Vacancy, Candidate } from "../types";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.response.use((response) => response, (error) => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status == 401 || status == 403) {
            return Promise.reject(new Error("Не авторизован"))
        }

        const message = error.response?.data?.message ?? error.message;
        return Promise.reject(new Error(`Серверная часть отказала (${status}): ${message}`));
    }
    return Promise.reject(error);
});

export async function searchVacancies(filters: SearchFilters): Promise<Vacancy[]> {
    const params = {
        profession: filters.profession || undefined,
        region: filters.region || undefined,
        employmentType: filters.employmentType || undefined,
    }

    const { data } = await apiClient.get<Vacancy[]>("/api/vacancies/", { params });
    return data;
}

export async function importVacancies(vacancies: unknown[]) {
  const { data } = await apiClient.post("/api/vacancies/import", { vacancies });
  return data;
}

/**
 * Поиск кандидатов через hh.ru (реальный поиск, не мок).
 *
 * ВАЖНО: путь "/api/candidates/search" — плейсхолдер. Подставьте реальный
 * путь, когда бэкенд-разработчик сделает роут, который дергает
 * SearchHHResumes() + mapHHResumeToCandidate() из hh-client.ts.
 */
export async function searchCandidates(filters: SearchFilters): Promise<Candidate[]> {
    const params = {
        profession: filters.profession || undefined,
        region: filters.region || undefined,
        experienceFrom: filters.experienceFrom || undefined,
        educationLevel: filters.educationLevel || undefined,
        educationProfile: filters.educationProfile || undefined,
        employmentType: filters.employmentType || undefined,
    }

    const { data } = await apiClient.get<Candidate[]>("/api/candidates/search", { params });
    return data;
}