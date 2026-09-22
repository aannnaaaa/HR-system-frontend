import { useMemo, useState } from "react";
import { Bell, Clock, ExternalLink, Inbox, Loader2, MapPin } from "lucide-react";

import type { Application, Candidate, Vacancy, VacancyResponse } from "../types";
import type { ResponsesState } from "../hooks/useVacancyResponses";
import {
  getHHResumeAsCandidate,
  saveCandidate,
  type ApiError,
  type SaveCandidatePayload,
} from "../lib/api";
import { formatExperienceMonths, formatRelative } from "../lib/format";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { CandidateModal } from "./CandidateModal";
import { SaveCandidateDialog } from "./SaveCandidateDialog";

interface NotificationsBellProps {
  vacancies: Vacancy[];
  byVacancy: Record<string, ResponsesState>;
  viewedIds: Set<string>;
  markViewed: (responseId: string) => void;
  totalNew: number;
  applications: Application[];
  onAddApplication: (app: Application) => void;
}

interface FeedEntry {
  response: VacancyResponse;
  vacancy: Vacancy;
}

interface OpenedResponse {
  candidate: Candidate;
  response: VacancyResponse;
  vacancy: Vacancy;
}

const MAX_ITEMS = 20;

export function NotificationsBell({
  vacancies,
  byVacancy,
  viewedIds,
  markViewed,
  totalNew,
  applications,
  onAddApplication,
}: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [loadingResponseId, setLoadingResponseId] = useState<string | null>(null);
  const [opened, setOpened] = useState<OpenedResponse | null>(null);
  const [toSave, setToSave] = useState<OpenedResponse | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const feed = useMemo<FeedEntry[]>(() => {
    const list: FeedEntry[] = [];
    for (const vacancy of vacancies) {
      if (!vacancy.hhVacancyId) continue;
      const state = byVacancy[vacancy.id];
      if (!state) continue;
      for (const response of state.items) {
        list.push({ response, vacancy });
      }
    }
    return list
      .sort((a, b) => b.response.createdAt.localeCompare(a.response.createdAt))
      .slice(0, MAX_ITEMS);
  }, [vacancies, byVacancy]);

  const fresh = feed.filter((e) => !viewedIds.has(e.response.id));
  const viewed = feed.filter((e) => viewedIds.has(e.response.id));

  function findSavedApplication(resumeId: string | null): Application | undefined {
    if (!resumeId) return undefined;
    return applications.find((app) => app.candidate.platformLink?.includes(resumeId));
  }

  async function handleOpen(entry: FeedEntry) {
    const { response, vacancy } = entry;

    if (!response.resumeId) {
      markViewed(response.id);
      if (vacancy.hhVacancyId) {
        window.open(
          `https://hh.ru/vacancy/${vacancy.hhVacancyId}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
      return;
    }

    setLoadingResponseId(response.id);
    try {
      const candidate = await getHHResumeAsCandidate(response.resumeId);
      markViewed(response.id);
      setOpened({ candidate, response, vacancy });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.authUrl) {
        setAuthUrl(apiErr.authUrl);
      } else {
        alert(apiErr.message ?? "Не удалось открыть резюме");
      }
    } finally {
      setLoadingResponseId(null);
    }
  }

  async function handleSaveCandidate(payload: SaveCandidatePayload) {
    if (!toSave) return;
    const saved = await saveCandidate({
      ...payload,
      source: "response",
      vacancyId: toSave.vacancy.id,
      respondedAt: toSave.response.createdAt,
    });
    const now = new Date().toISOString();
    onAddApplication({
      id: `candidate-${saved.id}`,
      candidateId: saved.id,
      vacancyId: toSave.vacancy.id,
      vacancyLabel: toSave.vacancy.label,
      status: saved.status ?? "new",
      candidate: {
        ...saved,
        source: saved.source ?? "response",
        vacancyId: saved.vacancyId ?? toSave.vacancy.id,
        respondedAt: saved.respondedAt ?? toSave.response.createdAt,
      },
      createdAt: now,
      updatedAt: now,
    });
    setToSave(null);
    alert("Кандидат сохранён и добавлен в заявки!");
  }

  const savedForOpened = opened ? findSavedApplication(opened.response.resumeId) : undefined;

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative text-muted-foreground">
            <Bell className="size-4" />
            {totalNew > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
              >
                {totalNew > 99 ? "99+" : totalNew}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-96 p-0">
          <div className="px-4 py-3">
            <span className="text-sm font-bold">Уведомления</span>
          </div>
          <Separator />
          <div className="max-h-96 overflow-y-auto">
            {feed.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Пока нет откликов по вакансиям с указанным ID hh.ru
              </p>
            )}

            {fresh.map((entry) => (
              <FeedRow
                key={entry.response.id}
                entry={entry}
                isNew
                isLoading={loadingResponseId === entry.response.id}
                onOpen={() => handleOpen(entry)}
              />
            ))}

            {viewed.length > 0 && (
              <>
                {fresh.length > 0 && (
                  <div className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Просмотренные
                  </div>
                )}
                {viewed.map((entry) => (
                  <FeedRow
                    key={entry.response.id}
                    entry={entry}
                    isLoading={loadingResponseId === entry.response.id}
                    onOpen={() => handleOpen(entry)}
                  />
                ))}
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {opened && (
        <CandidateModal
          candidate={opened.candidate}
          vacancyLabel={`${opened.vacancy.label} • ${opened.vacancy.city}`}
          fieldLabel="Вакансия"
          source="response"
          respondedAt={opened.response.createdAt}
          selectLabel="Взять в работу"
          savedStatus={savedForOpened?.status}
          onClose={() => setOpened(null)}
          onSelect={() => {
            setToSave(opened);
            setOpened(null);
          }}
        />
      )}

      {toSave && (
        <SaveCandidateDialog
          previewCandidate={toSave.candidate}
          vacancyLabel={toSave.vacancy.label}
          onClose={() => setToSave(null)}
          onSubmit={handleSaveCandidate}
        />
      )}

      <Dialog open={!!authUrl} onOpenChange={(next) => !next && setAuthUrl(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Нужна авторизация в HH</DialogTitle>
            <DialogDescription>
              Токен работодателя истёк или отсутствует. Авторизуйтесь заново,
              чтобы посмотреть резюме.
            </DialogDescription>
          </DialogHeader>
          <Button asChild>
            <a href={authUrl ?? "#"} target="_blank" rel="noopener noreferrer">
              Авторизоваться в HH
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FeedRow({
  entry,
  isNew,
  isLoading,
  onOpen,
}: {
  entry: FeedEntry;
  isNew?: boolean;
  isLoading: boolean;
  onOpen: () => void;
}) {
  const { response, vacancy } = entry;
  return (
    <DropdownMenuItem
      className="flex items-start gap-3 rounded-none px-4 py-3"
      onSelect={(e) => {
        e.preventDefault();
        onOpen();
      }}
    >
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${isNew ? "bg-blue-600" : "bg-transparent"}`}
        aria-label={isNew ? "Новый отклик" : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-normal">
        <span className="truncate text-sm font-bold">
          {response.name ?? response.resumeTitle ?? "Кандидат"}
        </span>
        <span className="truncate text-[13px] text-muted-foreground">{vacancy.label}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {response.area && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {response.area}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatExperienceMonths(response.experienceMonths)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Inbox className="size-3.5" />
            {formatRelative(response.createdAt)}
          </span>
        </div>
      </div>
      {isLoading && <Loader2 className="mt-1 size-3.5 shrink-0 animate-spin" />}
    </DropdownMenuItem>
  );
}