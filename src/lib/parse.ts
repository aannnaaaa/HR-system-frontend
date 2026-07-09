import { parseRegions, parseLocality } from "./filter";
import { buildEmploymentTypes, parseVacancyRows } from "./parseVacancies";

// ===== 1. Группировка городов по региону (как раньше) =====
const testData = `Регион,Город
86,Сургут
86,Сургут
89,Ноябрьск
89,Пуровский рн
72,Тюмень
23,Геленджик
86,`;

console.log("=== parseRegions ===");
console.log(JSON.stringify(parseRegions(testData), null, 2));

console.log("\n=== parseLocality (проверка скипа неизвестных регионов) ===");
console.log(parseLocality("86,Сургут")); // { region: "hmao", city: "Сургут" }
console.log(parseLocality("23,Геленджик")); // null — регион не поддерживается, скип
console.log(parseLocality("86,")); // null — нет города, скип

// ===== 2. Тип трудоустройства = вахта + вид трудового договора =====
console.log("\n=== buildEmploymentTypes ===");
console.log(buildEmploymentTypes("Да", "Постоянный")); // ["permanent", "shift"]
console.log(buildEmploymentTypes("Нет", "Временный")); // ["temporary"]
console.log(buildEmploymentTypes("Нет", "Что-то новое")); // null — неизвестный вид договора, скип

// ===== 3. Полная строка вакансии, как её отдаёт XLSX.utils.sheet_to_json(sheet, {header:1}) =====
const sampleRows = [
  [
    "№",
    "Филиал",
    "Местность",
    "Подразделение",
    "Должность (профессия), разряд",
    "Вахта",
    "Вид трудового договора",
    "Статус вакансии",
  ],
  [1, "Тест", "86,Сургут", "Служба ИУС", "Инженер I категории", "Нет", "Постоянный", "Идет подбор кандидата"],
  [2, "Тест", "23,Геленджик", "Служба ИУС", "Инженер I категории", "Нет", "Постоянный", "Идет подбор кандидата"],
  [
    3,
    "Тест",
    "89,Пурпе",
    "Аппарат",
    "Инженер (по диагностике оборудования КС и МГ)",
    "Да",
    "Постоянный",
    "Идет подбор кандидата",
  ],
];

console.log("\n=== parseVacancyRows (мини-пример из 3 строк, 1 из них должна скипнуться) ===");
console.log(JSON.stringify(parseVacancyRows(sampleRows), null, 2));