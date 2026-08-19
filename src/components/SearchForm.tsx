import { useState } from "react";
import type { SearchFilters, HHExperience } from "../types";
import { regionLabels, employmentTypeLabels, experienceLabels } from "../types";
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
  experience: "",
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

// Radix Select не допускает SelectItem с value="" — пустой вариант
// ("Любой") и так показывается через SelectValue placeholder, когда
// filters.experience === "".
const experienceOptions = Object.entries(experienceLabels)
  .filter(([value]) => value !== "")
  .map(([value, label]) => ({ value, label }));

export function SearchForm({ onSearch }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  function handleTextChange(field: keyof SearchFilters) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function handleExperienceChange(value: string) {
    setFilters((prev) => ({ ...prev, experience: value as HHExperience }));
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
            <Label htmlFor="experience">Стаж</Label>
            <Select value={filters.experience} onValueChange={handleExperienceChange}>
              <SelectTrigger id="experience" className="w-full">
                <SelectValue placeholder="Любой" />
              </SelectTrigger>
              <SelectContent>
                {experienceOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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