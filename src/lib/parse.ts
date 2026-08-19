import { parseRegions, parseLocality } from "./filter";
import { buildEmploymentTypes, parseVacancyRows } from "./parseVacancies";

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
console.log(parseLocality("86,Сургут")); 
console.log(parseLocality("23,Геленджик"));
console.log(parseLocality("86,")); 

console.log("\n=== buildEmploymentTypes ===");
console.log(buildEmploymentTypes("Да", "Постоянный")); 
console.log(buildEmploymentTypes("Нет", "Временный"));
console.log(buildEmploymentTypes("Нет", "Что-то новое")); 

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