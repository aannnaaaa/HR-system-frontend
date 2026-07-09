import { useState } from "react";
import type { SearchFilters } from "../types";
import { regionLabels, employmentTypeLabels } from "../types";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search } from "lucide-react";

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
}

const initialFilters: SearchFilters = {
  profession: "",
  region: "",
  source: "",
  experienceFrom: 0,
  educationLevel: "",
  educationProfile: "",
  employmentType: "",
};

const regionOptions = Object.entries(regionLabels).map(([value, label]) => ({
  value,
  label,
}));

const employmentTypeOptions = Object.entries(employmentTypeLabels).map(
  ([value, label]) => ({ value, label })
);

export function SearchForm({ onSearch }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  // отдельное "сырое" значение для поля стажа — чтобы можно было стереть 0
  // и не получать его обратно при каждом ререндере, пока пользователь печатает
  const [experienceInput, setExperienceInput] = useState("0");

  function handleTextChange(field: keyof SearchFilters) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function handleExperienceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setExperienceInput(raw);
    setFilters((prev) => ({ ...prev, experienceFrom: raw === "" ? 0 : Number(raw) }));
  }

  function handleExperienceBlur() {
    // если поле оставили пустым — возвращаем 0
    if (experienceInput === "") {
      setExperienceInput("0");
    }
  }

  function handleSelectChange(field: keyof SearchFilters) {
    return (value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(filters);
  }

  function handleReset() {
    setFilters(initialFilters);
    setExperienceInput("0");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Поиск кандидатов</h1>
      <p className="mt-1 text-muted-foreground">
        Введите профессию и при необходимости уточните фильтры. Сравниваем
        открытые вакансии с резюме на платформах.
      </p>

      <Card className="mt-5">
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profession">Профессия *</Label>
            <Input
              id="profession"
              placeholder="Например, Инженер-геолог"
              value={filters.profession}
              onChange={handleTextChange("profession")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="region">Регион</Label>
            <Select value={filters.region} onValueChange={handleSelectChange("region")}>
              <SelectTrigger id="region" className="w-full">
                <SelectValue placeholder="Любой" />
              </SelectTrigger>
              <SelectContent>
                {regionOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Источник (платформа)</Label>
            <Input
              id="source"
              placeholder="hh.ru, superjob, habr career"
              value={filters.source}
              onChange={handleTextChange("source")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="experienceFrom">Стаж от (лет)</Label>
            <Input
              id="experienceFrom"
              type="number"
              min={0}
              placeholder="0"
              value={experienceInput}
              onChange={handleExperienceChange}
              onBlur={handleExperienceBlur}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="educationLevel">Уровень образования</Label>
            <Input
              id="educationLevel"
              placeholder="Любой"
              value={filters.educationLevel}
              onChange={handleTextChange("educationLevel")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="educationProfile">Профиль образования</Label>
            <Input
              id="educationProfile"
              placeholder="Геология, Нефтегазовое дело..."
              value={filters.educationProfile}
              onChange={handleTextChange("educationProfile")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employmentType">Тип занятости</Label>
            <Select
              value={filters.employmentType}
              onValueChange={handleSelectChange("employmentType")}
            >
              <SelectTrigger id="employmentType" className="w-full">
                <SelectValue placeholder="Любая" />
              </SelectTrigger>
              <SelectContent>
                {employmentTypeOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="gap-3">
          <Button type="submit">
            <Search className="size-4" />
            Найти
          </Button>
          <Button type="button" variant="ghost" onClick={handleReset}>
            Сбросить
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}