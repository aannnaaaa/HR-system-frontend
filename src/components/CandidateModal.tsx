import { useState } from "react";
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
import { MapPin, Clock, GraduationCap, Mail, Phone, Eye, ExternalLink, AlertTriangle } from "lucide-react";
import { getHHResumeUrl } from "../lib/api";

interface CandidateModalProps {
  candidate: Candidate;
  vacancyLabel: string;
  onClose: () => void;
  // Необязательный: если не передать — кнопка "Выбрать вакансию" не
  // рендерится (режим "только просмотр", например в "Моих заявках").
  onSelect?: (candidate: Candidate) => void;
  // Необязательный: если передан — рендерится блок "Посмотреть контакт"
  // (используется только для предпросмотра живого поиска hh.ru, когда
  // контакты ещё не раскрыты и не сохранены).
  onRevealContact?: (candidate: Candidate) => Promise<void>;
}

const DASH = "—";

export function CandidateModal({
  candidate,
  vacancyLabel,
  onClose,
  onSelect,
  onRevealContact,
}: CandidateModalProps) {
  const [isRevealing, setIsRevealing] = useState(false);

  const hasContacts = Boolean(candidate.email || candidate.phone);
  const canRevealContact = !hasContacts && !!onRevealContact;

  async function handleRevealContact() {
    if (!onRevealContact) return;
    setIsRevealing(true);
    try {
      await onRevealContact(candidate);
    } finally {
      setIsRevealing(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{candidate.name ?? candidate.educationProfile ?? "Кандидат"}</DialogTitle>
          <DialogDescription>
            {candidate.educationProfile ?? DASH} • {candidate.platform ?? "hh.ru"}
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

          {canRevealContact && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Контакты hh.ru скрыты, пока их не открыл ваш аккаунт
                  работодателя на hh.ru (обычно платно). Кнопка ниже просто
                  проверяет, доступны ли они уже — если нет, контакты
                  всё равно останутся скрытыми.
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleRevealContact}
                  disabled={isRevealing}
                >
                  <Eye className="size-3.5" />
                  {isRevealing ? "Открываем..." : "Посмотреть контакт"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => window.open(getHHResumeUrl(candidate.id), "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="size-3.5" />
                  Открыть на hh.ru
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Профессия
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