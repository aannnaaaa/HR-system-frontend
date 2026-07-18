import axios from "axios"
import type { SearchFilters, Vacancy, Candidate, EmploymentType } from "../types";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
})

// Ошибка теперь несёт status как обычное поле — нужно, чтобы отличать
// "404 = пустой список" от настоящих ошибок (см. getSavedCandidates ниже).
export interface ApiError extends Error {
  status?: number;
}

apiClient.interceptors.response.use((response) => response, (error) => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status == 401 || status == 403) {
            const err: ApiError = new Error("Не авторизован");
            err.status = status;
            return Promise.reject(err);
        }

        const message = error.response?.data?.message ?? error.message;
        const err: ApiError = new Error(`Серверная часть отказала (${status}): ${message}`);
        err.status = status;
        return Promise.reject(err);
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
 * Результат живого поиска резюме через hh.ru
 * (app/api/candidates/hh/resumes/route.ts).
 * ВАЖНО: это НЕ Candidate из БД — это лёгкий предпросмотр без контактов
 * и т.д. Чтобы сохранить кандидата по-настоящему — см. saveCandidate ниже.
 */
export interface HHResumeSearchResult {
  id: string; // реальный id резюме на hh.ru
  title: string | null;
  area: string | null;
  totalExperienceMonths: number | null;
  educationLevel: string | null;
  specialities: unknown;
}

interface HHSearchResponse {
  found: number;
  page: number;
  per_page: number;
  itemsCount: number;
  items: HHResumeSearchResult[];
}

/**
 * Живой поиск резюме на hh.ru — ничего не сохраняет, просто ищет.
 *
 * ВАЖНО: area здесь должен быть area id hh.ru, а не ваш код региона
 * (hmao/ynao/tobl) — точного маппинга пока нет, поэтому region из фильтров
 * сейчас НЕ передаётся в запрос.
 */
export async function searchCandidates(filters: SearchFilters): Promise<HHResumeSearchResult[]> {
    const params = {
        text: filters.profession || undefined,
        specialty: filters.educationProfile || undefined,
        experience: filters.experienceFrom || undefined,
        education_levels: filters.educationLevel || undefined,
        // filters.source (платформа) — hh-client.ts принимает "platform" как
        // параметр, но фактически НЕ использует его при построении query.
        // Похоже на недоделку на бэке, отправляю на всякий случай.
        platform: filters.source || undefined,
    };

    const { data } = await apiClient.get<HHSearchResponse>("/api/candidates/hh/resumes", { params });
    return data.items ?? [];
}

/**
 * Превращает результат живого поиска hh.ru в объект, совместимый с типом
 * Candidate — чтобы можно было переиспользовать CandidateModal для
 * предпросмотра (id здесь настоящий id резюме hh.ru).
 */
export function mapSearchResultToCandidate(resume: HHResumeSearchResult): Candidate {
  return {
    id: resume.id,
    name: null,
    email: null,
    phone: null,
    platform: "hh.ru",
    region: resume.area ?? "—",
    relocationReady: false,
    experience: resume.totalExperienceMonths ? Math.round(resume.totalExperienceMonths / 12) : 0,
    educationLevel: resume.educationLevel,
    educationProfile: resume.title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Тело запроса POST /api/candidates. Обязательные поля по бэкенду:
 * name/email/phone/platformLink/profession/specialty/region/employmentTypes.
 * Живой поиск hh.ru их не отдаёт — их вводит HR вручную в форме сохранения
 * (см. SaveCandidateDialog.tsx), кроме region/profession/platformLink,
 * которые можно предзаполнить из результата поиска.
 */
export interface SaveCandidatePayload {
  name: string;
  email: string;
  phone: string;
  platformLink: string;
  profession: string;
  specialty: string;
  region: string;
  relocationReady?: boolean;
  experience?: number;
  educationLevel?: string | null;
  educationProfile?: string | null;
  employmentTypes: EmploymentType[];
}

/** POST /api/candidates — реально создаёт кандидата в БД (роут помечен Admin). */
export async function saveCandidate(payload: SaveCandidatePayload): Promise<Candidate> {
  const { data } = await apiClient.post<Candidate>("/api/candidates", payload);
  return data;
}

/**
 * GET /api/candidates — сохранённые кандидаты из БД.
 * ВАЖНО: бэкенд отдаёт 404, если кандидатов вообще нет (не только при
 * реальной ошибке) — трактуем такой 404 как пустой список, а не ошибку.
 */
export async function getSavedCandidates(): Promise<Candidate[]> {
  try {
    const { data } = await apiClient.get<Candidate[]>("/api/candidates");
    return data;
  } catch (err) {
    if ((err as ApiError).status === 404) return [];
    throw err;
  }
}

export async function getSavedCandidateById(candidateId: string): Promise<Candidate> {
  const { data } = await apiClient.get<Candidate>(`/api/candidates/${candidateId}`);
  return data;
}