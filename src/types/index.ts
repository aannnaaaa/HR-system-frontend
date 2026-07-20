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

// Candidate — как реально хранится и отдаётся бэкендом (app/api/candidates).
// profession/specialty/platformLink добавлены недавно на бэке — раньше их
// тут не было. name/email/phone обязательны при сохранении (POST), но
// у результатов живого поиска hh.ru (до сохранения) их ещё нет — поэтому
// они помечены как nullable.
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
  description?: string | null; // это и есть "комментарий" в UI
  status?: ApplicationStatus; // реально хранится теперь в Candidate
  employmentTypes?: EmploymentType[];
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