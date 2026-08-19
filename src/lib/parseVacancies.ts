import * as XLSX from "xlsx";
import type { EmploymentType, Vacancy } from "../types";
import { parseLocality } from "./filter";

export type VacancyImportRow = Pick<
  Vacancy,
  "label" | "city" | "region" | "employmentTypes"
>;

export interface SkippedRow {
  rowNumber: number; 
  reason: "unknown_region" | "missing_profession" | "unknown_contract_type";
  raw: Record<string, string>;
}

export interface ParseResult {
  vacancies: VacancyImportRow[];
  skipped: SkippedRow[];
}

const COLUMNS = {
  locality: "Местность",
  profession: "Должность (профессия), разряд",
  shift: "Вахта",
  contractType: "Вид трудового договора",
} as const;

const contractTypeMap: Record<string, EmploymentType> = {
  "Постоянный": "permanent",
  "Временный": "temporary",
  "На период мобилизации": "mobilization_period",
  "На период отпуска по уходу за ребенком": "parental_leave_cover",
};

function parseContractType(raw: string): EmploymentType | null {
  return contractTypeMap[raw.trim()] ?? null;
}

export function buildEmploymentTypes(
  vahtaRaw: string,
  contractRaw: string
): EmploymentType[] | null {
  const contractType = parseContractType(contractRaw);
  if (!contractType) return null;

  const types: EmploymentType[] = [contractType];
  if (vahtaRaw.trim().toLowerCase() === "да") {
    types.push("shift");
  }
  return types;
}

function findHeaderRowIndex(rows: unknown[][]): number {
  const needed = Object.values(COLUMNS);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map((cell) => String(cell ?? "").trim());
    if (needed.every((col) => row.includes(col))) return i;
  }
  throw new Error(
    "Не удалось найти строку заголовка - проверьте, что в файле есть колонки: " +
      needed.join(", ")
  );
}

export function parseVacancyRows(rows: unknown[][]): ParseResult {
  const headerIndex = findHeaderRowIndex(rows);
  const header = rows[headerIndex].map((cell) => String(cell ?? "").trim());

  const colIndex = {
    locality: header.indexOf(COLUMNS.locality),
    profession: header.indexOf(COLUMNS.profession),
    shift: header.indexOf(COLUMNS.shift),
    contractType: header.indexOf(COLUMNS.contractType),
    rowNumber: header.indexOf("№"),
  };

  const vacancies: VacancyImportRow[] = [];
  const skipped: SkippedRow[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => cell === undefined || cell === "")) continue; 
    const localityRaw = String(row[colIndex.locality] ?? "").trim();
    const professionRaw = String(row[colIndex.profession] ?? "").trim();
    const shiftRaw = String(row[colIndex.shift] ?? "").trim();
    const contractRaw = String(row[colIndex.contractType] ?? "").trim();
    const rowNumber =
      colIndex.rowNumber >= 0 ? Number(row[colIndex.rowNumber]) || i : i;

    const raw = {
      [COLUMNS.locality]: localityRaw,
      [COLUMNS.profession]: professionRaw,
      [COLUMNS.shift]: shiftRaw,
      [COLUMNS.contractType]: contractRaw,
    };

    const locality = parseLocality(localityRaw);
    if (!locality) {
      skipped.push({ rowNumber, reason: "unknown_region", raw });
      continue;
    }

    if (!professionRaw) {
      skipped.push({ rowNumber, reason: "missing_profession", raw });
      continue;
    }

    const employmentTypes = buildEmploymentTypes(shiftRaw, contractRaw);
    if (!employmentTypes) {
      skipped.push({ rowNumber, reason: "unknown_contract_type", raw });
      continue;
    }

    vacancies.push({
      label: professionRaw.charAt(0).toUpperCase() + professionRaw.slice(1),
      region: locality.region,
      city: locality.city,
      employmentTypes,
    });
  }

  return { vacancies, skipped };
}

export function parseVacancyWorkbook(workbook: XLSX.WorkBook): ParseResult {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });
  return parseVacancyRows(rows);
}

export function parseVacancyFileBuffer(
  data: ArrayBuffer | Uint8Array
): ParseResult {
  const workbook = XLSX.read(data, {
    type: typeof Buffer !== "undefined" && Buffer.isBuffer(data) ? "buffer" : "array",
  });
  return parseVacancyWorkbook(workbook);
}