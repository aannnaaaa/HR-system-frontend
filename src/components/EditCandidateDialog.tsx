import { useState } from "react";
import type { Candidate, EmploymentType } from "../types";
import { employmentTypeLabels } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { isUnfilled, withPlaceholder, type SaveCandidatePayload } from "../lib/api";

interface EditCandidateDialogProps {
  candidate: Candidate;
  onClose: () => void;
  onSubmit: (payload: Partial<SaveCandidatePayload>) => Promise<void>;
}

const employmentTypeOptions = Object.entries(employmentTypeLabels) as [EmploymentType, string][];

// Если поле раньше сохранили как плейсхолдер "—" — показываем пустое поле
// ввода, а не буквальный дефис, чтобы не приходилось его стирать вручную.
function editableValue(value?: string | null): string {
  return isUnfilled(value) ? "" : value ?? "";
}

/**
 * Форма дозаполнения данных кандидата, когда они наконец стали известны
 * (резюме посмотрели, узнали контакты и т.д.) — сохранённого при
 * SaveCandidateDialog плейсхолдера "—" уже недостаточно.
 */
export function EditCandidateDialog({ candidate, onClose, onSubmit }: EditCandidateDialogProps) {
  const [name, setName] = useState(editableValue(candidate.name));
  const [email, setEmail] = useState(editableValue(candidate.email));
  const [phone, setPhone] = useState(editableValue(candidate.phone));
  const [profession, setProfession] = useState(editableValue(candidate.profession));
  const [specialty, setSpecialty] = useState(editableValue(candidate.specialty));
  const [platformLink, setPlatformLink] = useState(editableValue(candidate.platformLink));
  const [selectedTypes, setSelectedTypes] = useState<EmploymentType[]>(
    candidate.employmentTypes ?? []
  );
  const [relocationReady, setRelocationReady] = useState(candidate.relocationReady);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: EmploymentType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  const isValid = selectedTypes.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: withPlaceholder(name),
        email: withPlaceholder(email),
        phone: withPlaceholder(phone),
        profession: withPlaceholder(profession),
        specialty: withPlaceholder(specialty),
        platformLink: withPlaceholder(platformLink),
        relocationReady,
        employmentTypes: selectedTypes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось сохранить изменения");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Изменить данные кандидата</DialogTitle>
          <DialogDescription>
            Дозаполните то, что узнали — остальное можно оставить пустым и
            вернуться позже.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">ФИО</Label>
            <Input
              id="edit-name"
              placeholder="Пока неизвестно"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="Пока неизвестно"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Телефон</Label>
            <Input
              id="edit-phone"
              placeholder="Пока неизвестно"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-profession">Профессия</Label>
            <Input
              id="edit-profession"
              placeholder="Пока неизвестно"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-specialty">Сфера деятельности</Label>
            <Input
              id="edit-specialty"
              placeholder="Пока неизвестно"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-link">Ссылка на резюме</Label>
            <Input
              id="edit-link"
              value={platformLink}
              onChange={(e) => setPlatformLink(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Тип трудоустройства *</Label>
            <div className="flex flex-wrap gap-1.5">
              {employmentTypeOptions.map(([value, label]) => (
                <Badge
                  key={value}
                  onClick={() => toggleType(value)}
                  className={`cursor-pointer border-transparent font-normal ${
                    selectedTypes.includes(value)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={relocationReady}
              onChange={(e) => setRelocationReady(e.target.checked)}
            />
            Готов к переезду
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Отмена
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? "Сохраняю..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}