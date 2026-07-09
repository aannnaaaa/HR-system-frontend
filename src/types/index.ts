// ===== Enum'ы, как в Prisma schema =====

// Реальные виды трудоустройства, встречающиеся в выгрузке вакансий:
// - "Вид трудового договора" (Постоянный / Временный / На период мобилизации /
//    На период отпуска по уходу за ребенком)
// - "Вахта" (Да/Нет) — если "Да", в employmentTypes добавляется "shift"
//
// Старый enum (full_time/part_time/project/internship/tour) не соответствовал
// реальным данным (не было "периода мобилизации" и т.п.) — заменён.
export type EmploymentType =
  | "permanent" // Постоянный
  | "temporary" // Временный
  | "mobilization_period" // На период мобилизации
  | "parental_leave_cover" // На период отпуска по уходу за ребенком
  | "shift"; // Вахта

export type ApplicationStatus =
  | "new"
  | "review"
  | "interview"
  | "hired"
  | "rejected"
  | "ignored";

// Регион строго определяется по коду местности (86/89/72).
// Остальные коды (например 23 — Краснодарский край) пока не поддерживаются
// и отбрасываются на этапе импорта.
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
  createdAt: string; // даты с бэка приходят строкой (ISO), не Date
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  platform: string;
  region: string;
  relocationReady: boolean;
  experience: number;
  educationLevel: string | null;   // в схеме поле опциональное (String?)
  educationProfile: string | null;
  employmentTypes: EmploymentType[];
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  candidateId: string;
  vacancyId: string;
  vacancyLabel: string;
  status: ApplicationStatus;
  candidate: Candidate; // когда бек отдаёт application с include candidate
  vacancy?: Vacancy;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Поля формы поиска (Image 1) =====

export interface SearchFilters {
  profession: string;
  region: string;
  source: string;          // platform
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