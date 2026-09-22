// ===== Enum'ы, как в Prisma schema =====

export type EmploymentType =
  | "permanent"
  | "temporary"
  | "mobilization_period"
  | "parental_leave_cover"
  | "shift";

export type ApplicationStatus =
  | "new"
  | "review"
  | "interview"
  | "hired"
  | "rejected"
  | "ignored";

export type Region = "hmao" | "ynao" | "tobl";

export type HHExperience =
  | ""
  | "noExperience"
  | "between1And3"
  | "between3And6"
  | "moreThan6";

// ===== Модели =====

export interface Vacancy {
  id: string;
  userId: string;
  label: string;
  description: string;
  employmentTypes: EmploymentType[];
  city: string;
  region: Region;
  /** ID вакансии на hh.ru (число из ссылки hh.ru/vacancy/<id>). У старых записей может отсутствовать. */
  hhVacancyId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Откуда кандидат попал в систему. */
export type CandidateSource = "response" | "search";

export interface Candidate {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  platformLink?: string | null;
  profession?: string | null;
  specialty?: string | null;
  platform?: string | null;
  region: string;
  relocationReady: boolean;
  experience: number;
  educationLevel: string | null;
  educationProfile: string | null;
  description?: string | null; 
  status?: ApplicationStatus; 
  employmentTypes?: EmploymentType[];
  /** "response" — сам откликнулся на вакансию, "search" — найден через поиск по базе. */
  source?: CandidateSource | null;
  /** Вакансия, на которую откликнулся / под которую взят кандидат. */
  vacancyId?: string | null;
  /** Когда кандидат откликнулся (только для source = "response"). */
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Отклик кандидата на вакансию с hh.ru (GET /negotiations/response) */
export interface VacancyResponse {
  /** id отклика (negotiation) на hh.ru */
  id: string;
  /** id резюме на hh.ru — передаётся в getResumeById */
  resumeId: string | null;
  name: string | null;
  resumeTitle: string | null;
  area: string | null;
  experienceMonths: number | null;
  createdAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  vacancyId: string;
  vacancyLabel: string;
  status: ApplicationStatus;
  candidate: Candidate;
  vacancy?: Vacancy;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  profession: string;
  region: string;
  source: string;
  experience: HHExperience;
  educationLevel: string;
  educationProfile: string;
  employmentType: string;
}

// ===== Словари для отображения enum'ов на русском =====

export const employmentTypeLabels: Record<EmploymentType, string> = {
  permanent: "Постоянный",
  temporary: "Временный",
  mobilization_period: "На период мобилизации",
  parental_leave_cover: "На период отпуска по уходу за ребенком",
  shift: "Вахта",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  new: "Новая",
  review: "Связались",
  interview: "Приглашен",
  hired: "Нанят",
  rejected: "Отклонена",
  ignored: "Игнор",
};

export const experienceLabels: Record<HHExperience, string> = {
  "": "Любой",
  noExperience: "Нет опыта",
  between1And3: "От 1 года до 3 лет",
  between3And6: "От 3 до 6 лет",
  moreThan6: "Более 6 лет",
};

export const regionLabels: Record<Region, string> = {
  hmao: "ХМАО-Югра",
  ynao: "ЯНАО",
  tobl: "Тюменская область",
};
export const candidateSourceLabels: Record<CandidateSource, string> = {
  response: "Отклик",
  search: "Поиск",
};
