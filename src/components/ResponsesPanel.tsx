import type { Vacancy, VacancyResponse } from "../types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Clock, ExternalLink, Eye, Inbox, Loader2, MapPin, RotateCw } from "lucide-react";
import { formatExperienceMonths, formatRelative, newResponsesLabel } from "../lib/format";
import { getHHVacancyUrl } from "../lib/api";
import type { ResponsesState } from "../hooks/useVacancyResponses";

interface ResponsesPanelProps {
  vacancy: Vacancy;
  state: ResponsesState | undefined;
  viewedIds: Set<string>;
  openingResponseId: string | null;
  onOpenResponse: (response: VacancyResponse) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function ResponsesPanel({
  vacancy,
  state,
  viewedIds,
  openingResponseId,
  onOpenResponse,
  onRefresh,
  onClose,
}: ResponsesPanelProps) {
  const items = state?.items ?? [];
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const fresh = sorted.filter((r) => !viewedIds.has(r.id));
  const viewed = sorted.filter((r) => viewedIds.has(r.id));
  const isLoading = !state || state.status === "loading";

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Отклики</SheetTitle>
          <SheetDescription>
            {vacancy.label} • hh.ru
            {state?.status === "ready" && ` • ${newResponsesLabel(fresh.length)}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto border-t bg-slate-50 p-4">
          {isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Загружаю отклики...</p>
          )}

          {state?.status === "error" && (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-red-600">Не удалось получить отклики с hh.ru. {state.error}</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={onRefresh}>
                <RotateCw className="size-3.5" />
                Повторить
              </Button>
            </div>
          )}

          {state?.status === "ready" && items.length === 0 && (
            <Card className="items-center gap-1 border-dashed py-10 text-center">
              <div className="font-bold">Откликов пока нет</div>
              <div className="text-sm text-muted-foreground">
                Как только кандидат откликнется на hh.ru, он появится здесь.
              </div>
            </Card>
          )}

          {items.length > 0 && fresh.length === 0 && (
            <p className="text-sm text-muted-foreground">Новых откликов нет – все просмотрены.</p>
          )}

          {fresh.map((r) => (
            <ResponseRow
              key={r.id}
              response={r}
              isNew
              isOpening={openingResponseId === r.id}
              onOpen={() => onOpenResponse(r)}
            />
          ))}

          {viewed.length > 0 && (
            <>
              <div className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Просмотренные
              </div>
              {viewed.map((r) => (
                <ResponseRow
                  key={r.id}
                  response={r}
                  isOpening={openingResponseId === r.id}
                  onOpen={() => onOpenResponse(r)}
                />
              ))}
            </>
          )}
        </div>

        <SheetFooter>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RotateCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Обновить
          </button>
          {vacancy.hhVacancyId && (
            <a
              href={getHHVacancyUrl(vacancy.hhVacancyId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Вакансия на hh.ru
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ResponseRow({
  response,
  isNew,
  isOpening,
  onOpen,
}: {
  response: VacancyResponse;
  isNew?: boolean;
  isOpening: boolean;
  onOpen: () => void;
}) {
  return (
    <Card className="flex-row items-center gap-3 px-4 py-3.5">
      <span
        className={`size-2 shrink-0 rounded-full ${isNew ? "bg-blue-600" : "bg-transparent"}`}
        aria-label={isNew ? "Новый отклик" : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-bold">
          {response.name ?? response.resumeTitle ?? "Кандидат"}
        </span>
        {response.name && response.resumeTitle && (
          <span className="truncate text-[13px] text-muted-foreground">{response.resumeTitle}</span>
        )}
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
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5"
        onClick={onOpen}
        disabled={!response.resumeId || isOpening}
      >
        {isOpening ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
        Посмотреть
      </Button>
    </Card>
  );
}
