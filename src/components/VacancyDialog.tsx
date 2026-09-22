import { useState } from "react";
import type { EmploymentType, Region, Vacancy } from "../types";
import { employmentTypeLabels, regionLabels } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { HhVacancyIdField } from "./HhVacancyIdField";
import type { VacancyPayload } from "../lib/api";
import { isValidHHVacancyId } from "../lib/hhVacancyId";

interface VacancyDialogProps {
  vacancy?: Vacancy | null;
  vacancies: Vacancy[];
  focusHhId?: boolean;
  onClose: () => void;
  onSubmit: (payload: VacancyPayload) => Promise<void>;
}

const employmentTypeOptions = Object.entries(employmentTypeLabels) as [EmploymentType, string][];
const regionOptions = Object.entries(regionLabels) as [Region, string][];

export function VacancyDialog({ vacancy, vacancies, focusHhId, onClose, onSubmit }: VacancyDialogProps) {
  const isEdit = Boolean(vacancy);
  const [label, setLabel] = useState(vacancy?.label ?? "");
  const [city, setCity] = useState(vacancy?.city ?? "");
  const [region, setRegion] = useState<Region | "">(vacancy?.region ?? "");
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>(
    vacancy?.employmentTypes ?? []
  );
  const [description, setDescription] = useState(vacancy?.description ?? "");
  const [hhVacancyId, setHhVacancyId] = useState(vacancy?.hhVacancyId ?? "");
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = vacancies.find(
    (v) => v.id !== vacancy?.id && v.hhVacancyId && v.hhVacancyId === hhVacancyId
  );

  const isValid =
    label.trim() !== "" &&
    city.trim() !== "" &&
    region !== "" &&
    employmentTypes.length > 0 &&
    description.trim() !== "" &&
    isValidHHVacancyId(hhVacancyId);

  function toggleType(type: EmploymentType) {
    setEmploymentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    if (!isValid) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        label: label.trim(),
        city: city.trim(),
        region: region as Region,
        employmentTypes,
        description: description.trim(),
        hhVacancyId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось сохранить вакансию");
    } finally {
      setIsSaving(false);
    }
  }

  const requiredHint = (empty: boolean) =>
    triedSubmit && empty ? <p className="text-xs text-red-600">Обязательное поле</p> : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактирование вакансии" : "Новая вакансия"}</DialogTitle>
          <DialogDescription>
            ID вакансии на hh.ru нужен, чтобы получать отклики кандидатов.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vacancy-label">Название *</Label>
            <Input
              id="vacancy-label"
              placeholder="Например, Инженер связи"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus={!focusHhId}
            />
            {requiredHint(label.trim() === "")}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-city">Город *</Label>
              <Input
                id="vacancy-city"
                placeholder="Например, Сургут"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {requiredHint(city.trim() === "")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancy-region">Регион *</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
                <SelectTrigger id="vacancy-region" className="w-full">
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map(([value, text]) => (
                    <SelectItem key={value} value={value}>
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requiredHint(region === "")}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Тип трудоустройства *</Label>
            <div className="flex flex-wrap gap-1.5">
              {employmentTypeOptions.map(([value, text]) => (
                <Badge
                  key={value}
                  asChild
                  className={`cursor-pointer border-transparent font-normal ${
                    employmentTypes.includes(value)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={employmentTypes.includes(value)}
                    onClick={() => toggleType(value)}
                  >
                    {text}
                  </button>
                </Badge>
              ))}
            </div>
            {triedSubmit && employmentTypes.length === 0 && (
              <p className="text-xs text-red-600">Выберите хотя бы один тип</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vacancy-description">Описание *</Label>
            <Textarea
              id="vacancy-description"
              rows={3}
              placeholder="Чем предстоит заниматься, ключевые требования"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {requiredHint(description.trim() === "")}
          </div>

          <Separator className="my-1" />

          <HhVacancyIdField
            value={hhVacancyId}
            onChange={setHhVacancyId}
            currentLabel={label}
            duplicateOf={duplicate?.label ?? null}
            showRequiredError={triedSubmit}
            autoFocus={focusHhId}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Сохраняю..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
