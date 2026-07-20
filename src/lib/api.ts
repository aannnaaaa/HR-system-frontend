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
 * hh.ru отдаёт образование как объект с primary[] (основное образование).
 * Достаём оттуда название специальности — по умолчанию для поля "Сфера
 * деятельности" в форме сохранения (item 1 из ФРОНТ-списка задач), чтобы
 * не заставлять HR каждый раз печатать одно и то же вручную.
 */
interface HHEducationPrimaryEntry {
  name?: string;
  organization?: string;
  result?: string;
}
interface HHEducationRaw {
  level?: { name?: string };
  primary?: HHEducationPrimaryEntry[];
}

function guessSpecialtyFromEducation(specialities: unknown): string | null {
  if (!specialities || typeof specialities !== "object") return null;
  const edu = specialities as HHEducationRaw;
  // ВАЖНО: name — это название учебного заведения (вуза), а не специальность.
  // Сама специализация/квалификация лежит в result.
  return edu.primary?.[0]?.result ?? null;
}

/**
 * Превращает результат живого поиска hh.ru в объект, совместимый с типом
 * Candidate — чтобы можно было переиспользовать CandidateModal для
 * предпросмотра (id здесь настоящий id резюме hh.ru).
 *
 * profession/specialty теперь предзаполняются: profession — из заголовка
 * резюме (resume.title), specialty — по эвристике из образования
 * (guessSpecialtyFromEducation). Если извлечь не получилось — останется
 * null, и HR всё равно впишет вручную в форме сохранения.
 */
export function mapSearchResultToCandidate(resume: HHResumeSearchResult): Candidate {
  const specialtyGuess = guessSpecialtyFromEducation(resume.specialities);

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

/**
 * Раскрытые контактные данные конкретного резюме hh.ru. Это платное
 * действие на стороне hh.ru (тратит лимит "покупки контактов" у аккаунта
 * работодателя) — поэтому вызывается только по явному клику, никогда
 * автоматически при обычном поиске.
 *
 * ВАЖНО: app/api/candidates/hh/resumes/[id]/route.ts отдаёт СЫРОЙ ответ
 * hh.ru (просто getResumeById(id) без трансформации) — не готовую форму
 * {name,email,phone}. Парсим первичное/фамилию/отчество и массив contact
 * по документации hh.ru. Также: этот роут не выполняет отдельного платного
 * "открытия" контакта — он просто читает то, что уже видно аккаунту. Если
 * контакты и после вызова остаются null — это ожидаемо, если аккаунт
 * работодателя ещё не оплатил/не получил доступ к этому резюме на hh.ru,
 * а не баг фронта.
 */
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

/** Публичная ссылка на резюме на сайте hh.ru — просто открыть в новой вкладке. */
export function getHHResumeUrl(hhResumeId: string): string {
  return `https://hh.ru/resume/${hhResumeId}`;
}
/**
 * Бэкенд требует непустые строки для name/email/phone/profession/specialty/
 * platformLink (400, если пусто) — но по факту эти данные часто ещё
 * неизвестны на момент, когда HR хочет просто добавить кандидата на
 * страницу "Мои заявки", не успев посмотреть резюме. Раз честно оставить
 * поле пустым нельзя — используем "—" как явный плейсхолдер "пока
 * неизвестно", который потом можно заменить реальным значением через
 * updateCandidateDetails.
 */
export const UNKNOWN_PLACEHOLDER = "—";

export function withPlaceholder(value: string): string {
  const trimmed = value.trim();
  return trimmed || UNKNOWN_PLACEHOLDER;
}

/** true, если поле ещё не заполнено реальными данными (пусто или "—"). */
export function isUnfilled(value?: string | null): boolean {
  return !value || value.trim() === "" || value.trim() === UNKNOWN_PLACEHOLDER;
}

/**
 * Тело запроса POST /api/candidates. Обязательные поля по бэкенду:
 * name/email/phone/platformLink/profession/specialty/region/employmentTypes.
 * Живой поиск hh.ru их не отдаёт — их вводит HR вручную в форме сохранения
 * (см. SaveCandidateDialog.tsx), кроме region/profession/specialty/
 * platformLink, которые теперь предзаполняются из результата поиска.
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

/**
 * PATCH /api/candidates/{candidateId} — реально сохраняет комментарий
 * (поле description в Candidate) в БД.
 */
export async function updateCandidateComment(
  candidateId: string,
  description: string
): Promise<Candidate> {
  const { data } = await apiClient.patch<Candidate>(`/api/candidates/${candidateId}`, {
    description,
  });
  return data;
}

/**
 * PATCH /api/candidates/{candidateId} — сохраняет статус. Раньше статус
 * хранился только на фронте (модели Application не существовало), теперь
 * status — реальное поле прямо в Candidate.
 */
export async function updateCandidateStatus(
  candidateId: string,
  status: Candidate["status"]
): Promise<Candidate> {
  const { data } = await apiClient.patch<Candidate>(`/api/candidates/${candidateId}`, {
    status,
  });
  return data;
}

/**
 * PATCH /api/candidates/{candidateId} — обновляет любые поля кандидата,
 * когда данные (ФИО/контакты/профессия и т.д.), заполненные плейсхолдером
 * "—" при сохранении, наконец стали известны.
 */
export async function updateCandidateDetails(
  candidateId: string,
  payload: Partial<SaveCandidatePayload>
): Promise<Candidate> {
  const { data } = await apiClient.patch<Candidate>(`/api/candidates/${candidateId}`, payload);
  return data;
}