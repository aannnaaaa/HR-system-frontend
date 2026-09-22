import type { Vacancy, Region } from "../types";
import { employmentTypeLabels, regionLabels } from "../types";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertTriangle, ExternalLink, Hash, Inbox, Landmark, MapPin, Pencil } from "lucide-react";
import { getHHVacancyUrl } from "../lib/api";
import { newResponsesLabel } from "../lib/format";

interface VacancyCardProps {
  vacancy: Vacancy;
  mode?: "search" | "manage";
  newResponsesCount?: number;
  onOpenResponses?: (vacancy: Vacancy) => void;
  onEdit?: (vacancy: Vacancy, options?: { focusHhId?: boolean }) => void;
}

export function VacancyCard({
  vacancy,
  mode = "search",
  newResponsesCount = 0,
  onOpenResponses,
  onEdit,
}: VacancyCardProps) {
  const isManage = mode === "manage";
  const hhId = vacancy.hhVacancyId;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-4">
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-snug">{vacancy.label}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {vacancy.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Landmark className="size-3.5" />
              {regionLabels[vacancy.region as Region] ?? vacancy.region}
            </span>
            {isManage && hhId && (
              <a
                href={getHHVacancyUrl(hhId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
              >
                <Hash className="size-3.5" />
                hh {hhId}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge className="border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100">Открыта</Badge>

          {isManage && hhId && newResponsesCount > 0 && (
            <Badge asChild className="cursor-pointer border-transparent bg-blue-600 text-white hover:bg-blue-700">
              <button type="button" onClick={() => onOpenResponses?.(vacancy)}>
                <Inbox />
                {newResponsesLabel(newResponsesCount)}
              </button>
            </Badge>
          )}

          {isManage && hhId && newResponsesCount === 0 && (
            <Badge asChild variant="secondary" className="cursor-pointer font-normal">
              <button type="button" onClick={() => onOpenResponses?.(vacancy)}>
                <Inbox />
                Отклики
              </button>
            </Badge>
          )}

          {isManage && !hhId && (
            <Badge
              asChild
              className="cursor-pointer border-transparent bg-amber-100 font-normal text-amber-800 hover:bg-amber-200"
            >
              <button type="button" onClick={() => onEdit?.(vacancy, { focusHhId: true })}>
                <AlertTriangle />
                Не связана с hh.ru
              </button>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4">
        {vacancy.description && (
          <p className={`text-[13px] text-muted-foreground ${isManage ? "line-clamp-2" : ""}`}>
            {vacancy.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {vacancy.employmentTypes.map((type) => (
            <Badge key={type} variant="secondary" className="font-normal">
              {employmentTypeLabels[type]}
            </Badge>
          ))}
        </div>

        {isManage && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onEdit?.(vacancy)}>
              <Pencil className="size-3.5" />
              Изменить
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
