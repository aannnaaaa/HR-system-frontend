import type { Candidate, Region } from "../types";
import { regionLabels } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Clock, GraduationCap, Mail, Phone } from "lucide-react";

interface CandidateModalProps {
  candidate: Candidate;
  vacancyLabel: string;
  onClose: () => void;
  // Необязательный: если не передать — кнопка "Выбрать вакансию" не
  // рендерится, модалка работает в режиме "только посмотреть" (например,
  // для уже поданной заявки в "Моих заявках" — там повторный выбор не
  // имеет смысла и создал бы дубликат).
  onSelect?: (candidate: Candidate) => void;
}

const DASH = "—";

export function CandidateModal({
  candidate,
  vacancyLabel,
  onClose,
  onSelect,
}: CandidateModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{candidate.name ?? candidate.educationProfile ?? "Кандидат"}</DialogTitle>
          <DialogDescription>
            {candidate.educationProfile ?? DASH} • {candidate.platform}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <ModalField icon={<MapPin className="size-4" />} label="Регион">
            {regionLabels[candidate.region as Region] ?? candidate.region}
            {candidate.relocationReady && (
              <Badge className="ml-2 border-transparent bg-blue-100 font-normal text-blue-700 hover:bg-blue-100">
                Готов к переезду
              </Badge>
            )}
          </ModalField>

          <ModalField icon={<Clock className="size-4" />} label="Стаж">
            {candidate.experience} лет
          </ModalField>

          <ModalField icon={<GraduationCap className="size-4" />} label="Образование">
            {candidate.educationLevel ?? DASH} • {candidate.educationProfile ?? DASH}
          </ModalField>

          <ModalField icon={<Mail className="size-4" />} label="Email">
            {candidate.email ?? DASH}
          </ModalField>

          <ModalField icon={<Phone className="size-4" />} label="Телефон">
            {candidate.phone ?? DASH}
          </ModalField>
        </div>

        <Separator />

        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Связанная вакансия
          </div>
          <div className="mt-0.5 text-sm">{vacancyLabel}</div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          {onSelect && (
            <Button onClick={() => onSelect(candidate)}>Выбрать вакансию</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModalField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}