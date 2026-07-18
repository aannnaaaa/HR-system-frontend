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
import type { SaveCandidatePayload } from "../lib/api";

interface SaveCandidateDialogProps {
  // Кандидат-предпросмотр из живого поиска hh.ru (id/region/experience/
  // educationLevel/educationProfile уже известны, остальное — нет).
  previewCandidate: Candidate;
  onClose: () => void;
  onSubmit: (payload: SaveCandidatePayload) => Promise<void>;
}

const employmentTypeOptions = Object.entries(employmentTypeLabels) as [EmploymentType, string][];

/**
 * Форма дозаполнения обязательных полей перед сохранением кандидата в БД
 * (POST /api/candidates требует name/email/phone/specialty/employmentTypes,
 * которых нет в данных живого поиска hh.ru — их вписывает HR вручную,
 * посмотрев резюме глазами на сайте hh.ru).
 */
export function SaveCandidateDialog({
  previewCandidate,
  onClose,
  onSubmit,
}: SaveCandidateDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [profession, setProfession] = useState(previewCandidate.educationProfile ?? "");
  const [platformLink, setPlatformLink] = useState(
    `https://hh.ru/resume/${previewCandidate.id}`
  );
  const [selectedTypes, setSelectedTypes] = useState<EmploymentType[]>([]);
  const [relocationReady, setRelocationReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: EmploymentType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  const isValid =
    name.trim() && email.trim() && phone.trim() && specialty.trim() &&
    profession.trim() && platformLink.trim() && selectedTypes.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        platformLink: platformLink.trim(),
        profession: profession.trim(),
        specialty: specialty.trim(),
        region: previewCandidate.region,
        relocationReady,
        experience: previewCandidate.experience,
        educationLevel: previewCandidate.educationLevel,
        educationProfile: previewCandidate.educationProfile,
        employmentTypes: selectedTypes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось сохранить кандидата");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Сохранить кандидата</DialogTitle>
          <DialogDescription>
            Данные ниже не отдаёт hh.ru через API — впишите их вручную,
            посмотрев резюме на сайте.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="save-name">ФИО *</Label>
            <Input id="save-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="save-email">Email *</Label>
            <Input
              id="save-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="save-phone">Телефон *</Label>
            <Input id="save-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="save-profession">Профессия *</Label>
            <Input
              id="save-profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="save-specialty">Сфера деятельности *</Label>
            <Input
              id="save-specialty"
              placeholder="Например, Геология и разведка недр"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="save-link">Ссылка на резюме *</Label>
            <Input
              id="save-link"
              value={platformLink}
              onChange={(e) => setPlatformLink(e.target.value)}
              required
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
              {isSaving ? "Сохраняю..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}