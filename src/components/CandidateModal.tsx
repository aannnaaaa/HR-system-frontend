import { useState } from "react";
import type { ApplicationStatus, Candidate, CandidateSource, Region } from "../types";
import { applicationStatusLabels, regionLabels } from "../types";
import { SourceBadge } from "./SourceBadge";
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
import {
  MapPin,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  Eye,
  ExternalLink,
  AlertTriangle,
  Link,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getHHResumeUrl, revealResumeContact, checkResumeContact } from "../lib/api";

export type CandidateContacts = { email?: string | null; phone?: string | null };

type ContactAction = "check" | "reveal";

type ContactStatus =
  | { kind: "idle" }
  | { kind: "loading"; action: ContactAction }
  | { kind: "found" }
  | { kind: "empty"; action: ContactAction }
  | { kind: "error"; message: string };

interface CandidateModalProps {
  candidate: Candidate;
  vacancyLabel: string;
  onClose: () => void;
  onSelect?: (candidate: Candidate) => void;
  onCheckContact?: (candidate: Candidate) => Promise<CandidateContacts | null>;
  onRevealContact?: (candidate: Candidate) => Promise<CandidateContacts | null>;
  fieldLabel?: string;
  source?: CandidateSource | null;
  respondedAt?: string | null;
  selectLabel?: string;
  savedStatus?: ApplicationStatus;
}

const DASH = "—";

function hasAny(c?: CandidateContacts | null): c is CandidateContacts {
  return Boolean(c?.email || c?.phone);
}

export function CandidateModal({
  candidate,
  vacancyLabel,
  onClose,
  onSelect,
  onCheckContact = (c) => checkResumeContact(c.id),
  onRevealContact = (c) => revealResumeContact(c.id),
  fieldLabel = "Профессия",
  source,
  respondedAt,
  selectLabel = "Выбрать вакансию",
  savedStatus,
}: CandidateModalProps) {
  const [contacts, setContacts] = useState<CandidateContacts>({
    email: candidate.email,
    phone: candidate.phone,
  });
  const [status, setStatus] = useState<ContactStatus>({ kind: "idle" });

  const email = contacts.email ?? candidate.email;
  const phone = contacts.phone ?? candidate.phone;
  const hasContacts = Boolean(email || phone);
  const isLoading = status.kind === "loading";
  const loadingAction = status.kind === "loading" ? status.action : null;
  const showContactBlock = !hasContacts && (!!onCheckContact || !!onRevealContact);

  async function run(
    action: ContactAction,
    handler?: (c: Candidate) => Promise<CandidateContacts | null>,
  ) {
    if (!handler) return;
    setStatus({ kind: "loading", action });
    try {
      const result = await handler(candidate);
      if (hasAny(result)) {
        setContacts({ email: result.email ?? null, phone: result.phone ?? null });
        setStatus({ kind: "found" });
      } else {
        setStatus({ kind: "empty", action });
      }
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Не удалось получить контакты",
      });
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{candidate.name ?? candidate.educationProfile ?? "Кандидат"}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {candidate.educationProfile ?? DASH} • {candidate.platform ?? "hh.ru"}
            </span>
            {source && <SourceBadge source={source} respondedAt={respondedAt} />}
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
            {email ?? DASH}
          </ModalField>

          <ModalField icon={<Phone className="size-4" />} label="Телефон">
            {phone ?? DASH}
          </ModalField>

          {candidate.platformLink && (
            <ModalField icon={<Link className="size-4" />} label="Резюме">
              <a
                href={candidate.platformLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline"
              >
                Открыть резюме
                <ExternalLink className="size-3.5" />
              </a>
            </ModalField>
          )}

          {status.kind === "found" && (
            <div className="flex items-center gap-2 text-xs text-green-700">
              <CheckCircle2 className="size-3.5" />
              Контакты получены
            </div>
          )}

          {showContactBlock && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Контакты hh.ru скрыты. «Проверить контакт» бесплатно смотрит, не открыт ли
                  контакт уже. «Посмотреть контакт» откроет его через аккаунт работодателя —
                  обычно платно, списывает лимит. «Открыть на hh.ru» покажет резюме на самом
                  hh.ru без раскрытия контактов.
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {onCheckContact && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => run("check", onCheckContact)}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`size-3.5 ${loadingAction === "check" ? "animate-spin" : ""}`}
                    />
                    {loadingAction === "check" ? "Проверяем..." : "Проверить контакт"}
                  </Button>
                )}

                {onRevealContact && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => run("reveal", onRevealContact)}
                    disabled={isLoading}
                  >
                    <Eye className="size-3.5" />
                    {loadingAction === "reveal" ? "Открываем..." : "Посмотреть контакт"}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    window.open(getHHResumeUrl(candidate.id), "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="size-3.5" />
                  Открыть на hh.ru
                </Button>
              </div>

              {status.kind === "empty" && (
                <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <XCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    {status.action === "check"
                      ? "В ответе API контактов нет — резюме ещё не открывалось вашим аккаунтом."
                      : "hh.ru не вернул контакты. Попробуйте «Проверить контакт» чуть позже или откройте резюме на hh.ru."}
                  </span>
                </div>
              )}

              {status.kind === "error" && (
                <div className="mt-2 flex items-start gap-2 text-xs text-red-700">
                  <XCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {fieldLabel}
          </div>
          <div className="mt-0.5 text-sm">{vacancyLabel}</div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          {savedStatus ? (
            <span className="self-center text-sm text-muted-foreground">
              Уже в заявках • {applicationStatusLabels[savedStatus]}
            </span>
          ) : (
            onSelect && <Button onClick={() => onSelect(candidate)}>{selectLabel}</Button>
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
