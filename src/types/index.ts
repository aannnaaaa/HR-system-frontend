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

// ===== Модели =====

export interface Vacancy {
  id: string;
  userId: string;
  label: string;
  description: string;
  employmentTypes: EmploymentType[];
  city: string;
  region: Region;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  //hhResumeId?: string; // id резюме на hh.ru, если кандидат пришёл оттуда
  // ВАЖНО: name/email/phone теперь могут быть null — на hh.ru контактные
  // данные (ФИО, телефон, email) платные и могут быть не открыты. До
  // открытия показываем "—" на фронте (см. ResumeCard.tsx).
  //name: string | null;
  //email: string | null;
  //phone: string | null;
  platform: string;
  region: string;
  relocationReady: boolean;
  experience: number;
  educationLevel: string | null;
  educationProfile: string | null;
  //employmentTypes: EmploymentType[];
  createdAt: string;
  updatedAt: string;
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
  experienceFrom: number;
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

export const regionLabels: Record<Region, string> = {
  hmao: "ХМАО-Югра",
  ynao: "ЯНАО",
  tobl: "Тюменская область",
};