import axios from "axios"
import type {
  SearchFilters,
  Vacancy,
  Candidate,
  EmploymentType,
  Region,
  CandidateSource,
  VacancyResponse,
} from "../types";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
})

export interface ApiError extends Error {
  status?: number;
  /** Если бэк вернул 401 с { authUrl }, сюда попадает ссылка на переавторизацию в HH. */
  authUrl?: string;
}

apiClient.interceptors.response.use((response) => response, (error) => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status == 401 || status == 403) {
            const authUrl = (error.response?.data as { authUrl?: string } | undefined)?.authUrl;
            const err: ApiError = new Error(
                authUrl ? "Требуется авторизация в HH" : "Не авторизован"
            );
            err.status = status;
            if (authUrl) err.authUrl = authUrl;
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

// ===== Вакансии компании (Этап 1) =====

export async function getVacancies(): Promise<Vacancy[]> {
  const { data } = await apiClient.get<Vacancy[]>("/api/vacancies/");
  return data;
}

export interface VacancyPayload {
  label: string;
  description: string;
  city: string;
  region: Region;
  employmentTypes: EmploymentType[];
  hhVacancyId: string;
}

export async function createVacancy(payload: VacancyPayload): Promise<Vacancy> {
  const { data } = await apiClient.post<Vacancy>("/api/vacancies/", payload);
  return data;
}

export async function updateVacancy(
  vacancyId: string,
  payload: Partial<VacancyPayload>
): Promise<Vacancy> {
  const { data } = await apiClient.patch<Vacancy>(`/api/vacancies/${vacancyId}`, payload);
  return data;
}

export interface HHVacancyPreview {
  id: string;
  name: string;
  area: string | null;
  url: string;
}

interface HHVacancyRaw {
  id: string | number;
  name?: string;
  area?: { name?: string } | null;
  alternate_url?: string;
}

/**
 * Мягкая проверка ID: бэкенд проксирует публичный GET https://api.hh.ru/vacancies/{id}.
 * Ошибка здесь не должна блокировать сохранение вакансии.
 */
export async function lookupHHVacancy(
  hhVacancyId: string,
  signal?: AbortSignal
): Promise<HHVacancyPreview> {
  const { data } = await apiClient.get<HHVacancyRaw>(`/api/hh/vacancies/${hhVacancyId}`, {
    signal,
  });
  return {
    id: String(data.id),
    name: data.name ?? "Без названия",
    area: data.area?.name ?? null,
    url: data.alternate_url ?? getHHVacancyUrl(hhVacancyId),
  };
}

export function getHHVacancyUrl(hhVacancyId: string): string {
  return `https://hh.ru/vacancy/${hhVacancyId}`;
}

interface HHNegotiationRaw {
  id: string | number;
  created_at?: string;
  updated_at?: string;
  resume?: {
    id?: string;
    title?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    middle_name?: string | null;
    area?: { name?: string } | null;
    total_experience?: { months?: number } | null;
  } | null;
}

function mapNegotiation(raw: HHNegotiationRaw): VacancyResponse {
  const r = raw.resume ?? {};
  const name = [r.last_name, r.first_name, r.middle_name].filter(Boolean).join(" ");
  return {
    id: String(raw.id),
    resumeId: r.id ?? null,
    name: name || null,
    resumeTitle: r.title ?? null,
    area: r.area?.name ?? null,
    experienceMonths: r.total_experience?.months ?? null,
    createdAt: raw.created_at ?? raw.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Отклики на вакансию: бэкенд берёт hhVacancyId вакансии и проксирует
 * GET https://api.hh.ru/negotiations/response?vacancy_id=<hhVacancyId>.
 * Принимаем как сырой ответ hh ({ items: [...] }), так и массив.
 */
export async function getVacancyResponses(vacancyId: string): Promise<VacancyResponse[]> {
  const { data } = await apiClient.get<{ items?: HHNegotiationRaw[] } | HHNegotiationRaw[]>(
    `/api/vacancies/${vacancyId}/responses`
  );
  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(mapNegotiation);
}


export interface HHResumeSearchResult {
  id: string; // реальный id резюме на hh.ru
  title: string | null;
  area: string | null;
  totalExperienceMonths: number | null;
  educationLevel: string | null;

  specialty: unknown;
}

interface HHSearchResponse {
  found: number;
  page: number;
  per_page: number;
  itemsCount: number;
  items: HHResumeSearchResult[];
}

export async function searchCandidates(filters: SearchFilters): Promise<HHResumeSearchResult[]> {
    const params = {
        text: filters.profession || undefined,
        specialty: filters.educationProfile || undefined,
        experience: filters.experience || undefined,
        education_level: filters.educationLevel || undefined,
        region: filters.region || undefined,
        relocation: filters.region ? "true" : undefined,
        platform: filters.source || undefined,
    };

    const { data } = await apiClient.get<HHSearchResponse>("/api/candidates/hh/resumes", { params });
    return data.items ?? [];
}

interface HHEducationPrimaryEntry {
  name?: string;
  organization?: string;
  result?: string;
}
interface HHEducationRaw {
  level?: { name?: string };
  primary?: HHEducationPrimaryEntry[];
}

function guessSpecialtyFromEducation(specialty: unknown): string | null {
  if (!specialty || typeof specialty !== "object") return null;
  const edu = specialty as HHEducationRaw;
  return edu.primary?.[0]?.result ?? null;
}


export function mapSearchResultToCandidate(resume: HHResumeSearchResult): Candidate {
  const specialtyGuess = guessSpecialtyFromEducation(resume.specialty);

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
    educationProfile: specialtyGuess ?? resume.title,
    profession: resume.title,
    specialty: specialtyGuess,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}


export interface RevealedResumeContact {
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface HHRawResumeById {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  contact?: { type?: { id?: string }; value?: unknown }[] | null;
}

function extractHHContact(raw: HHRawResumeById, typeId: "cell" | "email"): string | null {
  const entry = raw.contact?.find((c) => c.type?.id === typeId);
  if (!entry) return null;
  if (typeof entry.value === "string") return entry.value;
  if (entry.value && typeof entry.value === "object" && "formatted" in entry.value) {
    return String((entry.value as { formatted: string }).formatted);
  }
  return null;
}

export async function revealResumeContact(hhResumeId: string): Promise<RevealedResumeContact> {
  const raw = await apiClient.get<HHRawResumeById>(`/api/candidates/hh/resumes/${hhResumeId}`);
  const data = raw.data;

  const fullName = [data.last_name, data.first_name, data.middle_name]
    .filter(Boolean)
    .join(" ");

  return {
    name: fullName || null,
    email: extractHHContact(data, "email"),
    phone: extractHHContact(data, "cell"),
  };
}

interface HHRawResumeFull extends HHRawResumeById {
  id?: string;
  title?: string | null;
  area?: { name?: string } | null;
  total_experience?: { months?: number } | null;
  education?: HHEducationRaw | null;
  relocation?: { type?: { id?: string } } | null;
  alternate_url?: string;
}

/**
 * Резюме из отклика: переиспользуем существующий бэкенд-роут getResumeById
 * (/api/candidates/hh/resumes/:id) и приводим ответ к Candidate для CandidateModal.
 */
export async function getHHResumeAsCandidate(hhResumeId: string): Promise<Candidate> {
  const { data } = await apiClient.get<HHRawResumeFull>(`/api/candidates/hh/resumes/${hhResumeId}`);
  const fullName = [data.last_name, data.first_name, data.middle_name].filter(Boolean).join(" ");
  const educationProfile = data.education?.primary?.[0]?.result ?? null;
  const now = new Date().toISOString();

  return {
    id: hhResumeId,
    name: fullName || null,
    email: extractHHContact(data, "email"),
    phone: extractHHContact(data, "cell"),
    platform: "hh.ru",
    platformLink: data.alternate_url ?? getHHResumeUrl(hhResumeId),
    region: data.area?.name ?? "—",
    relocationReady: Boolean(data.relocation?.type?.id && data.relocation.type.id !== "no_relocation"),
    experience: data.total_experience?.months ? Math.round(data.total_experience.months / 12) : 0,
    educationLevel: data.education?.level?.name ?? null,
    educationProfile: educationProfile ?? data.title ?? null,
    profession: data.title ?? null,
    specialty: educationProfile,
    createdAt: now,
    updatedAt: now,
  };
}

export function getHHResumeUrl(hhResumeId: string): string {
  return `https://hh.ru/resume/${hhResumeId}`;
}

export const UNKNOWN_PLACEHOLDER = "—";

export function withPlaceholder(value: string): string {
  const trimmed = value.trim();
  return trimmed || UNKNOWN_PLACEHOLDER;
}

export function isUnfilled(value?: string | null): boolean {
  return !value || value.trim() === "" || value.trim() === UNKNOWN_PLACEHOLDER;
}


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
  source?: CandidateSource;
  vacancyId?: string | null;
  respondedAt?: string | null;
}

export async function saveCandidate(payload: SaveCandidatePayload): Promise<Candidate> {
  const { data } = await apiClient.post<Candidate>("/api/candidates", payload);
  return data;
}


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


export async function updateCandidateComment(
  candidateId: string,
  description: string
): Promise<Candidate> {
  const { data } = await apiClient.patch<Candidate>(`/api/candidates/${candidateId}`, {
    description,
  });
  return data;
}


export async function updateCandidateStatus(
  candidateId: string,
  status: Candidate["status"]
): Promise<Candidate> {
  const { data } = await apiClient.patch<Candidate>(`/api/candidates/${candidateId}`, {
    status,
  });
  return data;
}


export async function updateCandidateDetails(
  candidateId: string,
  payload: Partial<SaveCandidatePayload>
): Promise<Candidate> {
  const { data } = await apiClient.patch<Candidate>(`/api/candidates/${candidateId}`, payload);
  return data;
}